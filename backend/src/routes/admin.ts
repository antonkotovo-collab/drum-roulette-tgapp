import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as svc from '../services/adminService';
import * as promoSvc from '../services/promoService';
import * as botCfg from '../services/botConfig';
import { uploadMediaToTelegram } from './bot';
import { loadBroadcasts } from '../lib/broadcastStore';
import { logger } from '../lib/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const STORAGE_CHAT_ID = process.env.STORAGE_CHAT_ID || process.env.BOT_OWNER_CHAT_ID || '';

function auth(req: Request, res: Response): boolean {
    const token = (req.headers['x-admin-token'] as string) || req.body?.adminToken;
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) { res.status(403).json({ error: 'Forbidden' }); return false; }
    return true;
}

router.get('/stats', async (req, res) => { if (!auth(req, res)) return; try { res.json(await svc.getStats()); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });
router.get('/activity', async (req, res) => { if (!auth(req, res)) return; try { res.json({ activity: await svc.getActivity() }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });
router.get('/scenario-stats', async (req, res) => { if (!auth(req, res)) return; try { res.json({ stats: await svc.getScenarioStats() }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });
router.get('/daily-stats', async (req, res) => { if (!auth(req, res)) return; try { res.json(await svc.getDailyStats(req.query.date as string | undefined)); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });
router.get('/hourly-activity', async (req, res) => { if (!auth(req, res)) return; try { res.json({ hours: await svc.getHourlyActivity(req.query.date as string | undefined) }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });

// Send direct message to a user
router.post('/send-message', async (req, res) => {
    if (!auth(req, res)) return;
    const { telegramId, text } = req.body as { telegramId?: string; text?: string };
    if (!telegramId || !text?.trim()) { res.status(400).json({ error: 'telegramId and text required' }); return; }
    const token = process.env.BOT_TOKEN;
    if (!token) { res.status(500).json({ error: 'BOT_TOKEN not set' }); return; }
    try {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramId, text: text.trim(), parse_mode: 'HTML' }),
        });
        const d = await r.json() as { ok: boolean; description?: string };
        if (!d.ok) { res.status(502).json({ error: d.description || 'Telegram error' }); return; }
        res.json({ ok: true });
    } catch (e) { logger.error(e); res.status(500).json({ error: 'Send failed' }); }
});


// Promos
router.get('/promos', async (req, res) => { if (!auth(req, res)) return; try { res.json(await promoSvc.listPromos()); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); } });
router.post('/promos', async (req, res) => { if (!auth(req, res)) return; try { res.json(await promoSvc.createPromo(req.body)); } catch (e: any) { logger.error(e); res.status(400).json({ error: e.message || 'Error' }); } });
router.patch('/promos/:id/toggle', async (req, res) => { if (!auth(req, res)) return; try { res.json(await promoSvc.togglePromo(Number(req.params.id))); } catch (e) { logger.error(e); res.status(500).json({ error: 'Error' }); } });
router.delete('/promos/:id', async (req, res) => { if (!auth(req, res)) return; try { await promoSvc.deletePromo(Number(req.params.id)); res.json({ ok: true }); } catch (e) { logger.error(e); res.status(500).json({ error: 'Error' }); } });
router.get('/promos/generate-code', async (req, res) => { if (!auth(req, res)) return; try { res.json({ code: await promoSvc.generateCode(req.query.prefix as string) }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

// Bot config — приветственное сообщение
router.get('/bot-config', async (req, res) => {
    if (!auth(req, res)) return;
    try { res.json(await botCfg.getWelcomeConfig()); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/bot-config/text', async (req, res) => {
    if (!auth(req, res)) return;
    const { text } = req.body;
    if (!text || typeof text !== 'string') { res.status(400).json({ error: 'text required' }); return; }
    try { await botCfg.updateWelcomeText(text); res.json({ ok: true }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/bot-config/media', upload.single('file'), async (req, res) => {
    if (!auth(req, res)) return;
    if (!req.file) { res.status(400).json({ error: 'file required' }); return; }
    if (!STORAGE_CHAT_ID) { res.status(500).json({ error: 'STORAGE_CHAT_ID not configured' }); return; }
    try {
        const result = await uploadMediaToTelegram(req.file.buffer, req.file.mimetype, req.file.originalname, STORAGE_CHAT_ID);
        if (!result) { res.status(500).json({ error: 'Upload to Telegram failed' }); return; }
        await botCfg.updateWelcomeMedia(result.fileId, result.type);
        res.json({ ok: true, fileId: result.fileId, type: result.type });
    } catch (e) { logger.error(e); res.status(500).json({ error: 'Upload error' }); }
});

router.delete('/bot-config/media', async (req, res) => {
    if (!auth(req, res)) return;
    try { await botCfg.clearWelcomeMedia(); res.json({ ok: true }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

// Public config (bot username for generating links — not sensitive)
router.get('/config', (_req, res) => {
    res.json({ botUsername: process.env.BOT_USERNAME || '' });
});


router.get('/users', async (req, res) => {
    if (!auth(req, res)) return;
    try {
        const result = await svc.getUsers({
            page: Math.max(1, Number(req.query.page) || 1),
            limit: Math.min(100, Number(req.query.limit) || 30),
            search: (req.query.search as string || '').trim(),
            scenario: req.query.scenario ? Number(req.query.scenario) : null,
            coupon: req.query.coupon as string | undefined,
        });
        res.json(result);
    } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.get('/user/:telegramId', async (req, res) => {
    if (!auth(req, res)) return;
    try {
        const user = await svc.getUserDetail(req.params.telegramId);
        if (!user) { res.status(404).json({ error: 'Not found' }); return; }
        res.json({ user });
    } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.get('/prizes', async (req, res) => {
    if (!auth(req, res)) return;
    try { res.json({ prizes: await svc.getPrizes(req.query.filter as string || 'all') }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/add-spins', async (req, res) => {
    if (!auth(req, res)) return;
    const { telegramId, count } = req.body as { telegramId?: string; count?: number };
    if (!telegramId || !count || count < 1 || count > 20) { res.status(400).json({ error: 'telegramId and count (1-20) required' }); return; }
    try { const u = await svc.addSpins(telegramId, count); res.json({ ok: true, spinsLeft: u.freeSpinsCount }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/reset-user', async (req, res) => {
    if (!auth(req, res)) return;
    const { telegramId } = req.body as { telegramId?: string };
    if (!telegramId) { res.status(400).json({ error: 'telegramId required' }); return; }
    try { const u = await svc.resetUserSpins(telegramId); res.json({ ok: true, spinsLeft: u.freeSpinsCount }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/reset-all', async (req, res) => {
    if (!auth(req, res)) return;
    try { const r = await svc.resetAllSpins(); res.json({ ok: true, count: r.count }); } catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

// ─── Media upload ─────────────────────────────────────────────────────────────
// Uploads file to Telegram, returns file_id for use in broadcast

router.post('/upload-media', upload.single('file'), async (req: any, res) => {
    if (!auth(req, res)) return;
    const file = req.file as Express.Multer.File | undefined;
    if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const token = process.env.BOT_TOKEN;
    if (!token) { res.status(500).json({ error: 'BOT_TOKEN not set' }); return; }

    // Detect media type from mime
    const mime = file.mimetype;
    let mediaType: 'photo' | 'video' | 'document';
    let tgMethod: string;
    let tgField: string;
    if (mime.startsWith('image/')) { mediaType = 'photo'; tgMethod = 'sendPhoto'; tgField = 'photo'; }
    else if (mime.startsWith('video/')) { mediaType = 'video'; tgMethod = 'sendVideo'; tgField = 'video'; }
    else { mediaType = 'document'; tgMethod = 'sendDocument'; tgField = 'document'; }

    // Send to Telegram to get file_id (chat_id = admin's Telegram ID from env or request)
    const chatId = (req.body?.previewChatId as string) || process.env.ADMIN_CHAT_ID || '';
    if (!chatId) { res.status(400).json({ error: 'ADMIN_CHAT_ID not set. Add it to .env or pass previewChatId.' }); return; }

    try {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append(tgField, new Blob([file.buffer], { type: file.mimetype }), file.originalname);

        const r = await fetch(`https://api.telegram.org/bot${token}/${tgMethod}`, {
            method: 'POST', body: form,
        });
        const data = await r.json() as any;

        if (!data.ok) {
            logger.error(data, 'Telegram upload failed');
            res.status(502).json({ error: 'Telegram error: ' + data.description });
            return;
        }

        // Extract file_id from response
        const result = data.result;
        let fileId: string;
        if (mediaType === 'photo') {
            // photo is array, take last (highest res)
            fileId = result.photo[result.photo.length - 1].file_id;
        } else if (mediaType === 'video') {
            fileId = result.video.file_id;
        } else {
            fileId = result.document.file_id;
        }

        logger.info({ mediaType, fileId }, '[Admin] Media uploaded to Telegram');
        res.json({ ok: true, fileId, mediaType, fileName: file.originalname, fileSize: file.size });
    } catch (e) {
        logger.error(e, 'Upload error');
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ─── Broadcasts ───────────────────────────────────────────────────────────────

router.get('/broadcasts', (req, res) => {
    if (!auth(req, res)) return;
    res.json({ broadcasts: loadBroadcasts().reverse() });
});

router.get('/broadcast/:id', (req, res) => {
    if (!auth(req, res)) return;
    const record = loadBroadcasts().find(r => r.id === req.params.id);
    if (!record) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(record);
});

router.post('/broadcast', async (req, res) => {
    if (!auth(req, res)) return;
    const { text, mediaUrl, mediaType, buttons } = req.body as {
        text?: string; mediaUrl?: string;
        mediaType?: 'photo' | 'video' | 'document';
        buttons?: { text: string; url: string }[];
    };
    if (!text?.trim()) { res.status(400).json({ error: 'text required' }); return; }
    if (!process.env.BOT_TOKEN) { res.status(500).json({ error: 'BOT_TOKEN not set' }); return; }
    try {
        const record = await svc.startBroadcast({ text, mediaUrl, mediaType, buttons });
        res.json({ started: true, total: record.total, id: record.id });
    } catch (e) { logger.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ─── Tracking Links ───────────────────────────────────────────────────────────

router.get('/tracking', async (req, res) => {
    if (!auth(req, res)) return;
    try { res.json({ sources: await svc.getTrackingStats() }); }
    catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.post('/tracking', async (req, res) => {
    if (!auth(req, res)) return;
    const { slug, name } = req.body as { slug?: string; name?: string };
    if (!slug || !name) { res.status(400).json({ error: 'slug and name required' }); return; }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
    if (!cleanSlug) { res.status(400).json({ error: 'Invalid slug' }); return; }
    try { res.json(await svc.createTrackingLink(cleanSlug, name)); }
    catch (e) { logger.error(e); res.status(500).json({ error: 'DB error' }); }
});

router.delete('/tracking/:slug', async (req, res) => {
    if (!auth(req, res)) return;
    try { await svc.deleteTrackingLink(req.params.slug); res.json({ ok: true }); }
    catch (e) { logger.error(e); res.status(500).json({ error: 'Not found or DB error' }); }
});

export default router;

