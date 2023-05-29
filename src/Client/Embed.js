const { EmbedBuilder } = require('discord.js');

module.exports = class LothusEmbed extends EmbedBuilder {
    constructor(data = {}) {
        super(data);

        this.setAuthor({ name: 'LothusMC', iconURL: 'https://cdn.discordapp.com/icons/1091157350267768876/778960381631a8ec5c1ad30d3d1bc995.png' });

        this.setFooter({ text: 'LothusMC - 2023', iconURL: 'https://cdn.discordapp.com/icons/1091157350267768876/778960381631a8ec5c1ad30d3d1bc995.png' });

        this.setColor('#00aa00');
    }
}