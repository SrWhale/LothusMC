const { Collection, ButtonBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require("discord.js");

const formConfig = require('../config/Form.js');

function progressBar(now, max) {
    const percent = Math.round((now / max) * 100);

    const bar = '█'.repeat(Math.round(percent / 10));

    const empty = '—'.repeat(10 - bar.length);

    return `[**${bar}${empty}**]`;
};

module.exports = class Form {
    constructor(client) {
        this.client = client;

        this.name = 'FormManager';

        this.collectors = new Collection();

        this.paused = new Collection();
    };

    async start() {
        this.listenNewForms();

        this.listenOpennedForms();
    };

    async listenOpennedForms() {
        this.client.on('interactionCreate', async interaction => {

            if (interaction.channel?.id !== '1091484131302584380') return;

            if (!interaction.isButton()) return;

            const userID = interaction.message.embeds[0].author.name.split(" ").slice(-1)[0].replace("(", '').replace(')', '');

            await interaction.deferUpdate();

            interaction.message.delete();

            const form = interaction.message.embeds[0].fields.map(field => `${field.name}: ${field.value}`).join("\n\n");

            const text = `Formulário de ${this.client.users.cache.get(userID).tag}
${interaction.customId === 'aceitar' ? 'Aceito' : 'Negado'} por ${interaction.user.tag}
                
Respostas:
                
${form}`;

            const attatch = new AttachmentBuilder(
                Buffer.from(text, 'utf-8'),
                {
                    name: `${this.client.users.cache.get(userID).tag}.txt`,
                }
            );

            this.client.channels.cache.get('1091700254744772798')
                .send({
                    content: `Formulário de ${this.client.users.cache.get(userID).tag} foi **${interaction.customId === 'aceitar' ? 'ACEITO' : 'NEGADO'}** por ${interaction.user}`,
                    files: [attatch]
                });

            if (interaction.customId === 'aceitar') {

                const convite = await this.client.guilds.cache.get('875776692268974090').invites.create('887202235715551312', {
                    maxAge: 60 * 60 * 24 * 3,
                    maxUses: 1,
                    unique: true,
                    reason: `Pré-seleção de ${this.client.users.cache.get(userID).tag}`
                });

                this.client.users.cache.get(userID)
                    .send({
                        embeds: [new this.client.embed()
                            .setDescription(`Olá, como vai? 
Após uma detida análise constatamos que você **atende** ao que buscamos, contudo, sua aplicação foi aceita. A partir de agora, você deve manter sigilo total em coisas relacionadas a pré-seleção e a equipe. Abaixo se encontra uma explicação referente a pré-seleção, leia com calma e atenção. 

**A pré-seleção ocorre através de duas etapas, sendo elas:**

:loud_sound: **Entrevista:**
> Nossas entrevistas buscam sempre conhecer melhor o candidato. Queremos saber mais sobre você, sua rotina, conhecimentos, experiências e etc. Normalmente nós entrevistamos os candidatos no turno da tarde, então fique online durante esse período que um membro da equipe irá chamá-lo.

:pencil: **Treinamento:**
> Após ser entrevistado, o candidato passará por uma espécie de treinamento e fará uma prova com base no que ele aprendeu em relação ao servidor. Com isso, a equipe decidirá se de fato o membro está apto ou não a ingressar na equipe. 

Para a realização da pré-seleção é preciso que entre em um novo discord, segue abaixo o link:
**Link do discord: ${convite}**`)
                        ]
                    }).catch(err => true)
            } else {
                this.client.users.cache.get(userID)
                    .send({
                        embeds: [new this.client.embed()
                            .setDescription(`Olá, como vai? 
Após uma detida análise constatamos que você não atende ao que buscamos, contudo, seu formulário foi **recusado**. Não desanime, você pode refazer o mesmo após 7 dias.`)]
                    }).catch(err => true)
            }
        })
    }

    async listenNewForms() {
        const channel = await this.client.channels.fetch("1092126939239678012");

        const messages = await channel.messages.fetch();

        const message = messages.find(msg => msg.author.id === this.client.user.id);

        const button = new ButtonBuilder()
            .setStyle('Primary')
            .setLabel('Aplicar-se')
            .setCustomId('aplicar');

        const row = new ActionRowBuilder()
            .addComponents(button);

        const formQuestions = formConfig.questions;

        if (message) {
            message.edit({ content: message.content, components: [row], fetchReply: true })

                .then(msg => {
                    msg.createMessageComponentCollector()

                        .on('collect', async b => {
                            if (this.collectors.get(b.user.id)) {
                                const collector = this.collectors.get(b.user.id);

                                this.paused.delete(b.user.id);

                                collector.stop();

                                this.collectors.delete(b.user.id);
                            };

                            const ref = await this.client.database.db('discord').collection('forms').findOne({ userID: b.user.id });

                            if (ref && ref.date > Date.now()) return b.reply({
                                content: `Você já preencheu um formulário recentemente. Aguarde ${this.client.msToTime(ref.date - Date.now())} para aplicar-se novamente.`,
                                ephemeral: true
                            })

                            if (ref) this.client.database.db('discord').collection('forms').deleteOne({ userID: b.user.id });

                            let index = 0;

                            const response = {};

                            const startRow = new ActionRowBuilder()
                                .addComponents(new ButtonBuilder()
                                    .setStyle('Primary')
                                    .setLabel('Iniciar')
                                    .setCustomId('start'));

                            await b.user.send({
                                embeds: [new this.client.embed()
                                    .setDescription(`Deseja iniciar?`)],
                                components: [startRow]
                            }).then(startMsg => {

                                b.reply({
                                    content: 'Verifique seu privado!',
                                    ephemeral: true
                                });

                                const collector = startMsg.createMessageComponentCollector({
                                    max: 1
                                });

                                this.collectors.set(b.user.id, collector);

                                collector.on('collect', async () => {

                                    startMsg.delete();

                                    b.user.send({
                                        embeds: [new this.client.embed()
                                            .setDescription(`Progresso: ${progressBar(index, formQuestions.length)}\n\n${formQuestions[index].name}`)]
                                    });

                                    const DM = await b.member.createDM();

                                    const DMCollector = DM.createMessageCollector({
                                        filter: (m) => m.author.id === b.user.id
                                    });

                                    this.collectors.set(b.user.id, DMCollector);

                                    DMCollector.on('collect', async (m) => {
                                        response[formQuestions[index].name] = m.content;

                                        if (m.content.length > 1024) return m.reply({
                                            content: `Sua resposta está muito grande! Tente resumir um pouquinho. **Máximo e 1024 palavras.** `
                                        });

                                        if (this.paused.get(b.user.id)) return;

                                        this.paused.set(b.user.id, true);

                                        const nextRow = new ActionRowBuilder()
                                            .addComponents(new ButtonBuilder()
                                                .setStyle('Primary')
                                                .setLabel('Prosseguir')
                                                .setCustomId('prosseguir'),
                                                new ButtonBuilder()
                                                    .setStyle('Danger')
                                                    .setLabel('Repetir')
                                                    .setCustomId('repetir'));

                                        await b.user.send({
                                            embeds: [new this.client.embed()
                                                .setDescription('Prosseguir para próxima pergunta?')],
                                            components: [nextRow]
                                        }).then(async nextMsg => {
                                            nextMsg.createMessageComponentCollector({
                                                max: 1
                                            })

                                                .on('collect', async (nextB) => {

                                                    this.paused.delete(b.user.id);

                                                    nextMsg.delete();

                                                    if (nextB.customId === 'prosseguir') {
                                                        if (index === formQuestions.length - 1) {

                                                            const confirmRow = new ActionRowBuilder()
                                                                .addComponents(
                                                                    new ButtonBuilder()
                                                                        .setStyle('Primary')
                                                                        .setLabel('Enviar')
                                                                        .setCustomId('enviar'),

                                                                    new ButtonBuilder()
                                                                        .setStyle('Danger')
                                                                        .setLabel('Repetir')
                                                                        .setCustomId('repetir'));

                                                            b.user.send({
                                                                embeds: [new this.client.embed()
                                                                    .setDescription(`Confirme o envio do formulário.`)],
                                                                components: [confirmRow]

                                                            }).then(async confirmMsg => {
                                                                const collectornew = confirmMsg.createMessageComponentCollector({
                                                                    max: 1
                                                                });

                                                                this.collectors.set(b.user.id, collectornew);

                                                                collectornew.on("collect", async (newB) => {

                                                                    confirmMsg.delete();

                                                                    if (newB.customId === 'enviar') {
                                                                        b.user.send({
                                                                            content: `Formulário enviado com sucesso!`
                                                                        });

                                                                        this.client.database.db('discord').collection('forms').insertOne({
                                                                            userID: b.user.id,
                                                                            date: Date.now() + require('ms')('7d')
                                                                        });

                                                                        DMCollector.stop();

                                                                        this.collectors.delete(b.user.id);

                                                                        const embed = new this.client.embed()
                                                                            .setAuthor({ name: `Formulário de aplicação de ${b.user.tag} (${b.user.id})`, iconURL: this.client.user.displayAvatarURL() })

                                                                        for (const [key, value] of Object.entries(response)) {
                                                                            embed.addFields({ name: key, value });
                                                                        };

                                                                        const manageRow = new ActionRowBuilder();

                                                                        const aceitarButton = new ButtonBuilder()
                                                                            .setStyle('Success')
                                                                            .setLabel('Aceitar')
                                                                            .setCustomId('aceitar');

                                                                        const recusarButton = new ButtonBuilder()
                                                                            .setStyle('Danger')
                                                                            .setLabel('Recusar')
                                                                            .setCustomId('recusar');

                                                                        manageRow.addComponents(aceitarButton, recusarButton);

                                                                        this.client.channels.cache.get('1091484131302584380').send({
                                                                            embeds: [embed],
                                                                            components: [manageRow]
                                                                        })
                                                                    } else {
                                                                        this.collectors.set(b.user.id, DMCollector);

                                                                        index = 0;

                                                                        b.user.send({
                                                                            embeds: [new this.client.embed()
                                                                                .setDescription(`Progresso: ${progressBar(index, formQuestions.length)}\n\n${formQuestions[index].name}`)]
                                                                        });
                                                                    }
                                                                })
                                                            })

                                                        } else {
                                                            index++;

                                                            b.user.send({
                                                                embeds: [new this.client.embed()
                                                                    .setDescription(`Progresso: ${progressBar(index, formQuestions.length)}\n\n${formQuestions[index].name}`)]
                                                            });
                                                        }
                                                    } else {
                                                        b.user.send({
                                                            embeds: [new this.client.embed()
                                                                .setDescription(`Progresso: ${progressBar(index, formQuestions.length)}\n\n${formQuestions[index].name}`)]
                                                        });
                                                    }
                                                })
                                        });
                                    })
                                })


                            }).catch(err => b.reply({
                                content: `Você precisa habilitar as mensagens diretas para poder iniciar o formulário.`,
                                ephemeral: true
                            }))
                        })
                })
        }
    }
}