const { Collection } = require("discord.js");

module.exports = class GiveawayManager {
    constructor(client) {
        this.client = client;

        this.giveaways = new Collection();

        this.name = 'giveawayManager';
    }

    async start() {

        this.loadGiveaways();

        this.listenGiveaways();

        this.listenNewParticipants();
    }

    async loadGiveaways() {
        const ref = await this.client.database.db('discord').collection('giveaways').find({}).toArray()

        ref.forEach(g => this.giveaways.set(g.message, g));
    }

    async listenNewParticipants() {
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            if (interaction.customId !== 'giveaway') return;

            const giveaway = this.giveaways.get(interaction.message.id);

            if (!giveaway) return interaction.reply({
                content: 'Este sorteio já foi finalizado.',
                ephemeral: true
            });

            if ((Date.now() - interaction.user.createdAt) < require('ms')('7d')) return interaction.reply({
                content: `Para participar do sorteio sua conta precisa ter sido criada há pelo menos \`7 dias\`!`,
                ephemeral: true
            })

            if (giveaway.participants.find(p => p.id === interaction.user.id)) return interaction.reply({
                content: 'Você já está participando deste sorteio.',
                ephemeral: true
            });

            if (giveaway.vinculado) {
                const checkSync = await this.client.database.db('core').collection('players').findOne({
                    'social.discord': BigInt(interaction.user.id)
                });

                if (!checkSync) return interaction.reply({
                    content: `Para participar deste sorteio, você precisa estar vinculado. Dirija-se ao canal <#1091753544278880287> para mais informações de como se vincular.`,
                    ephemeral: true
                })
            }

            if (giveaway.invites && giveaway.invites > 0) {
                const checkInvites = await this.client.database.db('discord').collection('invites').findOne({
                    userID: interaction.user.id
                });

                if (!checkInvites || checkInvites.invites.length < giveaway.invites) return interaction.reply({
                    content: `Para participar deste sorteio, você precisa ter convidado pelo menos ${giveaway.invites} pessoas. Convide mais ${giveaway.invites - (checkInvites ? checkInvites.invites.length : 0)} pessoas e tente novamente.`,
                    ephemeral: true
                })
            };

            interaction.message.edit({
                components: interaction.message.components.map(c => {
                    c.components[0].data.label = `Participar (${giveaway.participants.length + 1})`;

                    return c;
                })
            })

            await this.client.database.db('discord').collection('giveaways').updateOne({
                message: giveaway.message
            }, {
                $push: {
                    participants: {
                        id: interaction.user.id,
                    }
                }
            });

            this.giveaways.get(interaction.message.id).participants.push({
                id: interaction.user.id
            });

            return interaction.reply({
                content: 'Você entrou no sorteio com sucesso.',
                ephemeral: true
            });
        })
    }

    async listenGiveaways() {
        setInterval(() => {
            const endedGiveaways = this.giveaways.filter(g => g.endAt <= Date.now() && !g.ended);

            endedGiveaways.forEach(async g => {

                const fullGiveaway = await this.client.database.db('discord').collection('giveaways').findOne({
                    message: g.message
                });

                const users = fullGiveaway.participants.map(p => p.id);

                const winners = [];

                for (let i = 0; i < fullGiveaway.winners; i++) {
                    const winner = users.filter(u => !winners.find(w => w === u))[Math.floor(Math.random() * users.filter(u => !winners.includes(u)).length)];

                    if (!winner) break;

                    if (winner) {
                        winners.push(winner);
                    }
                };

                const channel = this.client.channels.cache.get(g.channel);

                const message = await channel.messages.fetch(g.message).catch(err => false);

                if (message) message.reply({
                    content: winners.map((winner, i) => {
                        const reactNumber = users.indexOf(winner) + 1;

                        return `Parabéns <@${winner}>! Você foi o ganhador N° \`${i + 1}\` do sorteio! (\`${reactNumber}°\` a reagir)`
                    }).join("\n") || 'Não houve ganhadores do sorteio.'
                });

                if (message) message.edit({
                    content: message.content.replace(`Sorteio termina`, `Sorteio finalizado`)
                })

                this.giveaways.delete(g.message);

                this.client.database.db('discord').collection('giveaways').updateOne({
                    message: g.message
                }, {
                    $set: {
                        ended: true
                    }
                });
            });
        }, 1000)
    }
}