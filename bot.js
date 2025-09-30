const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Create a bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Log when bot is ready
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is starting...');

// Handle any message with "Hello World"
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello World');
});

// Log when bot is ready
console.log('✅ Bot is running and ready to receive messages!');