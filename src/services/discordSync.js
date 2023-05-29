module.exports = class discordSync {
    constructor(client) {
        this.client = client;

        this.name = 'discordSync';
    }

    async start() {

        this.startInterval();

        const format = {
            CEO: '1091159377395851315',
            COORD: '1091165757464916008',
            GER: '1091168942711648347',
            DEV: '1091430376032960572',
            ADMIN: '1091178304662421668',
            MOD: '1091168867319029820',
            AJD: '1091168850415984762',
            YT_PLUS: '1091169006792233062',
            YT: '1093316438317604914',
            STREAM: '1093316500812730478',
            BUILDER: '1093317351547609168',
            BETA: '1093317743790534738',
            COPA: '1093317856906715198',
            MASTER: '1106768641694892123',
            PRO: '1093318232699572285',
            VIP: '1093318361926082560',
            MEMBRO: '1091159340167213146',
        };

        const channel = this.client.redis.duplicate();

        channel.connect();

        channel.on("connect", () => {

            channel.subscribe('DISCORD_UPDATE_GROUP', async (message) => {
                const json = JSON.parse(message.toString());
                console.log(json);
                const fetchUser = await this.client.database.db('core').collection('players').find({ uniqueId: json.id }).toArray();

                console.log(fetchUser[0].social.discord)
                const member = await this.client.guilds.cache.get(process.env.PRINCIPAL_SERVER).members.fetch(fetchUser[0].social.discord.toString())

                const roleToSet = Object.entries(format).find(f => f[0] === json.rank)[0];

                if (!roleToSet) return consolelog("SEM ROLE PARA SETAR");

                member.roles.add([format[roleToSet]])
            })
        })
        this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.guild.id === process.env.PRINCIPAL_SERVER) {

                //Role Syncronization Module
                const servers = this.client.guilds.cache.filter(s => s.members.cache.has(oldMember.id) && s.id !== oldMember.guild.id).map(s => s);

                for (const server of servers) {

                    const m = server.members.cache.get(oldMember.id);

                    const addRoles = newMember.roles.cache.map(r => server.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase())).filter(r => r && r.hoist && !m.roles.cache.has(r.id));

                    const removeRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id)).map(r => server.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase())).filter(r => r && r.hoist && m.roles.cache.has(r.id)).map(r => r)

                    if (removeRoles.length) await m.roles.remove(removeRoles, 'Sincronização automática de cargos.').catch(err => console.log(err));

                    if (addRoles.length) await m.roles.add(addRoles, 'Sincronização automática de cargos.').catch(err => console.log(err));
                };


                // Anti role Changes - Module
                const roles1 = oldMember.roles.cache.map(r => r.id);
                const roles2 = newMember.roles.cache.map(r => r.id);
                const guild = this.client.guilds.cache.get(oldMember.guild.id);

                if (roles1.find(r => !roles2.find(e => e === r)) || roles2.find(r => !roles1.find(e => e === r))) {
                    guild.fetchAuditLogs({ type: 25, limit: 1 }).then(async e => {

                        if (!e.entries.first()) return;

                        const autor = guild.members.cache.get(e.entries.first().executor.id);

                        const allowedUsersToChangeStaff = this.client.config.alterar_nicks_e_cargos;

                        if (!allowedUsersToChangeStaff.includes(autor.id)) {
                            autor.send({
                                embeds: [
                                    new this.client.embed()
                                        .setAuthor({ name: 'LothusMC - Módulo de Segurança', iconURL: this.client.user.displayAvatarURL() })
                                        .setTitle('Ação não autorizada.')
                                        .setDescription(`Hey, ${autor}. Você não tem autorização para mexer em cargos de equipe.`)
                                        .setFooter({ text: 'Isto é um erro? Contate HerobossG0D no privado.', iconURL: this.client.user.displayAvatarURL() })
                                        .setTimestamp()
                                ]
                            })

                            if (oldMember.roles.cache.size > newMember.roles.cache.size) newMember.roles.add(e.entries.first().changes[0].new.map(r => r.id), 'Ação não autorizada.')
                            else newMember.roles.remove(e.entries.first().changes[0].new.map(r => r.id), 'Ação não autorizada.')
                        } else {
                            const logsEmbed = new this.client.embed()
                                .setAuthor({ name: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })
                                .setFooter({ text: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })
                                .setThumbnail(newMember.user.displayAvatarURL({ format: 'png', size: 4096 }))
                                .setTitle(`Alterado por ${autor.user.tag}`)
                                .setDescription(`Cargos de ${newMember.user} alterados!\n\nCargos antigos: ${oldMember.roles.cache.map(r => r).filter(r => r.id !== oldMember.guild.id).join(", ")}\n\nCargos novos: ${newMember.roles.cache.map(r => r).filter(r => r.id !== oldMember.guild.id).join(", ")} `)

                            this.client.channels.cache.get('1092235313067335700')
                                .send({
                                    embeds: [logsEmbed]
                                });

                            if (oldMember.roles.hoist !== newMember.roles.hoist) {
                                const newRoleToSet = newMember.roles?.hoist?.id;

                                if (!newRoleToSet) return;

                                const roleToSet = Object.entries(format).find(f => f[1] === newRoleToSet)?.[0] || "MEMBRO";

                                if (!roleToSet) return console.log("SEM ROLE PARA SETAR");

                                const update = await this.client.database.db('core').collection('players').updateOne({
                                    'social.discord': BigInt(oldMember.id)
                                }, { $set: { 'group.rank': roleToSet, 'group.tag': roleToSet } });

                                if (update.modifiedCount === 1) {

                                    const find = await this.client.database.db('core').collection('players').find({ 'social.discord': BigInt(oldMember.id) }).toArray();

                                    this.client.redis.publish('DISCORD_ALTER_GROUP', JSON.stringify({
                                        uniqueId: find[0].uniqueId
                                    }))
                                };
                            }
                        }
                    })
                };
            }
        })
    }

    async startInterval() {
        setInterval(async () => {
            const principalServer = this.client.guilds.cache.get(process.env.PRINCIPAL_SERVER);

            const allServers = this.client.guilds.cache.map(s => s).filter(s => s.id !== process.env.PRINCIPAL_SERVER);

            const equipeServer = this.client.guilds.cache.get('1091479380770959362');

            const allowedMembers = principalServer.members.cache.filter(c => equipeServer.members.cache.has(c.id)).map(m => m);

            for (const server of allServers) {
                for (const member of allowedMembers) {

                    const m = server.members.cache.get(member.id);

                    if (!m) continue;

                    if (m.nickname !== member.nickname) m.setNickname(member.nickname, 'Sincronização automática de Nickname.').catch(() => false);

                    const oldMemberRolesName = member.roles.cache.map(r => r.name);

                    const oldMemberRoles = server.roles.cache.filter(r => oldMemberRolesName.includes(r.name)).filter(r => r && r.hoist)

                    const rolesToRemove = m.roles.cache.filter(r => !oldMemberRoles.has(r.id)).filter(r => r && r.hoist).map(r => r)

                    const rolesToAdd = oldMemberRoles.filter(r => !m.roles.cache.has(r.id)).map(r => r);

                    if (rolesToRemove.length) await m.roles.remove(rolesToRemove, 'Sincronização automática de cargos.').catch(() => false);

                    if (rolesToAdd.length) await m.roles.add(rolesToAdd, 'Sincronização automática de cargos.').catch(() => false);
                }
            }
        }, 10000)
    }
}