const util = require('minecraft-server-util');

const { ActivityType } = require('discord.js');

module.exports = class ServerConnection {
    constructor(client) {
        this.client = client;

        this.name = 'ServerConnection';

        this.playersNow = 0;
    };

    async load() {
        this.startPresenceUpdater();
    }

    async startPresenceUpdater() {
        setInterval(() => {
            util.queryFull('199.127.62.146', 25627).then(response => {
                const players = response.players.list;

                if (players.length !== this.playersNow) {
                    this.playersNow = players.length;

                    this.client.user.setActivity(`👥 ${this.playersNow} jogadores online`, { type: ActivityType.Playing });
                }
            }).catch(err => {
                this.client.user.setActivity(`👥 0 jogadores online`, { type: ActivityType.Playing });
            })
        }, 10000)
    }
}