const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Create a bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Log when bot is ready
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is starting...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🎉 Welcome to your Telegram Bot!

Available commands:
/start - Show this welcome message
/help - Show help information
/echo <message> - Echo back your message
/hello - Get a friendly greeting

Bot is ready to serve! 🚀
    `;
    
    bot.sendMessage(chatId, welcomeMessage);
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 Bot Commands:

/start - Start the bot and see welcome message
/help - Show this help message
/echo <message> - The bot will repeat your message
/hello - Get a friendly greeting

Need more help? Contact the bot developer!
    `;
    
    bot.sendMessage(chatId, helpMessage);
});

// Handle /echo command
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const echoMessage = match[1];
    
    bot.sendMessage(chatId, `You said: ${echoMessage}`);
});

// Handle /hello command
bot.onText(/\/hello/, (msg) => {
    const chatId = msg.chat.id;
    const greetings = [
        'Hello there! 👋',
        'Hi! How are you doing? 😊',
        'Greetings! Nice to meet you! 🌟',
        'Hey! Welcome to the bot! 🎉',
        'Hello! Ready for some fun? 🚀'
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    bot.sendMessage(chatId, randomGreeting);
});

// Handle any other text messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    
    // Only respond to text messages that aren't commands
    if (messageText && !messageText.startsWith('/')) {
        bot.sendMessage(chatId, `I received your message: "${messageText}"\n\nTry using /help to see available commands!`);
    }
});

// Log when bot is ready
console.log('✅ Bot is running and ready to receive messages!');
console.log('📝 Make sure to set your BOT_TOKEN in the .env file');
