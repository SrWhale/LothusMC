const { ActivityType } = require('discord.js');

module.exports = class guildMemberAdd {
    constructor(client) {
        this.client = client;

        this.name = 'ready';

        this.now = 0;
    }
    async run(member) {
        setInterval(async () => {
            this.client.guilds.cache.get(process.env.PRINCIPAL_SERVER).members.cache.filter(m => !m.roles.cache.has('1091159340167213146')).forEach(m => {
                m.roles.add(['1091159340167213146'])
            });
        }, 10000);
    }
}