const { join } = require('path');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class ServerInfo extends Command {
    constructor(client) {
        super(client, {
            name: 'serverinfo',
            description: 'Veja informações desse Discord',
        });
    }

    async run({ interaction }) {
        const dono = interaction.guild.members.cache.get(interaction.guild.ownerId);

        const canais = {
            total: interaction.guild.channels.cache.size,
            text: interaction.guild.channels.cache.filter(c => c.type === 0).size,
            voice: interaction.guild.channels.cache.filter(c => c.type === 2).size,
        };

        const membros = interaction.guild.members.cache.size;

        const criado = new Date(interaction.guild.createdAt);

        const embed = new this.client.embed()
            .addFields([{
                name: '💻 ID',
                value: interaction.guild.id,
                inline: true
            }, {
                name: '📅 Criado em',
                value: `${criado.getDate()}/${criado.getMonth() + 1}/${criado.getFullYear()} às ${criado.getHours()}:${criado.getMinutes()}`,
                inline: true
            }, {
                name: '👑 Dono',
                value: `${dono} (${dono.user.id})`,
                inline: true
            }, {
                name: '👥 Membros',
                value: `${membros} membros`,
                inline: true
            }, {
                name: `📁 Canais (${canais.total})`,
                value: `📝 Texto: ${canais.text}\n🔊 Voz: ${canais.voice}`,
                inline: true
            }]);

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
}