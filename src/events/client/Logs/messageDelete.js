module.exports = class messageDeleteEvent {
    constructor(client) {
        this.client = client;

        this.name = 'messageDelete';
    }

    async run(message) {

        if (message.guild?.id === process.env.PRINCIPAL_SERVER) {
            if (message.author.bot) return;

            const logsEmbed = new this.client.embed()

                .setAuthor({ name: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })

                .setFooter({ text: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })
                .setThumbnail(message.author.displayAvatarURL({ format: 'png', size: 4096 }))

                .setDescription(`${message.author} apagou uma mensagem! \n\nMensagem: \`${message.content}\``);

            this.client.channels.cache.get(this.client.config.logs.channel).send({
                embeds: [logsEmbed]
            });
        }
    }
}