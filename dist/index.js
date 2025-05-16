"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = require("./utils/api");
const ai_1 = require("./utils/ai");
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel],
});
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    // Ignore messages from bots
    if (message.author.bot)
        return;
    // Check if the bot is mentioned or if the message starts with !docs
    const isMentioned = message.mentions.has(client.user);
    const isDocsCommand = message.content.toLowerCase().startsWith('!docs');
    if (!isMentioned && !isDocsCommand)
        return;
    try {
        const question = message.content
            .replace(/<@!?\d+>/g, '') // Remove mentions
            .replace(/^!docs\s*/i, '') // Remove !docs command
            .trim();
        if (!question) {
            await message.reply('Please provide a question about Better Auth documentation.');
            return;
        }
        // Send a "typing" indicator if the channel is a text channel
        if (message.channel instanceof discord_js_1.TextChannel) {
            await message.channel.sendTyping();
        }
        // Fetch documentation
        const docs = await (0, api_1.fetchDocs)(question);
        if (!docs || docs.length === 0) {
            await message.reply('I couldn\'t find any relevant information in the documentation for your question.');
            return;
        }
        // Generate AI response
        const response = await (0, ai_1.generateAIResponse)(question, docs, "asdas", "asdas");
        await message.reply(response);
    }
    catch (error) {
        console.error('Error processing message:', error);
        await message.reply('Sorry, I encountered an error while processing your request. Please try again later.');
    }
});
// Login to Discord
client.login(process.env.BOT_TOKEN);
