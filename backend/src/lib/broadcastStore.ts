import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface BroadcastButton {
    text: string;
    url: string;
}

export interface BroadcastRecord {
    id: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video' | 'document';
    buttons?: BroadcastButton[];
    createdAt: string;
    total: number;
    sent: number;
    failed: number;
    status: 'running' | 'done';
}

const BROADCASTS_FILE = path.join(__dirname, '../../broadcasts.json');

export function loadBroadcasts(): BroadcastRecord[] {
    try {
        if (fs.existsSync(BROADCASTS_FILE)) {
            return JSON.parse(fs.readFileSync(BROADCASTS_FILE, 'utf-8'));
        }
    } catch { }
    return [];
}

function saveBroadcasts(records: BroadcastRecord[]): void {
    try {
        fs.writeFileSync(BROADCASTS_FILE, JSON.stringify(records.slice(-50), null, 2));
    } catch (e) { logger.error(e, 'Failed to save broadcasts'); }
}

export function upsertBroadcast(record: BroadcastRecord): void {
    const records = loadBroadcasts();
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) records[idx] = record; else records.push(record);
    saveBroadcasts(records);
}
