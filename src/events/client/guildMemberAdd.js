module.exports = class guildMemberAdd {
    constructor(client) {
        this.client = client;

        this.name = 'guildMemberAdd'
    }
    async run(member) {
        member.roles.add(['1091159340167213146']);
    }
}