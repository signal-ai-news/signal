import fs from 'fs/promises';
import { SIGNALS_FILE, ARTICLES_FILE } from './config.mjs';

// ─── JSON file helpers ───
export async function readJSON(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'));
  } catch { return []; }
}

export async function writeJSON(file, data) {
  await fs.mkdir(file.substring(0, file.lastIndexOf('/')), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// ─── Slugify ───
export function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// ─── Date helpers ───
export function nowISO() { return new Date().toISOString(); }
export function today() { return new Date().toISOString().slice(0, 10); }

// ─── Deduplicate by URL ───
export function deduplicate(existing, incoming, key = 'url') {
  const seen = new Set(existing.map(e => e[key]));
  return incoming.filter(item => !seen.has(item[key]));
}

// ─── Sleep ───
export const sleep = ms => new Promise(r => setTimeout(r, ms));
