const { SlashCommandBuilder, Collection } = require('discord.js');

module.exports = class Command extends SlashCommandBuilder {
    constructor(client, options) {

        super();

        Object.assign(this, options);

        this.client = client;

        this.passwordSaves = new Collection();

        this.formatCommand();
    }

    async formatCommand() {
        this.options = this.options?.map(option => ({ ...option, toJSON: function () { return this; } })) || [];
    }

    async verify({ interaction }) {
        return new Promise((res, rej) => {
            if (this.isDev && !this.client.developers.includes(interaction.user.id)) {
                interaction.reply({
                    content: `Você precisa ser um desenvolvedor para executar este comando!`,
                    ephemeral: true
                });

                return rej('developer error');
            };

            if (this.require_password) {
                const senha = interaction.options.getString('senha');

                if (this.client.config.admins.find(a => a.id === interaction.user.id).senha !== senha) {
                    interaction.reply({
                        content: 'Senha incorreta, comando negado.',
                        ephemeral: true
                    });

                    this.passwordSaves.get(interaction.user.id) ? this.passwordSaves.get(interaction.user.id).saves++ : this.passwordSaves.set(interaction.user.id, { saves: 1 });

                    if (this.passwordSaves.get(interaction.user.id).saves >= 3) {
                        interaction.member.roles.remove(interaction.member.roles.cache.filter(r => r.id !== '1091159340167213146'));

                        interaction.member.send('Você foi removido de todos os cargos por ter digitado a senha incorreta 3 vezes.').catch(() => { });
                    };

                    setTimeout(() => {
                        this.passwordSaves.get(interaction.user.id).saves--;
                    }, 60000);

                    return rej('developer error');
                };


            }

            res(true);
        })
    }
}