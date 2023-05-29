const { PermissionFlagsBits } = require('discord.js');

const { join } = require('path');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Clear extends Command {
    constructor(client) {
        super(client, {
            name: 'clear',
            description: 'Limpe o chat',
            default_member_permissions: Number(PermissionFlagsBits.ManageMessages),
            options: [{
                name: 'quantidade',
                description: 'Quantidade de mensagens a serem deletadas',
                type: 4,
                required: true
            }]
        });
    }

    async run({ interaction }) {

        await interaction.deferReply({
            ephemeral: true
        });

        const amount = interaction.options.getInteger('quantidade');

        const pagination = Math.ceil(amount / 100);

        for (let i = 0; i < pagination; i++) {
            await interaction.channel.bulkDelete(pagination > i + 1 ? 100 : amount - (100 * i), true).catch(err => true);
        };

        interaction.editReply({
            content: `**${amount}** mensagens foram deletadas com sucesso!`,
            ephemeral: true
        })
    }
}