const { join } = require("path");

const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Editmsg extends Command {
    constructor(client) {
        super(client, {
            name: 'editmsg',
            description: 'Edite uma mensagem do BOT',
            default_member_permissions: Number(PermissionFlagsBits.Administrator),
            options: [{
                name: 'id',
                description: 'ID da mensagem',
                type: 3,
                required: true
            }]
        });
    }

    async run({ interaction }) {

        const id = interaction.options.getString('id');

        const message = await interaction.channel.messages.fetch(id);

        if (!message) return interaction.reply({
            content: "Mensagem não encontrada!",
            ephemeral: true
        });

        interaction.reply({
            content: 'Agora, envie a nova mensagem.',
            ephemeral: true,
            fetchReply: true
        }).then(async msg => {
            msg.channel.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1 })

                .on('collect', async (m) => {
                    m.delete();

                    message.edit({
                        content: m.content
                    });

                    interaction.editReply({
                        content: "Mensagem editada com sucesso."
                    })
                })
        })
    }
}