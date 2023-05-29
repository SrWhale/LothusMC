const { join } = require('path');

const { PermissionFlagsBits } = require('discord.js');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Tag extends Command {
    constructor(client) {
        super(client, {
            name: 'tag',
            description: 'Gerencie as tags de um membro',
            default_member_permissions: Number(PermissionFlagsBits.Administrator),
            require_password: true,
            options: [{
                name: 'setar',
                description: 'Sete uma tag em um usuário',
                type: 1,
                options: [{
                    name: 'membro',
                    description: 'Membro a ser gerenciado',
                    type: 6,
                    required: true
                }, {
                    name: 'cargo',
                    description: 'Cargo a ser gerenciado',
                    type: 8,
                    required: true
                }, {
                    name: 'senha',
                    description: 'Senha para executar o comando',
                    type: 3,
                    required: true
                }]
            }, {
                name: 'remover',
                description: 'Remova uma tag de um usuário',
                type: 1,
                options: [{
                    name: 'membro',
                    description: 'Membro a ser gerenciado',
                    type: 6,
                    required: true
                }, {
                    name: 'cargo',
                    description: 'Cargo a ser gerenciado',
                    type: 8,
                    required: true
                }, {
                    name: 'senha',
                    description: 'Senha para executar o comando',
                    type: 3,
                    required: true
                }]
            }]
        });
    }

    async run({ interaction }) {

        const membro = interaction.options.getMember('membro');

        const cargo = interaction.options.getRole('cargo');

        const subcommand = interaction.options.getSubcommand();

        const find = await this.client.database.db('core').collection('players').find({ 'social.discord': BigInt(membro.id) }).toArray();

        if (!find[0]) return interaction.reply({
            content: 'Esse membro não está vinculado.',
            ephemeral: true
        });

        if (cargo.comparePositionTo(interaction.member.roles.highest) >= 0) return interaction.reply({
            content: 'Eu não tenho permissão para adicionar/remover esse cargo.',
            ephemeral: true
        });

        membro.roles[subcommand === 'setar' ? 'add' : 'remove'](cargo).then(() => {
            interaction.reply({
                content: `Cargo ${subcommand === 'setar' ? 'adicionado' : 'removido'} com sucesso!`,
                ephemeral: true
            });
        }).catch(err => {
            interaction.reply({
                content: `Ocorreu um erro ao ${subcommand === 'setar' ? 'adicionar' : 'remover'} o cargo: \`\`\`js\n${err}\`\`\``,
                ephemeral: true
            });
        })
    }
}