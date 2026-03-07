const API = '/api/admin';
let TOKEN = '';
let usersPage = 1;
let searchTimer = null;
let dashTimer = null;
let detailTelegramId = null;
let bcPollTimer = null;
let dashDate = 'today'; // 'today' | 'yesterday'

const PRIZE_META = {
    zolotoe_yabloko: { icon: '🍎', name: 'Золотое Яблоко', cls: 'badge-yellow' },
    ozon: { icon: '🛒', name: 'Ozon', cls: 'badge-blue' },
    uber: { icon: '🚗', name: 'Uber', cls: 'badge-blue' },
    yandex: { icon: '🎵', name: 'Яндекс', cls: 'badge-yellow' },
    wildberries: { icon: '🛍️', name: 'Wildberries', cls: 'badge-purple' },
    extra_spin_1: { icon: '🎰', name: '+1 спин', cls: 'badge-blue' },
    extra_spin_2: { icon: '🎲', name: '+2 спина', cls: 'badge-blue' },
    telegram_bear: { icon: '🐻', name: 'Медведь', cls: 'badge-purple' },
};
const SCENARIO_LENGTHS = [6, 7, 9, 7, 7, 7, 9, 10];
const COUPON_IDS = ['zolotoe_yabloko', 'ozon', 'uber', 'yandex', 'wildberries'];
const SPIN_LABELS = {
    nothing: '⬜ Ничего', extra_spin_1: '🎰 +1 спин', extra_spin_2: '🎲 +2 спина',
    telegram_bear: '🐻 Медведь', zolotoe_yabloko: '🍎 Золотое Яблоко',
    ozon: '🛒 Ozon', uber: '🚗 Uber', yandex: '🎵 Яндекс', wildberries: '🛍️ Wildberries',
};
const MEDIA_ICONS = { photo: '🖼', video: '🎬', document: '📄' };

// ── API ───────────────────────────────────────────────────────────────────────

async function api(path, opts = {}) {
    const r = await fetch(API + path, {
        ...opts,
        headers: { 'x-admin-token': TOKEN, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (!r.ok) throw new Error(r.status);
    return r.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function doLogin() {
    const v = document.getElementById('token-input').value.trim();
    if (!v) return;
    TOKEN = v;
    api('/stats').then(() => {
        const remember = document.getElementById('remember-me')?.checked;
        if (remember) localStorage.setItem('adminToken', TOKEN);
        else sessionStorage.setItem('adminToken', TOKEN);
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('server-host').textContent = location.hostname;
        loadDash();
        dashTimer = setInterval(loadDash, 30000);
    }).catch(() => { document.getElementById('login-error').style.display = 'block'; });
}

function doLogout() {
    sessionStorage.removeItem('adminToken');
    localStorage.removeItem('adminToken');
    TOKEN = '';
    clearInterval(dashTimer);
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    const t = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    if (t) { document.getElementById('token-input').value = t; TOKEN = t; doLogin(); }

    document.getElementById('nav').addEventListener('click', e => {
        const a = e.target.closest('a[data-sec]');
        if (!a) return;
        document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + a.dataset.sec).classList.add('active');
        // #22 update document title
        const titles = { dashboard: 'Дашборд', users: 'Пользователи', prizes: 'Призы', broadcast: 'Рассылка', tracking: 'Трекинг', promos: 'Промокоды', bot: 'Бот' };
        document.title = 'Барабан — ' + (titles[a.dataset.sec] || a.dataset.sec);
        if (a.dataset.sec === 'users') loadUsers(1);
        if (a.dataset.sec === 'prizes') loadPrizes();
        if (a.dataset.sec === 'broadcast') loadBroadcastHistory();
        if (a.dataset.sec === 'tracking') loadTracking();
        if (a.dataset.sec === 'promos') loadPromos();
        if (a.dataset.sec === 'bot') loadBotConfig();
    });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

// #3 Date filter for dashboard
function setDashDate(d) {
    dashDate = d;
    document.querySelectorAll('.dash-date-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.d === d);
    });
    loadDash();
}

async function loadDash() {
    try {
        const dateParam = dashDate === 'yesterday' ? '?date=yesterday' : '';
        const [stats, activity, scenStats, dailyStats, hourlyData] = await Promise.all([
            api('/stats'), api('/activity'), api('/scenario-stats'),
            api('/daily-stats' + dateParam), api('/hourly-activity' + dateParam),
        ]);
        document.getElementById('s-users').textContent = stats.totalUsers;
        document.getElementById('s-spins').textContent = stats.totalSpins;
        document.getElementById('s-coupons').textContent = stats.couponsWon;
        document.getElementById('s-active').textContent = stats.activeToday;
        const dateLabel = dashDate === 'yesterday' ? 'Вчера' : 'Сегодня';
        document.getElementById('dash-date-label').textContent = '🌅 ' + dateLabel;
        document.getElementById('dash-updated').textContent = 'Обновлено: ' + new Date().toLocaleTimeString('ru-RU');
        renderDailyStats(dailyStats);
        renderHourlyChart(hourlyData.hours);
        renderScenarioBars(scenStats.stats);
        // #4 Conversion funnel
        renderFunnel(stats.totalUsers, stats.totalSpins, stats.couponsWon, dailyStats.payClicksToday);
    } catch { toast('Ошибка дашборда', false); }
}

// #4 Conversion funnel
function renderFunnel(users, spins, coupons, payClicks) {
    const el = document.getElementById('conv-funnel');
    if (!el) return;
    const spinsPerUser = users > 0 ? (spins / users).toFixed(1) : 0;
    const couponRate = spins > 0 ? Math.round(coupons / spins * 100) : 0;
    const payRate = coupons > 0 ? Math.round(payClicks / coupons * 100) : 0;
    el.innerHTML = `
        <div class="funnel-row">
            <span class="funnel-icon">👥</span>
            <span class="funnel-val">${users}</span>
            <span class="funnel-lbl">Юзеров всего</span>
            <span class="funnel-arrow">→</span>
            <span class="funnel-sub">${spinsPerUser} спинов/юзер</span>
        </div>
        <div class="funnel-row">
            <span class="funnel-icon">🎰</span>
            <span class="funnel-val">${spins}</span>
            <span class="funnel-lbl">Спинов всего</span>
            <span class="funnel-arrow">→</span>
            <span class="funnel-sub">${couponRate}% конверсия в купон</span>
        </div>
        <div class="funnel-row">
            <span class="funnel-icon">🎁</span>
            <span class="funnel-val">${coupons}</span>
            <span class="funnel-lbl">Купонов выдано</span>
            <span class="funnel-arrow">→</span>
            <span class="funnel-sub">${payRate}% нажали Pay</span>
        </div>
        <div class="funnel-row">
            <span class="funnel-icon">💳</span>
            <span class="funnel-val">${payClicks}</span>
            <span class="funnel-lbl">Pay Click (2₽)</span>
        </div>`;
}

function renderDailyStats(d) {
    document.getElementById('s-new-today').textContent = d.newUsersToday;
    document.getElementById('s-spins-today').textContent = d.spinsToday;
    document.getElementById('s-scenario-today').textContent = d.scenarioCompletedToday;
    document.getElementById('s-pay-today').textContent = d.payClicksToday;
}

function renderHourlyChart(hours) {
    const el = document.getElementById('hourly-chart');
    if (!hours || !hours.length) { el.innerHTML = '<span style="color:var(--muted);font-size:12px">Нет данных</span>'; return; }

    const W = el.clientWidth || 500;
    const H = 100;
    const padL = 28, padR = 8, padT = 8, padB = 20;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const maxVal = Math.max(...hours.map(h => Math.max(h.spins, h.users)), 1);
    const n = hours.length;

    function px(i) { return padL + (i / (n - 1 || 1)) * innerW; }
    function py(v) { return padT + innerH - (v / maxVal) * innerH; }

    function polyline(key, color) {
        const pts = hours.map((h, i) => `${px(i)},${py(h[key])}`).join(' ');
        return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    }

    function dots(key, color) {
        return hours.map((h, i) => {
            if (h[key] === 0) return '';
            return `<circle cx="${px(i)}" cy="${py(h[key])}" r="3" fill="${color}"/>`;
        }).join('');
    }

    // Y-axis labels (0, mid, max)
    const yLabels = [0, Math.round(maxVal / 2), maxVal].map(v => {
        const y = py(v);
        return `<text x="${padL - 4}" y="${y + 4}" text-anchor="end" font-size="9" fill="rgba(196,181,253,.45)">${v}</text>
                <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(147,51,234,.1)" stroke-dasharray="3,3"/>`;
    }).join('');

    // X-axis hour labels — show every 4 hours
    const xLabels = hours.filter((_, i) => i % 4 === 0).map((h, _, arr) => {
        const idx = hours.indexOf(h);
        return `<text x="${px(idx)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="rgba(196,181,253,.45)">${String(h.hour).padStart(2, '0')}:00</text>`;
    }).join('');

    el.innerHTML = `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        ${yLabels}
        ${polyline('spins', '#a855f7')}
        ${polyline('users', '#22d3ee')}
        ${dots('spins', '#a855f7')}
        ${dots('users', '#22d3ee')}
        ${xLabels}
    </svg>`;
}

function renderScenarioBars(stats) {
    const max = Math.max(...stats.map(s => s.total), 1);
    document.getElementById('scenario-bars').innerHTML = stats.map(s =>
        `<div class="sce-row">
      <span class="sce-label">С${s.scenario}</span>
      <div class="sce-track"><div class="sce-fill" style="width:${Math.max(4, Math.round(s.total / max * 100))}%"></div></div>
      <span class="sce-count">${s.total}</span>
    </div>`
    ).join('');
}


// ── Users ─────────────────────────────────────────────────────────────────────

function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadUsers(1), 400); }

async function loadUsers(page = 1) {
    usersPage = page;
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td class="loading-cell" colspan="7"><div class="skel skel-row"></div><div class="skel skel-row"></div></td></tr>';
    const search = document.getElementById('search-input').value.trim();
    const scenario = document.getElementById('filter-scenario').value;
    const coupon = document.getElementById('filter-coupon').value;
    const params = new URLSearchParams({ page, limit: 30, search, ...(scenario ? { scenario } : {}), ...(coupon ? { coupon } : {}) });
    try {
        const d = await api('/users?' + params);
        tbody.innerHTML = d.users.length ? d.users.map((u, i) => {
            const pct = u.scenarioMax > 0 ? Math.round(u.scenarioStep / u.scenarioMax * 100) : 0;
            return `<tr onclick="openDetail('${u.telegramId}')">
        <td style="color:var(--muted)">${(page - 1) * 30 + i + 1}</td>
        <td>
          <div style="font-weight:600">${esc(u.name || '—')}</div>
          <div style="font-size:11px;color:var(--muted);font-family:monospace">${u.telegramId}
            <span class="copy-btn" onclick="event.stopPropagation();copyText('${u.telegramId}')">📋</span>
          </div>
        </td>
        <td>
          <span class="badge badge-purple" style="margin-bottom:4px;display:inline-flex">С${u.scenario}</span>
          <div class="progress-wrap">
            <div class="progress-track"><div class="progress-fill ${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></div></div>
            <span class="progress-txt">${u.scenarioStep}/${u.scenarioMax}</span>
          </div>
        </td>
        <td><span class="badge ${u.spinsLeft > 0 ? 'badge-green' : 'badge-red'}">${u.spinsLeft}</span></td>
        <td>${u.couponWon ? `<span class="badge badge-yellow">✅ ${PRIZE_META[u.couponWon]?.name || u.couponWon}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(u.createdAt)}</td>
        <td>
          <div class="row-actions" onclick="event.stopPropagation()">
            <button class="btn btn-danger btn-sm" onclick="confirmAction('Сбросить сценарий?','spinsUsed=0, freeSpinsCount=4',()=>resetUser('${u.telegramId}'))">↺</button>
          </div>
        </td>
      </tr>`;
        }).join('') : '<tr><td colspan="7" class="loading-cell" style="color:var(--muted)">Нет результатов</td></tr>';
        renderPagination(d.page, d.pages, 'users-pag', loadUsers);
    } catch { toast('Ошибка загрузки', false); }
}

function renderPagination(page, pages, elId, loadFn) {
    const el = document.getElementById(elId);
    if (pages <= 1) { el.innerHTML = ''; return; }
    let html = `<button class="page-btn" onclick="${loadFn.name}(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Назад</button>`;
    const s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
    if (s > 1) html += `<button class="page-btn" onclick="${loadFn.name}(1)">1</button>${s > 2 ? '<span style="color:var(--muted)">…</span>' : ''}`;
    for (let p = s; p <= e; p++) html += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="${loadFn.name}(${p})">${p}</button>`;
    if (e < pages) html += `${e < pages - 1 ? '<span style="color:var(--muted)">…</span>' : ''}<button class="page-btn" onclick="${loadFn.name}(${pages})">${pages}</button>`;
    html += `<button class="page-btn" onclick="${loadFn.name}(${page + 1})" ${page >= pages ? 'disabled' : ''}>Вперёд →</button><span class="page-info">Стр. ${page} из ${pages}</span>`;
    el.innerHTML = html;
}

async function exportCSV() {
    try {
        const search = document.getElementById('search-input').value.trim();
        const scenario = document.getElementById('filter-scenario').value;
        const coupon = document.getElementById('filter-coupon').value;
        const params = new URLSearchParams({ page: 1, limit: 1000, search, ...(scenario ? { scenario } : {}), ...(coupon ? { coupon } : {}) });
        const d = await api('/users?' + params);
        const rows = [['ID', 'Имя', 'TelegramID', 'Сценарий', 'Шаг', 'Всего', 'Спинов', 'Купон', 'Дата']];
        d.users.forEach(u => rows.push([u.id, u.name, u.telegramId, u.scenario, u.scenarioStep, u.scenarioMax, u.spinsLeft, u.couponWon || '—', fmtDate(u.createdAt)]));
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
        a.download = 'users_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        toast('CSV скачан', true);
    } catch { toast('Ошибка экспорта', false); }
}

// ── User Detail ───────────────────────────────────────────────────────────────

async function openDetail(telegramId) {
    detailTelegramId = telegramId;
    document.getElementById('detail-overlay').style.display = 'block';
    document.getElementById('detail-panel').classList.add('open');
    document.getElementById('dp-name').textContent = '...';
    document.getElementById('dp-spins-history').innerHTML = '<div class="skel skel-row"></div>'.repeat(4);
    try {
        const { user } = await api('/user/' + telegramId);
        const idx = (user.id - 1) % 8, scenarioNum = idx + 1, stepMax = SCENARIO_LENGTHS[idx];
        const couponSpin = user.spinResults.find(r => COUPON_IDS.includes(r.prizeId));
        document.getElementById('dp-name').textContent = [user.firstName, user.username ? '@' + user.username : null].filter(Boolean).join(' ') || '—';
        document.getElementById('dp-sub').textContent = 'TG: ' + telegramId;
        document.getElementById('dp-tid').textContent = telegramId;
        document.getElementById('dp-scenario').innerHTML = `<span class="badge badge-purple">Сценарий ${scenarioNum}</span>`;
        document.getElementById('dp-progress').textContent = `${Math.min(user.spinsUsed, stepMax)} / ${stepMax} шагов`;
        document.getElementById('dp-spins').innerHTML = `<span class="badge ${user.freeSpinsCount > 0 ? 'badge-green' : 'badge-red'}">${user.freeSpinsCount} спин(ов)</span>`;
        document.getElementById('dp-coupon').textContent = couponSpin ? ('✅ ' + (PRIZE_META[couponSpin.prizeId]?.name || couponSpin.prizeId) + ' · ' + fmtDate(couponSpin.createdAt)) : '—';
        document.getElementById('dp-created').textContent = fmtDate(user.createdAt);
        document.getElementById('dp-spins-history').innerHTML = user.spinResults.map(r =>
            `<div class="spin-row">
        <span class="spin-num">#${r.spinNumber}</span>
        <span style="flex:1">${SPIN_LABELS[r.prizeId || r.result] || r.result}</span>
        <span style="font-size:11px;color:var(--muted)">${fmtDate(r.createdAt)}</span>
      </div>`
        ).join('') || '<span style="color:var(--muted)">Нет спинов</span>';
    } catch { toast('Ошибка загрузки', false); }
}

function closeDetail() {
    document.getElementById('detail-overlay').style.display = 'none';
    document.getElementById('detail-panel').classList.remove('open');
    detailTelegramId = null;
}

async function addSpins() {
    if (!detailTelegramId) return;
    const count = Number(document.getElementById('dp-spin-count').value);
    if (!count || count < 1) return;
    try {
        const d = await api('/add-spins', { method: 'POST', body: JSON.stringify({ telegramId: detailTelegramId, count }) });
        toast(`✅ Добавлено ${count} спин(ов). Осталось: ${d.spinsLeft}`, true);
        openDetail(detailTelegramId); loadUsers(usersPage); // #19 auto-refresh
    } catch { toast('Ошибка', false); }
}

async function resetCurrentUser() {
    if (!detailTelegramId) return;
    confirmAction('Сбросить сценарий?', 'spinsUsed=0, freeSpinsCount=4', async () => {
        await resetUser(detailTelegramId); openDetail(detailTelegramId);
    });
}

async function resetUser(telegramId) {
    try {
        await api('/reset-user', { method: 'POST', body: JSON.stringify({ telegramId }) });
        toast(`✅ Сброшено (${telegramId})`, true); loadUsers(usersPage); // #19 auto-refresh
    } catch { toast('Ошибка', false); }
}

// #14 Send direct message to user
async function sendMessage() {
    if (!detailTelegramId) return;
    const text = document.getElementById('dp-msg-text')?.value?.trim();
    if (!text) { toast('Введите текст сообщения', false); return; }
    try {
        await api('/send-message', { method: 'POST', body: JSON.stringify({ telegramId: detailTelegramId, text }) });
        toast('✅ Сообщение отправлено!', true);
        document.getElementById('dp-msg-text').value = '';
    } catch (e) { toast('Ошибка отправки: ' + (e.message || ''), false); }
}

async function resetAll() {
    try {
        const d = await api('/reset-all', { method: 'POST', body: '{}' });
        toast(`✅ Сброшено ${d.count} польз.`, true); loadDash();
    } catch { toast('Ошибка', false); }
}

// ── Prizes ────────────────────────────────────────────────────────────────────

async function loadPrizes() {
    const filter = document.getElementById('prize-filter').value;
    document.getElementById('prizes-tbody').innerHTML = '<tr><td colspan="5" class="loading-cell"><div class="skel skel-row"></div></td></tr>';
    try {
        const d = await api('/prizes?filter=' + filter);
        // #12 Prize summary counters
        const counts = {};
        d.prizes.forEach(p => { counts[p.prizeId] = (counts[p.prizeId] || 0) + 1; });
        const summaryEl = document.getElementById('prize-summary');
        if (summaryEl) {
            summaryEl.innerHTML = Object.entries(PRIZE_META)
                .filter(([k]) => counts[k])
                .map(([k, m]) => `<span class="badge badge-purple" style="margin-right:6px">${m.icon} ${m.name}: <b>${counts[k]}</b></span>`)
                .join('') || '<span style="color:var(--muted);font-size:12px">Нет данных</span>';
        }
        document.getElementById('prizes-tbody').innerHTML = d.prizes.map((p, i) => {
            const m = PRIZE_META[p.prizeId] || { icon: '🎁', name: p.result, cls: 'badge-purple' };
            return `<tr style="cursor:default">
        <td style="color:var(--muted)">${i + 1}</td>
        <td style="font-weight:600">${esc(p.userName)}</td>
        <td style="font-family:monospace;font-size:12px;color:var(--muted)">${p.telegramId}
          <span class="copy-btn" onclick="copyText('${p.telegramId}')">📋</span>
        </td>
        <td><span class="badge ${m.cls}">${m.icon} ${m.name}</span></td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(p.wonAt)}</td>
      </tr>`;
        }).join('') || '<tr><td colspan="5" class="loading-cell" style="color:var(--muted)">🏆 Призов пока нет</td></tr>';
    } catch { toast('Ошибка', false); }
}

// ── Broadcast ─────────────────────────────────────────────────────────────────

let buttonCount = 0;
let uploadedMedia = null; // { fileId, mediaType, fileName, localUrl }

// ─ File Drag & Drop ──────────────────────────────────────────────────────────

function handleFileDrop(event) {
    event.preventDefault();
    document.getElementById('bc-drop-zone').classList.remove('drag-over');
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) processFile(file);
}

function handleFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    document.getElementById('bc-drop-content').innerHTML =
        '<div style="font-size:13px;color:var(--accent)">⏳ Загружаю <b>' + esc(file.name) + '</b>...</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + (file.size / 1024 / 1024).toFixed(1) + ' МБ</div>';
    uploadMedia(file);
}

async function uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const r = await fetch(API + '/upload-media', {
            method: 'POST',
            headers: { 'x-admin-token': TOKEN },
            body: formData,
        });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || 'Upload failed');

        uploadedMedia = {
            fileId: d.fileId,
            mediaType: d.mediaType,
            fileName: d.fileName,
            localUrl: URL.createObjectURL(file),
        };

        const icon = MEDIA_ICONS[d.mediaType] || '📎';
        const thumb = d.mediaType === 'photo'
            ? '<img src="' + uploadedMedia.localUrl + '" style="height:60px;border-radius:6px;object-fit:cover;margin-bottom:6px">'
            : '<div style="font-size:32px;margin-bottom:6px">' + icon + '</div>';
        document.getElementById('bc-drop-content').innerHTML =
            thumb +
            '<div style="font-size:13px;font-weight:600;color:#4ade80">✅ ' + esc(d.fileName) + '</div>' +
            '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + icon + ' ' + d.mediaType + ' · нажми чтобы заменить</div>';
        updatePreview();
        toast('✅ Загружено: ' + d.fileName, true);
    } catch (e) {
        uploadedMedia = null;
        document.getElementById('bc-drop-content').innerHTML =
            '<div style="font-size:28px;margin-bottom:6px">❌</div>' +
            '<div style="font-size:13px;font-weight:600;color:#f87171">Ошибка загрузки</div>' +
            '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + esc(String(e.message)) + '</div>';
        toast('Ошибка загрузки: ' + e.message, false);
    }
}

// ─ Buttons builder ────────────────────────────────────────────────────────────

function addButton() {
    const id = ++buttonCount;
    const list = document.getElementById('bc-buttons-list');
    const row = document.createElement('div');
    row.className = 'btn-builder-row';
    row.id = 'btn-row-' + id;
    row.innerHTML =
        '<input type="text" class="input input-sm" placeholder="Текст кнопки" oninput="updatePreview()" style="flex:1;margin-bottom:0">' +
        '<input type="url"  class="input input-sm" placeholder="https://..." oninput="updatePreview()" style="flex:2;margin-bottom:0">' +
        '<button class="btn btn-danger btn-sm" onclick="removeButton(' + id + ')" title="Удалить">✕</button>';
    list.appendChild(row);
    updatePreview();
}

function removeButton(id) {
    const el = document.getElementById('btn-row-' + id);
    if (el) el.remove();
    updatePreview();
}

function getButtons() {
    return Array.from(document.querySelectorAll('.btn-builder-row')).map(function (row) {
        const inputs = row.querySelectorAll('input');
        return { text: inputs[0].value.trim(), url: inputs[1].value.trim() };
    }).filter(function (b) { return b.text && b.url; });
}

// ─ Preview ────────────────────────────────────────────────────────────────────

function updatePreview() {
    const text = document.getElementById('bc-text').value;
    const buttons = getButtons();
    const p = document.getElementById('bc-preview');
    let html = '';

    if (uploadedMedia) {
        if (uploadedMedia.mediaType === 'photo') {
            html += '<div style="margin-bottom:10px;border-radius:8px;overflow:hidden;max-height:200px"><img src="' + uploadedMedia.localUrl + '" style="width:100%;object-fit:cover;border-radius:8px"></div>';
        } else {
            const icon = uploadedMedia.mediaType === 'video' ? '🎬' : '📄';
            html += '<div style="background:rgba(147,51,234,.15);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:var(--accent)">' + icon + ' ' + esc(uploadedMedia.fileName) + '</div>';
        }
    }

    if (text) {
        const safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/&lt;(\/?(?:b|i|br|a)[^>]{0,200})>/g, '<$1>');
        html += '<div style="line-height:1.7">' + safeText + '</div>';
    }

    if (buttons.length) {
        html += '<div style="margin-top:10px;display:flex;flex-direction:column;gap:5px">';
        buttons.forEach(function (b) {
            html += '<div style="text-align:center;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:6px 12px;font-size:13px;color:#60a5fa">' + esc(b.text) + '</div>';
        });
        html += '</div>';
    }

    p.innerHTML = html || '<span style="color:var(--muted)">—</span>';
}

function clearBroadcastForm() {
    document.getElementById('bc-text').value = '';
    document.getElementById('bc-buttons-list').innerHTML = '';
    buttonCount = 0;
    uploadedMedia = null;
    document.getElementById('bc-drop-content').innerHTML =
        '<div style="font-size:32px;margin-bottom:6px">📁</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text)">Нажми или перетащи файл</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:3px">Фото · Видео · Документ — до 50 МБ</div>';
    const fi = document.getElementById('bc-file-input');
    if (fi) fi.value = '';
    document.getElementById('bc-progress').style.display = 'none';
    updatePreview();
}

async function sendBroadcast() {
    const text = document.getElementById('bc-text').value.trim();
    if (!text) { toast('Введите текст', false); return; }

    const buttons = getButtons();
    const mediaType = uploadedMedia ? uploadedMedia.mediaType : undefined;
    const mediaUrl = uploadedMedia ? uploadedMedia.fileId : undefined;

    const summaryParts = ['Текст: "' + text.slice(0, 50) + (text.length > 50 ? '…' : '') + '"'];
    if (uploadedMedia) summaryParts.push((MEDIA_ICONS[uploadedMedia.mediaType] || '📎') + ' ' + uploadedMedia.fileName);
    if (buttons.length) summaryParts.push(buttons.length + ' кнопка(ок)');

    confirmAction('Запустить рассылку?', summaryParts.join(' · '), async function () {
        const btn = document.getElementById('bc-btn');
        btn.disabled = true; btn.textContent = '⏳ Запрос...';
        try {
            const payload = { text };
            if (mediaType) payload.mediaType = mediaType;
            if (mediaUrl) payload.mediaUrl = mediaUrl;
            if (buttons.length) payload.buttons = buttons;
            const d = await api('/broadcast', { method: 'POST', body: JSON.stringify(payload) });
            btn.textContent = '📢 Отправить рассылку'; btn.disabled = false;
            document.getElementById('bc-progress').style.display = 'block';
            document.getElementById('bc-total').textContent = 'из ' + d.total + ' пользователей';
            pollBroadcast(d.id, d.total);
        } catch {
            toast('Ошибка запуска', false);
            btn.disabled = false; btn.textContent = '📢 Отправить рассылку';
        }
    });
}

function pollBroadcast(id, total) {
    clearInterval(bcPollTimer);
    bcPollTimer = setInterval(async function () {
        try {
            const d = await api('/broadcast/' + id);
            const pct = total > 0 ? Math.round((d.sent + d.failed) / total * 100) : 0;
            document.getElementById('bc-prog-fill').style.width = pct + '%';
            document.getElementById('bc-prog-pct').textContent = pct + '%';
            document.getElementById('bc-sent').textContent = '✅ ' + d.sent + ' доставлено';
            document.getElementById('bc-fail').textContent = '❌ ' + d.failed + ' ошибок';
            if (d.status === 'done') {
                clearInterval(bcPollTimer);
                document.getElementById('bc-prog-label').textContent = '✅ Готово!';
                toast('Рассылка завершена: ' + d.sent + ' доставлено, ' + d.failed + ' ошибок', d.failed === 0);
                loadBroadcastHistory();
            }
        } catch { clearInterval(bcPollTimer); }
    }, 2000);
}

async function loadBroadcastHistory() {
    const tbody = document.getElementById('bc-history');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell"><div class="skel skel-row"></div></td></tr>';
    try {
        const d = await api('/broadcasts');
        tbody.innerHTML = d.broadcasts.length ? d.broadcasts.map(function (b) {
            const isRunning = b.status === 'running';
            const pct = b.total > 0 ? Math.round((b.sent + b.failed) / b.total * 100) : 0;
            const sentPct = b.total > 0 ? Math.round(b.sent / b.total * 100) : 0;
            const mediaCell = b.mediaType
                ? '<span class="badge badge-blue">' + (MEDIA_ICONS[b.mediaType] || '📎') + ' ' + b.mediaType + '</span>'
                : '<span style="color:var(--muted)">—</span>';
            const btnsCell = (b.buttons && b.buttons.length)
                ? '<span class="badge badge-purple">' + b.buttons.length + ' шт</span>'
                : '<span style="color:var(--muted)">—</span>';
            return '<tr style="cursor:default">' +
                '<td style="color:var(--muted);font-size:12px;white-space:nowrap">' + fmtDate(b.createdAt) + '</td>' +
                '<td><span class="truncate" title="' + esc(b.text) + '">' + esc(b.text) + '</span></td>' +
                '<td>' + mediaCell + '</td>' +
                '<td>' + btnsCell + '</td>' +
                '<td style="color:var(--muted)">' + b.total + '</td>' +
                '<td><span style="color:#4ade80;font-weight:600">' + b.sent + '</span> <span style="color:var(--muted);font-size:11px">(' + sentPct + '%)</span></td>' +
                '<td><span style="color:' + (b.failed > 0 ? '#f87171' : 'var(--muted)') + '">' + b.failed + '</span></td>' +
                '<td>' + (isRunning ? '<span class="badge badge-orange">⏳ ' + pct + '%</span>' : '<span class="badge badge-green">✅ Готово</span>') + '</td>' +
                '</tr>';
        }).join('') : '<tr><td colspan="8" class="loading-cell" style="color:var(--muted)">Рассылок ещё не было</td></tr>';
    } catch { toast('Ошибка загрузки', false); }
}

// ── Confirm ───────────────────────────────────────────────────────────────────

function confirmAction(title, body, cb) {
    document.getElementById('conf-title').textContent = title;
    document.getElementById('conf-body').textContent = body;
    document.getElementById('confirm-overlay').classList.add('show');
    document.getElementById('conf-ok').onclick = function () { closeConfirm(); cb(); };
}

function closeConfirm() { document.getElementById('confirm-overlay').classList.remove('show'); }

// ── Utils ─────────────────────────────────────────────────────────────────────

function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function toast(msg, ok) {
    if (ok === undefined) ok = true;
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (ok ? 'toast-ok' : 'toast-err');
    // #10 toast timing: errors longer, success shorter
    setTimeout(function () { t.className = 'toast'; }, ok ? 2500 : 5000);
}
function copyText(text) { navigator.clipboard.writeText(text).then(function () { toast('Скопировано!', true); }).catch(function () { }); }
// #16 clear search
function clearSearch() {
    document.getElementById('search-input').value = '';
    loadUsers(1);
}
// copyTrackingLink — копирует нужный тип ссылки (bot = ?start=, app = ?startapp=)
function copyTrackingLink(slug, type) {
    var param = (type === 'app') ? '?startapp=src_' : '?start=src_';
    var link = 'https://t.me/' + BOT_USERNAME_DEFAULT + param + slug;
    copyText(link);
}

// #9 QR code for tracking links
function showQR(slug, type) {
    var param = (type === 'app') ? '?startapp=src_' : '?start=src_';
    const link = 'https://t.me/' + BOT_USERNAME_DEFAULT + param + slug;
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + encodeURIComponent(link);
    confirmAction('QR-код для ссылки', 'src_' + slug, () => {});
    // Override confirm card body with QR image
    setTimeout(() => {
        document.getElementById('conf-body').innerHTML =
            `<img src="${qrUrl}" style="width:200px;height:200px;border-radius:12px;margin:10px auto;display:block" alt="QR">
             <div style="font-size:10px;color:var(--muted);word-break:break-all;margin-top:8px">${link}</div>`;
        document.getElementById('conf-ok').textContent = '📋 Скопировать';
        document.getElementById('conf-ok').onclick = function() { closeConfirm(); copyText(link); };
    }, 10);
}

// ── Tracking ──────────────────────────────────────────────────────────────────

var BOT_USERNAME_DEFAULT = '';

async function fetchBotUsername() {
    if (BOT_USERNAME_DEFAULT) return;
    try {
        const d = await fetch('/api/admin/config').then(function (r) { return r.json(); });
        BOT_USERNAME_DEFAULT = d.botUsername || 'your_bot';
    } catch { BOT_USERNAME_DEFAULT = 'your_bot'; }
}

async function loadTracking() {
    await fetchBotUsername();
    const tbody = document.getElementById('tr-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell"><div class="skel skel-row"></div></td></tr>';
    try {
        const d = await api('/tracking');
        if (!d.sources || !d.sources.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell" style="color:var(--muted)">Нет трекинговых ссылок. Создайте первую!</td></tr>';
            return;
        }
        tbody.innerHTML = d.sources.map(function (s) {
            const convPct = s.starts > 0 ? Math.round(s.completed / s.starts * 100) : 0;
            const badge = s.isCustom ? '' : ' <span class="badge badge-blue" style="font-size:9px">авто</span>';
            return '<tr style="cursor:default">' +
                '<td><span style="font-weight:600">' + esc(s.name) + '</span>' + badge +
                '<div style="font-size:11px;color:var(--muted);font-family:monospace">src_' + esc(s.slug) + '</div></td>' +
                '<td><span class="badge badge-purple">' + s.starts + '</span></td>' +
                '<td><span class="badge badge-green">' + s.completed + '</span></td>' +
                '<td><span class="badge badge-orange">' + s.payClicks + '</span></td>' +
                '<td><span style="font-weight:700;color:' + (convPct > 20 ? '#4ade80' : convPct > 5 ? '#facc15' : 'var(--muted)') + '">' + convPct + '%</span></td>' +
                '<td style="white-space:nowrap">' +
                  '<button class="btn btn-sm" style="font-size:11px;margin-right:4px" onclick="copyTrackingLink(\'' + s.slug + '\', \'bot\')" title="Ссылка через бота">🤖 Бот</button>' +
                  '<button class="btn btn-sm" style="font-size:11px;background:rgba(34,211,238,.15);color:#22d3ee;border:1px solid rgba(34,211,238,.3)" onclick="copyTrackingLink(\'' + s.slug + '\', \'app\')" title="Прямой запуск Mini App">🚀 App</button>' +
                '</td>' +
                '<td>' + (s.isCustom
                    ? '<button class="btn btn-danger btn-sm" onclick="deleteTracking(\'' + s.slug + '\')">✕</button>'
                    : '') + '</td>' +
                '</tr>';
        }).join('');
    } catch { toast('Ошибка загрузки трекинга', false); }
}

async function refreshTracking() { await loadTracking(); }

async function createTracking() {
    const name = document.getElementById('tr-name').value.trim();
    const slug = document.getElementById('tr-slug').value.trim();
    if (!name) { toast('Введите название площадки', false); return; }
    if (!slug) { toast('Нажмите поле названия чтобы сгенерировать ссылку', false); return; }
    try {
        await api('/tracking', { method: 'POST', body: JSON.stringify({ slug, name }) });
        document.getElementById('tr-name').value = '';
        document.getElementById('tr-slug').value = '';
        document.getElementById('tr-link-preview').style.display = 'none';
        toast('✅ Ссылка создана!', true);
        loadTracking();
    } catch { toast('Ошибка создания', false); }
}

// ── Auto-slug helpers ──────────────────────────────────────────────────────────

var TRANSLITMAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

var _trSuffix = '';  // стабильный суффикс, меняется только по кнопке 🔄

function toSlug(name) {
    return name.toLowerCase()
        .split('').map(function (c) { return TRANSLITMAP[c] !== undefined ? TRANSLITMAP[c] : c; }).join('')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24);
}

function randSuffix() {
    return Math.random().toString(36).slice(2, 6);
}

function updateTrPreview(slug) {
    var linkBot = 'https://t.me/' + BOT_USERNAME_DEFAULT + '?start=src_' + slug;
    var linkApp = 'https://t.me/' + BOT_USERNAME_DEFAULT + '?startapp=src_' + slug;
    document.getElementById('tr-link-bot').textContent = linkBot;
    document.getElementById('tr-link-app').textContent = linkApp;
    document.getElementById('tr-link-preview').style.display = 'block';
}

function onTrNameInput(name) {
    if (!name.trim()) {
        document.getElementById('tr-link-preview').style.display = 'none';
        document.getElementById('tr-slug').value = '';
        _trSuffix = '';
        return;
    }
    // Инициализируем суффикс при первом вводе
    if (!_trSuffix) _trSuffix = randSuffix();
    var base = toSlug(name) || 'link';
    var slug = base + '_' + _trSuffix;
    document.getElementById('tr-slug').value = slug;
    updateTrPreview(slug);
}

function regenerateTrSlug() {
    _trSuffix = randSuffix();  // меняем только суффикс
    var name = document.getElementById('tr-name').value.trim();
    var base = name ? (toSlug(name) || 'link') : 'link';
    var slug = base + '_' + _trSuffix;
    document.getElementById('tr-slug').value = slug;
    updateTrPreview(slug);
}


async function deleteTracking(slug) {
    confirmAction('Удалить ссылку?', 'src_' + slug, async function () {
        try {
            await api('/tracking/' + slug, { method: 'DELETE' });
            toast('Удалено', true);
            loadTracking();
        } catch { toast('Ошибка удаления', false); }
    });
}

function copyTrackingLink(slug) {
    const link = 'https://t.me/' + BOT_USERNAME_DEFAULT + '?start=src_' + slug;
    copyText(link);
}

// ── Промокоды ──────────────────────────────────────────────────────────────────

const PRIZE_LABELS = {
    'coupon': '🎫 Купон',
    'extra_spin_1': '🎰 +1 спин',
    'extra_spin_2': '🎲 +2 спина',
    'telegram_bear': '🐻 Медведь',
};

async function loadPromos() {
    try {
        const promos = await api('/promos');
        const tbody = document.getElementById('promos-tbody');
        if (!promos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Промокодов пока нет</td></tr>';
            return;
        }
        tbody.innerHTML = promos.map(p => {
            const limit = p.maxActivations != null ? `${p.activationsCount}/${p.maxActivations}` : `${p.activationsCount}/∞`;
            const pct = p.maxActivations ? Math.round(p.activationsCount / p.maxActivations * 100) : null;
            const barHtml = pct != null ? `<div style="height:4px;background:rgba(147,51,234,.15);border-radius:2px;margin-top:4px"><div style="height:4px;width:${pct}%;background:var(--purple);border-radius:2px"></div></div>` : '';
            const statusBadge = p.isActive
                ? '<span class="badge badge-green">Активен</span>'
                : '<span class="badge badge-red">Выключен</span>';
            const prizeLabel = p.guaranteedPrizeId ? (PRIZE_LABELS[p.guaranteedPrizeId] || p.guaranteedPrizeId) : '<span style="color:var(--muted)">—</span>';
            return `<tr>
                <td><code style="font-size:13px;font-weight:700;color:var(--accent)">${p.code}</code></td>
                <td style="color:var(--muted);font-size:12px">${p.description || '—'}</td>
                <td><span class="badge badge-purple">+${p.spinsGranted}</span></td>
                <td style="font-size:12px">${prizeLabel}</td>
                <td style="font-size:12px">${limit}${barHtml}</td>
                <td>${statusBadge}</td>
                <td style="white-space:nowrap">
                    <button class="btn btn-ghost btn-sm" onclick="togglePromo(${p.id})" style="margin-right:6px">${p.isActive ? '⏸ Выкл' : '▶ Вкл'}</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePromo(${p.id},'${p.code}')">🗑</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { toast('Ошибка загрузки промокодов', false); }
}

async function createPromo() {
    const code = document.getElementById('pr-code').value.trim().toUpperCase();
    const desc = document.getElementById('pr-desc').value.trim();
    const spins = parseInt(document.getElementById('pr-spins').value) || 1;
    const prize = document.getElementById('pr-prize').value;
    const maxRaw = document.getElementById('pr-max').value.trim();
    const max = maxRaw ? parseInt(maxRaw) : null;
    if (!code) { toast('Введите промокод', false); return; }
    try {
        await api('/promos', { method: 'POST', body: JSON.stringify({ code, description: desc, spinsGranted: spins, guaranteedPrizeId: prize || null, maxActivations: max }) });
        toast('Промокод создан ✅', true);
        document.getElementById('pr-code').value = '';
        document.getElementById('pr-desc').value = '';
        document.getElementById('pr-spins').value = '3';
        document.getElementById('pr-prize').value = '';
        document.getElementById('pr-max').value = '';
        loadPromos();
    } catch (e) { toast('Ошибка: ' + (e.message || 'неверные данные'), false); }
}

async function togglePromo(id) {
    try { await api('/promos/' + id + '/toggle', { method: 'PATCH' }); loadPromos(); }
    catch { toast('Ошибка', false); }
}

async function deletePromo(id, code) {
    confirmAction('Удалить промокод?', code, async function () {
        try { await api('/promos/' + id, { method: 'DELETE' }); toast('Удалён', true); loadPromos(); }
        catch { toast('Ошибка удаления', false); }
    });
}

async function generatePromoCode() {
    try {
        const r = await api('/promos/generate-code');
        document.getElementById('pr-code').value = r.code;
    } catch {
        // Fallback — генерировать локально
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        document.getElementById('pr-code').value = code;
    }
}

// ── 🤖 Бот — приветственное сообщение ─────────────────────────────────────────

async function loadBotConfig() {
    try {
        const cfg = await api('/bot-config');
        const ta = document.getElementById('bot-text');
        if (ta) { ta.value = cfg.text || ''; updateBotPreview(); }
        renderBotMediaState(cfg.mediaId, cfg.mediaType);
    } catch (e) { toast('Ошибка загрузки конфига бота', false); }
}

function updateBotPreview() {
    const raw = (document.getElementById('bot-text').value || '').replace(/\{\{name\}\}/g, 'Иван');
    document.getElementById('bot-preview').innerHTML = raw;
}

async function saveBotText() {
    const text = document.getElementById('bot-text').value.trim();
    if (!text) { toast('Текст не может быть пустым', false); return; }
    try {
        await api('/bot-config/text', { method: 'POST', body: JSON.stringify({ text }) });
        toast('Текст сохранён ✅', true);
    } catch { toast('Ошибка сохранения', false); }
}

async function uploadBotMedia(file) {
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (!isImg && !isVid) { toast('Только изображения и MP4-видео', false); return; }
    if (file.size > 50 * 1024 * 1024) { toast('Файл больше 50 МБ', false); return; }
    toast('⏳ Загрузка в Telegram...', true);
    const form = new FormData();
    form.append('file', file);
    try {
        const r = await fetch('/api/admin/bot-config/media', {
            method: 'POST',
            headers: { 'x-admin-token': TOKEN },
            body: form,
        });
        const d = await r.json();
        if (!d.ok) { toast('Ошибка загрузки: ' + (d.error || ''), false); return; }
        toast('Медиа загружено ✅', true);
        renderBotMediaState(d.fileId, d.type);
        document.getElementById('bot-file-input').value = '';
    } catch { toast('Ошибка загрузки', false); }
}

async function deleteBotMedia() {
    try {
        await api('/bot-config/media', { method: 'DELETE' });
        toast('Медиа удалено', true);
        renderBotMediaState('', '');
    } catch { toast('Ошибка', false); }
}

function handleBotFileDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file) uploadBotMedia(file);
}

function renderBotMediaState(mediaId, mediaType) {
    const el = document.getElementById('bot-media-state');
    if (!el) return;
    if (!mediaId) {
        el.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:10px 0">📭 Медиафайл не прикреплён — будет отправлен только текст</div>';
    } else {
        const icon = mediaType === 'video' ? '🎬' : '🖼️';
        el.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:10px">
            <span style="font-size:24px">${icon}</span>
            <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#86efac">${mediaType === 'video' ? 'Видео' : 'Фото'} прикреплено</div>
                <div style="font-size:10px;color:var(--muted);word-break:break-all;margin-top:2px">file_id: ${mediaId.slice(0, 40)}...</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteBotMedia()">🗑 Удалить</button>
        </div>`;
    }
}
