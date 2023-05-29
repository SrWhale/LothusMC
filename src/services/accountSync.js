const { Collection, ButtonBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = class accountSync {
    constructor(client) {
        this.client = client;

        this.name = 'accountSync';

        this.codes = new Collection();
    }

    async start() {

        this.loadMessage();

        this.client.redis.on('connect', () => {
            const channel = this.client.redis.duplicate();

            const channel2 = this.client.redis.duplicate();

            this.channel = channel;

            this.channel2 = channel2;

            channel2.connect();

            channel.connect();

            channel.on('connect', () => {
                this.client.log(`Canal de sincronização de vinculados conectado.`, { tags: ['Account Sync'], color: 'green' });

                channel.subscribe('DISCORD_VINCULE_ACCOUNT', (message) => {
                    const json = JSON.parse(message.toString());

                    if (json.state !== 'PENDENTE') return;

                    console.log(`Código ${json.code} recebido para o nick ${json.name}!`);

                    this.codes.set(json.code, json);

                    setTimeout(() => {
                        this.codes.delete(json.code);
                    }, 60000 * 2);
                }, true);
            });

            channel.on('error', (err) => {
                this.client.log(`Erro ao conectar com o Redis de Sincronização!`, { tags: ['Redis'], color: 'red' });

                console.error(err);
            })

            channel2.on('connect', () => {
                this.client.log(`Canal de sincronização de desvinculados conectado.`, { tags: ['Account Sync'], color: 'green' });

                channel2.subscribe('DISCORD_UNVINCULE_ACCOUNT', async (message) => {

                    const json = JSON.parse(message.toString());

                    const id = json.id;

                    console.log(`Unsync do ID ${id} recebido!`)

                    const member = await this.client.guilds.cache.get(process.env.PRINCIPAL_SERVER).members.fetch(BigInt(id).toString())

                    member.roles.remove(member.roles.cache.filter(r => r.id !== '1091159340167213146'));

                    member.setNickname(null);

                    return;
                })
            })

            channel2.on('error', (err) => {
                this.client.log(`Erro ao conectar com o Redis de Dessincronização!`, { tags: ['Redis'], color: 'red' });

                console.error(err);
            })
        })
    };

    async loadMessage() {
        const channel = await this.client.channels.fetch("1091753544278880287");

        const messages = await channel.messages.fetch();

        const message = messages.find(msg => msg.author.id === this.client.user.id);

        const button = new ButtonBuilder()
            .setStyle('Primary')
            .setLabel('Vincular')
            .setCustomId('vincular');

        const row = new ActionRowBuilder()
            .addComponents(button);

        const modal = new ModalBuilder()
            .setTitle('Vincular conta')
            .setCustomId('vincular')

        const input = new TextInputBuilder()
            .setCustomId('code')
            .setPlaceholder('AKJLQP')
            .setLabel('Código')
            .setMaxLength(6)
            .setMinLength(6)
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

        const modalRow = new ActionRowBuilder()
            .addComponents(input);

        modal.addComponents(modalRow);

        if (message) {
            message.edit({ content: message.content, components: [row], fetchReply: true })

                .then(msg => {
                    msg.createMessageComponentCollector()

                        .on('collect', async b => {
                            b.showModal(modal);

                            const submit = await b.awaitModalSubmit({
                                time: 60000,
                                filter: (i) => i.user.id === b.user.id
                            }).then(e => e).catch(() => null);

                            if (!submit) return;

                            const code = submit.fields.getTextInputValue('code').toUpperCase()

                            const codeInfo = this.client.services.get('accountSync').codes.get(code);

                            if (!codeInfo) return submit.reply({
                                content: 'O código informado não existe.',
                                ephemeral: true
                            });

                            this.client.services.get('accountSync').codes.delete(code);

                            submit.reply({
                                content: 'Sua conta foi vinculada com sucesso.',
                                ephemeral: true
                            });

                            codeInfo.state = 'VINCULADO';

                            codeInfo.id = b.user.id;

                            this.client.redis.publish('DISCORD_VINCULE_ACCOUNT', JSON.stringify(codeInfo));

                            b.member.roles.add(['1091757368196485150']);

                            b.member.setNickname(codeInfo.name);
                        })
                })
        }
    }
}