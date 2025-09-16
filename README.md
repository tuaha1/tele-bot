# Telegram Bot

A simple Telegram bot built with Node.js using the `node-telegram-bot-api` library.

## Features

- 🤖 Basic bot functionality with polling
- 📝 Multiple command handlers (/start, /help, /echo, /hello)
- 🔒 Environment variable configuration for bot token
- 📱 Responsive to text messages

## Prerequisites

- Node.js (v14 or higher)
- A Telegram bot token from [@BotFather](https://t.me/botfather)

## Setup

1. **Clone or download this project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get a bot token:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Follow the instructions to get your bot token

4. **Configure environment variables:**
   - Open the `.env` file
   - Replace `your_bot_token_here` with your actual bot token:
   ```
   BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

5. **Run the bot:**
   ```bash
   node bot.js
   ```

## Available Commands

- `/start` - Show welcome message and available commands
- `/help` - Display help information
- `/echo <message>` - Echo back your message
- `/hello` - Get a friendly greeting

## Project Structure

```
tele-bot/
├── bot.js          # Main bot file
├── package.json    # Node.js dependencies and scripts
├── .env           # Environment variables (create this)
├── .gitignore     # Git ignore file
└── README.md      # This file
```

## Development

To add new commands, edit the `bot.js` file and add new `bot.onText()` handlers:

```javascript
bot.onText(/\/yourcommand/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Your response here');
});
```

## Troubleshooting

- **Bot not responding:** Check that your bot token is correct in the `.env` file
- **Polling errors:** Ensure your internet connection is stable
- **Permission issues:** Make sure your bot has the necessary permissions

## License

ISC
