const { inspect } = require('util');

const { join } = require('path');

const { PermissionFlagsBits } = require('discord.js');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

module.exports = class Eval extends Command {
    constructor(client) {
        super(client, {
            name: 'eval',
            description: 'Evaluate code.',
            isDev: true,
            default_member_permissions: Number(PermissionFlagsBits.Administrator),
            options: [{
                name: 'code',
                description: 'Código a ser executado',
                type: 3,
                required: true
            }]
        });
    }

    async run({ interaction }) {
        await interaction.deferReply({
            ephemeral: true
        });

        const code = interaction.options.getString('code');

        let result;

        try {
            const ev = eval(code);

            result = inspect(ev, { depth: 0 });
        } catch (err) {
            result = err.toString()
        };

        interaction.editReply({
            content: `\`\`\`js\n${result}\`\`\``,
            ephemeral: true
        })
    }
}