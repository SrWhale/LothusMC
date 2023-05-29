module.exports = class messageCreateEvent {
    constructor(client) {
        this.client = client;

        this.name = 'messageCreate';
    }

    async run(message) {
        if (message.channel.type === 'dm') return;

        if (message.author.bot) return;

        if (this.client.config.canaisParaSubstituirMensagem.includes(message.channel.id)) {

            message.delete();

            let obj = {
                content: message.content,
                files: message.attachments.map(a => a.url)
            };

            if (!message.content.length) delete obj.content;

            message.channel.send({ ...obj });
        };

        if (this.client.config.antipalavras.blacklist.find(palavra => message.content?.split(" ").includes(palavra)) && !this.client.config.antipalavras.whitelist.find(palavra => message.content.includes(palavra)) && !this.client.config.antipalavras.bypassRoles.some(r => message.member.roles.cache.has(r))) {
            await message.member.send({
                content: `Ops! Você não pode falar \`${this.client.config.antipalavras.blacklist.filter(palavra => message.content?.split(" ").includes(palavra)).join(" | ")}\` no chat!`
            }).catch(err => message.reply({
                content: "Hey, há palavras nessa mensagem que não podem ser ditas!"
            }))

            await message.delete();
        }
    }
}