require('dotenv/config');

const { Client } = require('./src/Client/index.js');

const { GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
    presence: {
        activity: {
            name: 'mc-lothus.com',
            type: 'PLAYING'
        }
    },
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
    },
    restTimeOffset: 0,
    messageCacheMaxSize: 10,
    messageSweepInterval: 60 * 15,
    messageCacheLifetime: 60,
    messageEditHistoryMaxSize: 0,
});

client.login().then(async () => {
    await client.loadModules();
    await client.loadServices();
});

process.on('unhandledRejection', console.error);

process.on('uncaughtException', console.error);

