const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, Collection, AttachmentBuilder } = require('discord.js');

module.exports = class TicketManager {
    constructor(client) {
        this.client = client;

        this.config = require('../config/Ticket.js');

        this.name = 'TicketManager';

        this.tickets = new Collection();
    }

    async start() {

        this.loadTickets();

        this.listenNewTickets();

        this.listenOpennedTickets();
    }

    async loadTickets() {
        const ref = await this.client.database.db('discord').collection('tickets').find({}).toArray();

        ref.forEach(ticket => this.tickets.set(ticket.userID, ticket))

        this.client.log(`${ref.length} Tickets carregados.`, { tags: ['Tickets'], color: 'green' });
    }

    async listenOpennedTickets() {
        this.client.on('interactionCreate', async interaction => {
            if (interaction.channel?.parent?.id !== '1092496422374494269');

            const ticket = this.tickets.find(ticket => ticket.channelID === interaction.channel?.id);

            if (!ticket) return;

            if (ticket.closed) return;

            switch (interaction.customId) {
                case 'close':

                    const row = new ActionRowBuilder()

                    const button = new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('Confirmar')
                        .setStyle('Success');

                    const cancel = new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('Cancelar')
                        .setStyle('Danger');

                    row.addComponents(button, cancel);

                    interaction.reply({
                        content: 'Tem certeza que deseja fechar o ticket? Esta ação não pode ser desfeita.',
                        ephemeral: true,
                        fetchReply: true,
                        components: [row]
                    }).then(async confirmMsg => {
                        confirmMsg.createMessageComponentCollector({
                            max: 1
                        })

                            .on('collect', async (b) => {
                                switch (b.customId) {
                                    case 'confirm':

                                        this.tickets.get(ticket.userID).closed = true;

                                        const messages = [];

                                        for (let i = 0; i < 5; i++) {
                                            interaction.channel.messages.fetch({ limit: 100 }, true).then(async msgs => {
                                                msgs.forEach(msg => {
                                                    if (msg.author.bot) return;

                                                    if (messages.find(m => m.id === msg.id)) return;

                                                    messages.push(msg);
                                                })
                                            }).catch(err => true);
                                        };

                                        let i = 5;

                                        await interaction.editReply({
                                            content: `Fechando o ticket em ${i} segundos...`,
                                            components: []
                                        });

                                        const interval = setInterval(async () => {
                                            i--;

                                            await interaction.editReply({
                                                content: `Fechando o ticket em ${i} segundos...`,
                                                components: []
                                            });

                                            if (i === 0) {
                                                interaction.channel.delete();

                                                const text = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).map(msg => {
                                                    const date = new Date(msg.createdTimestamp);

                                                    return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}] ${msg.author.username} (${msg.author.id}): ${msg.content}`
                                                }).join("\n");

                                                console.log(text)
                                                clearInterval(interval);

                                                this.tickets.delete(ticket.userID);

                                                this.client.database.db('discord').collection('tickets').deleteOne({ userID: ticket.userID });

                                                const user = await this.client.users.cache.get(ticket.userID);

                                                const obj = {
                                                    content: messages.length ? 'Seu ticket foi fechado por um membro da equipe. Acesse abaixo as logs.' : 'Seu ticket foi fechado por um membro da equipe, porém não foram enviadas mensagens.',
                                                    files: [messages.length ? new AttachmentBuilder(Buffer.from(text), { name: 'logs.txt' }) : []]
                                                };

                                                if (!messages.length) delete obj.files;

                                                if (user) user.send(obj).catch(err => true);

                                                obj.content = `Ticket de ${user?.tag || ticket.userID} fechado por ${interaction.user.tag}.`;

                                                this.client.channels.cache.get('1093268487620808735').send(obj);
                                            }
                                        }, 1000);

                                        break;
                                    case 'cancel':
                                        b.deferUpdate();

                                        interaction.editReply({
                                            content: 'Ação cancelada.',
                                            ephemeral: true,
                                            components: []
                                        })
                                        break;
                                }
                            })
                    })
                    break;
            }
        })
    }

    async listenNewTickets() {
        const channel = await this.client.channels.fetch("1091165501931126785");

        const messages = await channel.messages.fetch();

        const message = messages.find(msg => msg.author.id === this.client.user.id);

        const row = new ActionRowBuilder()

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket')
            .setPlaceholder('Selecione uma categoria')
            .addOptions(this.config.categories.map(category => {
                return {
                    label: category.name,
                    value: category.name,
                    emoji: category.emoji
                }
            }));

        row.addComponents(menu);

        message?.edit({
            content: '',
            embeds: [new this.client.embed()
                .setDescription(`<:Suportelothus:1092130728411680798> | **Central de atendimento**

→ Selecione uma categoria abaixo para abrir um ticket.

:alarm_clock: **Horário de atendimento:**
Segunda a sexta: 08:00h ás 20:00h
Sábado e domingo: 10:00 ás 20:00h

\`\`\`Após solicitar um atendimento, aguarde um integrante da equipe responde-lo(a). O atendimento é realizado de forma privada, contudo, somente integrantes da equipe terá acesso ao atendimento. Tenha ciência que a nossa equipe não se encontra presente 24 horas por dia, contudo, dentro dos horários citados acima nossa equipe se encontra disponibilizada a atende-lo(a).\`\`\``)],
            components: [row]
        }).then(msg => {
            msg.createMessageComponentCollector()

                .on('collect', async interaction => {
                    if (this.tickets.find(ticket => ticket.userID === interaction.user.id && this.client.channels.cache.get(ticket.channelID))) return interaction.reply({
                        content: `Você já possui um ticket aberto! Clique aqui para acessá-lo: ${this.client.channels.cache.get(this.tickets.find(ticket => ticket.userID === interaction.user.id).channelID)} `,
                        ephemeral: true
                    });

                    const category = this.config.categories.find(category => category.name === interaction.values[0]);

                    const channel = await interaction.guild.channels.create({
                        name: `${interaction.member.displayName}`,
                        type: ChannelType.GUILD_TEXT,
                        parent: this.config.PRIVATE_CATEGORY,
                        permissionOverwrites: [
                            ...interaction.guild.roles.cache.filter(r => r.hoist && r.comparePositionTo(interaction.guild.roles.cache.find(r => r.name === category.minimalRoles)) >= 0).map(r => {
                                return {
                                    id: r.id,
                                    allow: ['ViewChannel', 'SendMessages']
                                }
                            }),
                            {
                                id: interaction.guild.roles.everyone,
                                deny: ['ViewChannel', 'SendMessages']
                            }, {
                                id: interaction.user.id,
                                allow: ['ViewChannel', 'SendMessages']
                            }
                        ]
                    });

                    interaction.reply({
                        content: `Ticket criado com sucesso! Clique aqui para acessar: ${channel}`,
                        ephemeral: true
                    });

                    let msg = category.message;

                    const placeHolders = {
                        '@docara': `<@${interaction.user.id}>`
                    };

                    for (const placeholder of Object.entries(placeHolders)) {
                        msg = msg.replaceAll(placeholder[0], placeholder[1]);
                    }

                    const embed = new this.client.embed()
                        .setDescription(msg)

                    const row = new ActionRowBuilder()

                    const button = new ButtonBuilder()
                        .setCustomId('close')
                        .setLabel('Fechar ticket')
                        .setStyle('Danger');

                    row.addComponents(button);

                    channel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    this.client.database.db('discord').collection('tickets').insertOne({
                        userID: interaction.user.id,
                        channelID: channel.id,
                        category: category.name,
                        createdAt: Date.now()
                    });

                    this.tickets.set(interaction.user.id, {
                        userID: interaction.user.id,
                        channelID: channel.id,
                        category: category.name,
                        createdAt: Date.now()
                    })
                })
        })
    }
}