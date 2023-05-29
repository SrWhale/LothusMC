const { PermissionFlagsBits } = require('discord.js');

const { join } = require('path');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Canal extends Command {
    constructor(client) {
        super(client, {
            name: 'canal',
            description: 'Gerencie o canal',
            default_member_permissions: Number(PermissionFlagsBits.ManageChannels),
            options: [{
                name: 'lock',
                description: 'Trave o canal',
                type: 1,
            }, {
                name: 'unlock',
                description: 'Destrave o canal',
                type: 1,
            }]
        });
    }

    async run({ interaction }) {

        const subCommand = interaction.options.getSubcommand();

        interaction.reply({
            content: `O canal foi **${subCommand === 'lock' ? 'travado' : 'destravado'}**.`,
            ephemeral: true
        });

        interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: subCommand === 'lock' ? false : true,
            AddReactions: subCommand === 'lock' ? false : true
        });
    }
}