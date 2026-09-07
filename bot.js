import 'dotenv/config';
import express from 'express';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from 'baileys';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';

process.env.TZ = process.env.TZ || 'Asia/Kolkata';

const PORT = Number(process.env.PORT || 10000);
const PHONE = String(process.env.WHATSAPP_PHONE_NUMBER || '').replace(/\D/g, '');
const OWNER_JID = PHONE ? `${PHONE}@s.whatsapp.net` : null;
const AUTH_DIR = process.env.AUTH_DIR || './auth_info';
const DATA_DIR = process.env.DATA_DIR || './data';
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });

const app = express();
app.get('/', (_req, res) => res.json({ service: 'whatsapp-reminder-bot', status: connected ? 'connected' : 'starting' }));
app.get('/health', (_req, res) => res.status(connected ? 200 : 503).json({ ok: connected, whatsapp: connected }));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Health server listening on ${PORT}`));

let sock;
let connected = false;
let reconnecting = false;
let reminders = loadReminders();

function loadReminders() {
  try {
    if (!fs.existsSync(REMINDERS_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not load reminders:', error);
    return [];
  }
}

function saveReminders() {
  const temp = `${REMINDERS_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(reminders, null, 2));
  fs.renameSync(temp, REMINDERS_FILE);
}

function nextId() {
  return reminders.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: process.env.TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: process.env.TZ,
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function parseTime(text) {
  const match = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (minute > 59 || hour > 23 || (meridiem && hour > 12) || hour === 0) return null;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return { hour, minute };
}

function buildDate({ hour, minute, tomorrow }) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (tomorrow || target <= now) target.setDate(target.getDate() + 1);
  return target;
}

function extractReminderText(input) {
  let text = input.trim();
  text = text.replace(/^remind\s+me\s+(?:to\s+)?/i, '');
  text = text.replace(/\bevery\s+day\b/gi, '');
  text = text.replace(/\bdaily\b/gi, '');
  text = text.replace(/\btomorrow\b/gi, '');
  text = text.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text.replace(/[,.!?]+$/, '').trim();
}

function createReminder(input, jid) {
  const time = parseTime(input);
  if (!time) return { error: 'Please include a time, for example: “remind me to study at 7 PM”.' };

  const recurring = /\bevery\s+day\b|\bdaily\b/i.test(input);
  const tomorrow = /\btomorrow\b/i.test(input);
  const message = extractReminderText(input);
  if (!message) return { error: 'What should I remind you about?' };

  const nextRunAt = buildDate({ ...time, tomorrow });
  const reminder = {
    id: nextId(),
    jid,
    message,
    recurring,
    nextRunAt: nextRunAt.toISOString(),
    createdAt: new Date().toISOString(),
  };

  reminders.push(reminder);
  saveReminders();
  return { reminder };
}

function helpText() {
  return [
    '🤖 *Reminder Bot*',
    '',
    'Try:',
    '• Remind me to study at 7 PM',
    '• Remind me every day at 8 PM to study',
    '• Remind me tomorrow at 10 AM to submit assignment',
    '',
    'Commands:',
    '• reminders — list reminders',
    '• cancel 2 — cancel reminder #2',
    '• help — show this help',
  ].join('\n');
}

async function sendText(jid, text) {
  if (!sock || !connected) throw new Error('WhatsApp is not connected');
  await sock.sendMessage(jid, { text });
}

async function handleMessage(message) {
  const jid = message.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || message.key.fromMe) return;
  if (OWNER_JID && jid !== OWNER_JID) return;

  const text = message.message?.conversation
    || message.message?.extendedTextMessage?.text
    || message.message?.imageMessage?.caption
    || '';
  const input = text.trim();
  if (!input) return;

  const lower = input.toLowerCase();

  if (lower === 'help' || lower === '/help' || lower === 'hi' || lower === 'hello') {
    await sendText(jid, helpText());
    return;
  }

  if (lower === 'reminders' || lower === 'my reminders' || lower === '/reminders') {
    const mine = reminders.filter((r) => r.jid === jid);
    if (!mine.length) {
      await sendText(jid, '📭 You have no active reminders.');
      return;
    }
    const lines = mine.map((r) => `${r.id}. ${r.message} — ${r.recurring ? 'daily' : 'once'} at ${formatDateTime(new Date(r.nextRunAt))}`);
    await sendText(jid, `⏰ *Your reminders*\n\n${lines.join('\n')}`);
    return;
  }

  const cancel = lower.match(/^cancel\s+(?:reminder\s+)?(\d+)$/);
  if (cancel) {
    const id = Number(cancel[1]);
    const before = reminders.length;
    reminders = reminders.filter((r) => !(r.id === id && r.jid === jid));
    if (reminders.length === before) {
      await sendText(jid, `I couldn't find reminder #${id}.`);
    } else {
      saveReminders();
      await sendText(jid, `✅ Cancelled reminder #${id}.`);
    }
    return;
  }

  if (/^remind\s+me\b/i.test(input)) {
    const result = createReminder(input, jid);
    if (result.error) {
      await sendText(jid, `❓ ${result.error}`);
      return;
    }
    const r = result.reminder;
    await sendText(jid, `✅ Reminder #${r.id} set.\n\n“${r.message}”\n${r.recurring ? 'Every day' : 'Once'} at ${formatDateTime(new Date(r.nextRunAt))}`);
    return;
  }

  await sendText(jid, 'I can set reminders for you. Try: “Remind me to study at 7 PM” or type “help”.');
}

async function reminderLoop() {
  if (!connected) return;
  const now = Date.now();
  const due = reminders.filter((r) => new Date(r.nextRunAt).getTime() <= now);

  for (const reminder of due) {
    try {
      await sendText(reminder.jid, `⏰ ${reminder.message}`);
      if (reminder.recurring) {
        const next = new Date(reminder.nextRunAt);
        next.setDate(next.getDate() + 1);
        reminder.nextRunAt = next.toISOString();
      } else {
        reminders = reminders.filter((r) => r.id !== reminder.id);
      }
      saveReminders();
    } catch (error) {
      console.error(`Failed to send reminder #${reminder.id}:`, error);
    }
  }
}

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });

  sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        await handleMessage(message);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    }
  });

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      connected = true;
      reconnecting = false;
      console.log('✅ WhatsApp connected.');
      return;
    }

    if (connection === 'close') {
      connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      console.error(`WhatsApp connection closed (code ${code ?? 'unknown'}).`);
      if (code !== DisconnectReason.loggedOut && !reconnecting) {
        reconnecting = true;
        setTimeout(() => connectWhatsApp().catch((error) => console.error('Reconnect failed:', error)), 5000);
      }
    }
  });

  if (!state.creds.registered) {
    if (!PHONE) {
      console.log('⚠️ Set WHATSAPP_PHONE_NUMBER (country code + number, digits only) to generate a pairing code.');
      return;
    }
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE);
        console.log(`🔐 WhatsApp pairing code: ${code}`);
        console.log('On your phone: WhatsApp → Linked devices → Link a device → Link with phone number.');
      } catch (error) {
        console.error('Could not generate pairing code:', error);
      }
    }, 3000);
  }
}

setInterval(() => reminderLoop().catch((error) => console.error('Reminder loop error:', error)), 10000);

connectWhatsApp().catch((error) => {
  console.error('Fatal WhatsApp startup error:', error);
  process.exitCode = 1;
});
