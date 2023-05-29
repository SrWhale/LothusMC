const { join } = require('path');

const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');

const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Sorteio extends Command {
    constructor(client) {
        super(client, {
            name: 'sorteio',
            description: 'Faça um sorteio',
            default_member_permissions: Number(PermissionFlagsBits.Administrator),
            require_password: true,
            options: [{
                name: 'criar',
                description: 'Crie um sorteio',
                type: 1,
                options: [{
                    name: 'ganhadores',
                    description: 'Quantidade de ganhadores',
                    type: 4,
                    required: true
                }, {
                    name: 'duração',
                    description: 'Duração do sorteio (ex: 1h, 1d, 1m)',
                    type: 3,
                    required: true
                }, {
                    name: 'senha',
                    description: 'Senha para executar o comando',
                    type: 3,
                    required: true
                }, {
                    name: 'vinculado',
                    description: 'Necessário estar vinculado',
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }, {
                    name: 'invites',
                    description: 'Quantidade de invites necessários',
                    type: 4,
                    required: false
                }]
            }, {
                name: 'cancelar',
                description: 'Cancela um sorteio',
                type: 1,
                options: [{
                    name: 'id',
                    description: 'ID da mensagem do sorteio',
                    type: 3,
                    required: true
                }, {
                    name: 'senha',
                    description: 'Senha para executar o comando',
                    type: 3,
                    required: true
                }]
            }, {
                name: 'editar',
                description: 'Edite um sorteio',
                type: 1,
                options: [{
                    name: 'id',
                    description: 'ID da mensagem do sorteio',
                    type: 3,
                    required: true
                }, {
                    name: 'senha',
                    description: 'Senha para executar o comando',
                    type: 3,
                    required: true
                }, {
                    name: 'ganhadores',
                    description: 'Quantidade de ganhadores',
                    type: 4,
                    required: false
                }, {
                    name: 'duração',
                    description: 'Duração do sorteio a partir de agora (ex: 1h, 1d, 1m)',
                    type: 3,
                    required: false
                }, {
                    name: 'vinculado',
                    description: 'Necessário estar vinculado',
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }, {
                    name: 'invites',
                    description: 'Quantidade de invites necessários',
                    type: 4,
                    required: false
                }]
            }]
        });
    }

    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'editar') {
            const id = interaction.options.getString('id');

            const giveaway = this.client.services.get('giveawayManager').giveaways.get(id);

            if (!giveaway) return interaction.reply({
                content: 'Esse sorteio não existe.',
                ephemeral: true
            });

            const news = {
                winners: interaction.options.getInteger('ganhadores'),
                vinculado: interaction.options.getBoolean('vinculado'),
                invites: interaction.options.getInteger('invites'),
                endAt: (interaction.options.getString('duração'))
            };

            const giveawayMessage = await this.client.channels.cache.get(giveaway.channel).messages.fetch(giveaway.message);

            for (const [key, value] of Object.entries(news)) {

                if (value === undefined || value === null) continue;

                if (key === 'endAt') {
                    giveaway[key] = require('ms')(value) + Date.now();
                } else {
                    giveaway[key] = value;
                }
            }

            interaction.reply({
                content: 'Agora, envie a nova mensagem.',
                ephemeral: true,
                fetchReply: true
            }).then(async msg => {
                msg.channel.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1 })

                    .on('collect', async (m) => {
                        m.delete();

                        const row = new ActionRowBuilder()

                        const button = new ButtonBuilder()
                            .setCustomId('giveaway')
                            .setLabel(`Participar (${giveaway.participants.length})`)
                            .setStyle('Primary')

                        row.addComponents(button);

                        const variáveis = {
                            '{duração}': `<t:${Math.floor((giveaway.endAt) / 1000)}:R>`
                        };

                        let string = m.content;

                        for (const variavel of Object.entries(variáveis)) {
                            string = string.replace(variavel[0], variavel[1]);
                        };

                        string += `\n\nSorteio termina ${variáveis['{duração}']}`

                        giveawayMessage.edit({
                            content: string,
                            components: [row],
                            fetchReply: true
                        }).then(giveMsg => {
                            giveaway.message = giveMsg.id;

                            this.client.services.get('giveawayManager').giveaways.set(giveMsg.id, giveaway);

                            this.client.database.db('discord').collection('giveaways').updateOne({ message: giveaway.message }, { $set: giveaway });

                            interaction.editReply({
                                content: 'Sorteio editado com sucesso.',
                                ephemeral: true
                            });
                        })
                    })
            })

        } else if (subcommand === 'criar') {

            const ganhadores = interaction.options.getInteger('ganhadores');
            const invites = interaction.options.getInteger('invites');
            const vinculado = interaction.options.getBoolean('vinculado');
            const duração = interaction.options.getString('duração');

            const time = require('ms')(duração);

            if (!time) return interaction.reply({
                content: 'Duração inválida.',
                ephemeral: true
            });

            interaction.reply({
                content: `Configurações recebidas com sucesso. Envie a mensagem do sorteio para que ele seja iniciado.
            
            **Note que as seguintes variáveis podem ser utilizadas:**
            
            \`{duração}\` - Duração do sorteio
            
            **Para cancelar, digite \`cancelar\`**`,
                ephemeral: true,
                fetchReply: true
            }).then(async msg => {
                msg.channel.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1 })

                    .on('collect', async (m) => {
                        m.delete();

                        const row = new ActionRowBuilder()

                        const button = new ButtonBuilder()
                            .setCustomId('giveaway')
                            .setLabel('Participar (0)')
                            .setStyle('Primary')

                        row.addComponents(button);

                        const now = Date.now();

                        const variáveis = {
                            '{duração}': `<t:${Math.floor((now + time) / 1000)}:R>`
                        };

                        let string = m.content;

                        for (const variavel of Object.entries(variáveis)) {
                            string = string.replace(variavel[0], variavel[1]);
                        };

                        string += `\n\nSorteio termina ${variáveis['{duração}']}`

                        m.channel.send({
                            content: string,
                            components: [row],
                            fetchReply: true
                        }).then(giveMsg => {
                            const giveawayData = {
                                message: giveMsg.id,
                                channel: m.channel.id,
                                guild: m.guild.id,
                                winners: ganhadores,
                                invites: invites,
                                vinculado: vinculado,
                                endAt: time + now,
                                owner: interaction.user.id,
                                ended: false,
                                participants: []
                            };

                            this.client.database.db('discord').collection('giveaways').insertOne(giveawayData);

                            this.client.services.get('giveawayManager').giveaways.set(giveMsg.id, giveawayData);
                        })

                        interaction.editReply({
                            content: 'Sorteio criado com sucesso.',
                            ephemeral: true
                        });
                    })
            })
        } else {
            const id = interaction.options.getString('ID da mensagem');

            if (!this.client.services.get('giveawayManager').giveaways.has(id)) return interaction.reply({
                content: 'Sorteio não encontrado.',
                ephemeral: true
            });

            this.client.services.get('giveawayManager').giveaways.delete(id);

            this.cient.database.db('discord').collection('giveaways').deleteOne({
                message: id
            })
            interaction.reply({
                content: 'Sorteio cancelado com sucesso!',
                ephemeral: true
            })
        }
    }
}