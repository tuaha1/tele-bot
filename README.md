# WhatsApp Reminder Bot

A personal WhatsApp reminder bot built with Node.js and Baileys. It is intended for small personal workloads (for example, 5–10 reminders/day).

## Features

- 💬 WhatsApp Web connection using Baileys
- 🔐 Phone-number pairing code (no QR required)
- ⏰ One-time reminders
- 🔁 Daily recurring reminders
- 📋 List reminders
- ❌ Cancel reminders
- 💾 JSON persistence for reminders
- 🌏 Asia/Kolkata timezone by default
- ❤️ `/health` endpoint for hosting platforms

## Important

This uses an unofficial WhatsApp Web client. Use a separate/test WhatsApp account if possible. WhatsApp may change its protocols or restrict accounts using unofficial automation.

## Local setup

```bash
npm install
```

Set the phone number that will own the bot connection:

```bash
WHATSAPP_PHONE_NUMBER=919876543210
TZ=Asia/Kolkata
```

Then run:

```bash
npm start
```

The terminal will print a **pairing code**. On the WhatsApp phone:

**WhatsApp → Linked devices → Link a device → Link with phone number**

Enter the pairing code shown by the bot.

After the first successful pairing, the credentials are stored under `auth_info/` and should never be committed.

## Commands / examples

```text
Remind me to study at 7 PM
Remind me every day at 8 PM to study
Remind me tomorrow at 10 AM to submit assignment
reminders
cancel 2
help
```

## Deployment

The repository contains `render.yaml` for a Node web service. Set `WHATSAPP_PHONE_NUMBER` and deploy. **Persistent storage is strongly recommended for production** because the WhatsApp authentication directory must survive restarts. Without persistent storage, you may need to pair the account again after a restart/redeploy.

For the most reliable always-on operation, use a host with persistent disk/storage rather than a sleeping/ephemeral free service.

## Security

Only the configured `WHATSAPP_PHONE_NUMBER` is allowed to use the reminder commands. Keep authentication files private.
