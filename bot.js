const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

// Create Express app for health checks (required by Render)
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Bot is running!', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Start the web server
app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
});

// Create a bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Reminder system
const reminderUsers = new Set(); // Track users who want reminders
let reminderInterval = null;

// Work reminder messages
const workReminders = [
    "⏰ Time to focus on work! Stay productive! 💪",
    "🚀 Break time's over! Let's get back to work! 📝",
    "💼 Work reminder: Stay focused and achieve your goals! 🎯",
    "⚡ Productivity boost! Time to tackle that task! 🔥",
    "📊 Work session reminder: Every minute counts! ⏱️",
    "🎯 Focus time! You've got this! 💪",
    "📈 Progress reminder: Keep moving forward! 🚀",
    "💡 Work break reminder: Time to get back in the zone! ⚡"
];

// Function to send reminders to all subscribed users
function sendWorkReminders() {
    if (reminderUsers.size === 0) return;
    
    const randomReminder = workReminders[Math.floor(Math.random() * workReminders.length)];
    
    reminderUsers.forEach(chatId => {
        bot.sendMessage(chatId, randomReminder).catch(error => {
            console.error(`Failed to send reminder to ${chatId}:`, error);
            // Remove user if they've blocked the bot or chat doesn't exist
            if (error.response && error.response.statusCode === 403) {
                reminderUsers.delete(chatId);
                console.log(`Removed user ${chatId} from reminders (bot blocked)`);
            }
        });
    });
    
    console.log(`📢 Sent work reminders to ${reminderUsers.size} users`);
}

// Start reminder system
function startReminderSystem() {
    if (reminderInterval) {
        console.log('⚠️ Reminder system already running');
        return;
    }
    
    reminderInterval = setInterval(sendWorkReminders, 30000); // 30 seconds
    console.log('⏰ Work reminder system started (30-second intervals)');
}

// Stop reminder system
function stopReminderSystem() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log('⏹️ Work reminder system stopped');
    }
}

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
/remindme - Start work reminders (every 30 seconds)
/stopremind - Stop work reminders
/reminderstatus - Check reminder status

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

⏰ Work Reminder Commands:
/remindme - Start receiving work reminders every 30 seconds
/stopremind - Stop receiving work reminders
/reminderstatus - Check if you're subscribed to reminders

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

// Handle /remindme command - Start work reminders
bot.onText(/\/remindme/, (msg) => {
    const chatId = msg.chat.id;
    
    if (reminderUsers.has(chatId)) {
        bot.sendMessage(chatId, '⏰ You are already subscribed to work reminders!\n\nUse /stopremind to unsubscribe or /reminderstatus to check your status.');
        return;
    }
    
    reminderUsers.add(chatId);
    
    // Start the reminder system if it's not already running
    if (!reminderInterval) {
        startReminderSystem();
    }
    
    bot.sendMessage(chatId, '✅ Work reminders activated!\n\n⏰ You will receive work reminders every 30 seconds.\n\nUse /stopremind to stop reminders or /reminderstatus to check your status.');
});

// Handle /stopremind command - Stop work reminders
bot.onText(/\/stopremind/, (msg) => {
    const chatId = msg.chat.id;
    
    if (!reminderUsers.has(chatId)) {
        bot.sendMessage(chatId, '❌ You are not currently subscribed to work reminders.\n\nUse /remindme to start receiving reminders.');
        return;
    }
    
    reminderUsers.delete(chatId);
    
    // Stop the reminder system if no users are subscribed
    if (reminderUsers.size === 0 && reminderInterval) {
        stopReminderSystem();
    }
    
    bot.sendMessage(chatId, '⏹️ Work reminders stopped!\n\nYou will no longer receive work reminders.\n\nUse /remindme to start receiving reminders again.');
});

// Handle /reminderstatus command - Check reminder status
bot.onText(/\/reminderstatus/, (msg) => {
    const chatId = msg.chat.id;
    const isSubscribed = reminderUsers.has(chatId);
    const totalUsers = reminderUsers.size;
    const systemRunning = reminderInterval !== null;
    
    let statusMessage = '📊 Reminder Status:\n\n';
    statusMessage += `Your Status: ${isSubscribed ? '✅ Subscribed' : '❌ Not subscribed'}\n`;
    statusMessage += `Total Users: ${totalUsers}\n`;
    statusMessage += `System Status: ${systemRunning ? '🟢 Running' : '🔴 Stopped'}\n\n`;
    
    if (isSubscribed) {
        statusMessage += 'You will receive work reminders every 30 seconds.\nUse /stopremind to unsubscribe.';
    } else {
        statusMessage += 'Use /remindme to start receiving work reminders.';
    }
    
    bot.sendMessage(chatId, statusMessage);
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
console.log('⏰ Work reminder system ready - users can use /remindme to start receiving reminders every 30 seconds');
