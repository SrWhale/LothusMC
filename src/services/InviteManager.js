const InvitesTracker = require('@androz2091/discord-invites-tracker');

module.exports = class InviteManager {
    constructor(client) {
        this.client = client;

        this.name = 'InviteManager';
    }

    async start() {
        const tracker = InvitesTracker.init(this.client, {
            fetchGuilds: true,
            fetchVanity: true,
            fetchAuditLogs: true
        });

        tracker.on('guildMemberAdd', async (member, type, invite) => {

            if ((Date.now() - member.user.createdAt) < require('ms')('7d')) return console.log("MEMBRO MUITO NOVO.");

            if (type === 'unknown') {
                member.send({
                    content: `Ops! Não consegui detectar a pessoa que te convidou. Se você quiser, você pode sair e entrar no servidor novamente, para que eu consiga contabilizar o convite para a pessoa.`
                }).catch(err => true);
            };

            if (!invite) return;

            const check = await this.client.database.db('discord').collection('invites').findOne({
                userID: invite.inviter.id
            });

            if (check) {
                if (check.invites.find(i => i.id === member.id)) return;

                await this.client.database.db('discord').collection('invites').updateOne({
                    userID: invite.inviter.id
                }, {
                    $push: {
                        invites: {
                            id: member.id,
                            joinedAt: Date.now()
                        }
                    }
                })
            } else {
                await this.client.database.db('discord').collection('invites').insertOne({
                    userID: invite.inviter.id,
                    invites: [{
                        id: member.id,
                        joinedAt: Date.now()
                    }]
                })
            };

            this.client.channels.cache.get(`1092946513489055805`).send({
                content: `**${member.user.tag}** entrou no servidor por **${invite.inviter.tag}**.`
            })
        })
    }
}