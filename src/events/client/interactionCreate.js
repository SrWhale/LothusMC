module.exports = class interactionCreateEvent {
    constructor(client) {
        this.client = client;

        this.name = 'interactionCreate';
    };

    async run(interaction) {

        if (!interaction.isCommand()) return;

        const command = this.client.commands.get(interaction.commandName);

        if (!command) return;

        try {

            await command.verify({ interaction }).then(() => {
                command.run({ interaction })
            });

        } catch (error) {
            if(error !== 'developer error') console.log(error)
            if (error !== 'developer error') await interaction.reply({ content: 'Ocorreu um erro ao executar o comando.', ephemeral: true });
        }
    }
}