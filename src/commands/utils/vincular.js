const { join } = require('path');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Vincular extends Command {
    constructor(client) {
        super(client, {
            name: 'vincular',
            description: 'Vincule seu discord com a conta do servidor',
            options: [{
                name: 'código',
                description: 'Código informado no servidor',
                type: 3,
                required: true
            }]
        });
    }

    async run({ interaction }) {

        const code = interaction.options.getString('código');

        const codeInfo = this.client.services.get('accountSync').codes.get(code);

        if (!codeInfo) return interaction.reply({
            content: 'O código informado não existe.',
            ephemeral: true
        });

        this.client.services.get('accountSync').codes.delete(code);

        interaction.reply({
            content: 'Sua conta foi vinculada com sucesso.',
            ephemeral: true
        });

        codeInfo.state = 'VINCULADO';

        codeInfo.id = interaction.user.id;

        this.client.redis.publish('DISCORD_VINCULE_ACCOUNT', JSON.stringify(codeInfo));

        interaction.member.roles.add(['1091757368196485150']);

        interaction.member.setNickname(codeInfo.name);
    }
}