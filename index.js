// Import necessary modules
import { Telegraf } from "telegraf";
import User from "./src/User.js";
import Event from "./src/Event.js";
import connectDb from "./src/config/Db.js";
import { message } from "telegraf/filters";
import OpenAI from 'openai';
import { model } from "mongoose";

// Create a new instance of Telegraf bot
var bot = new Telegraf(process.env.TELEGRAM_API);

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env['OPEN_AI'], // This is the default and can be omitted
});

// Connect to the database
try {
    connectDb();
    console.log('Database connected successfully');
} catch (err) {
    console.log(err);
    process.kill(process.pid, 'SIGTERM');
}

// Start command handler
bot.start(async (ctx) => {
    const form = ctx.message.from;
    console.log('form', form );
    try {
        // Find or create the user
        await User.findOneAndUpdate({ tgId: form.id }, {
            $setOnInsert: {
                name: form.first_name,
                username: form.username,
                isBot: form.is_bot
            }
        }, { upsert: true, new: true });
        
        await ctx.reply(`Welcome ${form.first_name}, I WILL WRITING HIGHLY ENGAGING CONTENT FOR YOU!, PLEASE SEND ME A PROMPT TO GET STARTED!`);
    } catch (err) {
        console.log(err);
        await ctx.reply('An error occurred while trying to save your data, please try again later');
    }
});

// Help command handler
bot.help((ctx) => ctx.reply('Send me a message @Exthi'));


bot.command('DO', async (ctx) => {
    const from = ctx.update.message.from;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    try {
        const events = await Event.find({
            tgId: from.id,
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });
        if (events.length === 0) {
            await ctx.reply('You have not sent any prompt for today, please send a prompt to get started!');
            return;
        }
        console.log('events', events);
        const messages = events.map(event => ({
            role: 'user',
            content: `${event.text}, make it sould very formal and announce ,  ${from.first_name}! `
        }));
        const completion = await openai.chat.completions.create({
            messages,
            model: process.env.OPEN_AI_MODEL,
        });
        console.log('completion', completion);
        if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
            const content = completion.choices[0].message.content;
            await ctx.reply(content);
        } else {
            await ctx.reply('Failed to generate content.');
        }
    } catch (err) {
        console.error('Error:', err);
        await ctx.reply('An error occurred while processing your request.');
    }
});


// Message handler
bot.on(message("text"), async (ctx) => {
    const text = ctx.update.message.text;
    console.log('text', text);
    try {
        // Save the event
        await Event.create({
            text: text,
            tgId: ctx.update.message.from.id
        });
        await ctx.reply(`please Enter /DO commad of making content for you!`);
    } catch (err) {
        console.log(err);
        await ctx.reply('An error occurred while trying to save your data, please try again later');
    }
});

// Launch the bot
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
