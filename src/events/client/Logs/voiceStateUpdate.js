module.exports = class voiceStateUpdateEvent {
    constructor(client) {
        this.client = client;

        this.name = 'voiceStateUpdate';
    }

    async run(oldState, newState) {

        if (oldState.guild.id === process.env.PRINCIPAL_SERVER) {

            const logsEmbed = new this.client.embed()
                .setAuthor({ name: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })

                .setFooter({ text: 'LothusMC - Logs', iconURL: this.client.user.displayAvatarURL() })

                .setThumbnail(oldState.member.user.displayAvatarURL({ format: 'png', size: 4096 }));

            if (oldState.channel) {

                if (!newState.channel) {

                    logsEmbed.setDescription(`${oldState.member} saiu do canal de voz \`${oldState.channel.name}\`. `)

                    this.client.channels.cache.get(this.client.config.logs.channel).send({
                        embeds: [logsEmbed]
                    })
                } else if (newState.channel && newState.channel.id !== oldState.channel.id) {

                    logsEmbed.setDescription(`${newState.member} trocou do canal de voz \`${oldState.channel.name}\` para o \`${newState.channel.name}\`. `)

                    this.client.channels.cache.get(this.client.config.logs.channel).send({
                        embeds: [logsEmbed]
                    });
                }
            } else if (newState.channel) {

                logsEmbed.setDescription(`${newState.member} entrou no canal de voz \`${newState.channel.name}\`. `);

                this.client.channels.cache.get(this.client.config.logs.channel).send({
                    embeds: [logsEmbed]
                })
            }
        }
    }
}