import { Client, Events, GatewayIntentBits, Message, TextChannel, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { fetchDocs } from './utils/api';
import { generateAIResponse } from './utils/ai';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user!);
  const isDocsCommand = message.content.toLowerCase().startsWith('!docs');

  if (!isMentioned && !isDocsCommand) return;
  try {
    const question = message.content
      .replace(/<@!?\d+>/g, '') 
      .replace(/^!docs\s*/i, '') 
      .trim();

    if (!question) {
      await message.reply('Please provide a question about Better Auth documentation.');
      return;
    }

    if (message.channel instanceof TextChannel) {
      await message.channel.sendTyping();
    }

    const docs = await fetchDocs(question);
    if (!docs || docs.length === 0) {
      await message.reply('I couldn\'t find any relevant information in the documentation for your question.');
      return;
    }
    const response = await generateAIResponse(question, docs , "currId", "channelId");
    await message.reply(response);

  } catch (error) {
    console.error('Error processing message:', error);
    await message.reply('Sorry, I encountered an error while processing your request. Please try again later.');
  }
});
// login using the bot token
client.login(process.env.BOT_TOKEN); 
