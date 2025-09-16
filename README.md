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

## Deployment on Render

This bot is configured for easy deployment on [Render](https://render.com):

### **One-Click Deploy:**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### **Manual Deployment:**

1. **Fork this repository** to your GitHub account
2. **Sign up/Login** to [Render](https://render.com)
3. **Create a new Web Service:**
   - Connect your GitHub account
   - Select this repository
   - Choose the following settings:
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free (or paid for better performance)

4. **Set Environment Variables:**
   - Go to your service's Environment tab
   - Add `BOT_TOKEN` with your Telegram bot token
   - Add `NODE_ENV` with value `production`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your bot will be live and accessible via the provided URL

### **Health Checks:**
- **Root endpoint:** `https://your-app.onrender.com/` - Shows bot status
- **Health check:** `https://your-app.onrender.com/health` - For monitoring

### **Important Notes:**
- The bot uses **polling** mode, which works well with Render
- Free tier has **sleep mode** - bot may take a few seconds to wake up
- Consider upgrading to paid plan for 24/7 uptime
- Monitor logs in Render dashboard for any issues

## License

ISC
