const { join } = require('path');

const { PermissionFlagsBits } = require('discord.js');

const { Command } = require(join(process.cwd(), 'src/Client', 'index.js'));

const fetch = require('node-fetch');

const { registerFont, createCanvas, loadImage } = require('canvas')

registerFont('open-sans-bold.ttf', { family: 'Open Sans' });

module.exports = class Tag extends Command {
    constructor(client) {
        super(client, {
            name: 'changelog',
            description: 'Poste um changelog',
            default_member_permissions: Number(PermissionFlagsBits.Administrator),
            require_password: true,
            options: [{
                name: 'nick',
                description: 'Nick do usuário',
                type: 3,
                required: true
            }, {
                name: 'cargo',
                description: 'Cargo da atualização',
                type: 8,
                required: true
            }, {
                name: 'tipo',
                description: 'Tipo da atualização',
                type: 3,
                required: true,
                choices: [{
                    name: 'Adicionado',
                    value: 'Adicionado'
                }, {
                    name: 'Promovido',
                    value: 'Promovido'
                }, {
                    name: 'Removido',
                    value: 'Removido'
                }, {
                    name: 'Rebaixado',
                    value: 'Rebaixado'
                }]
            }, {
                name: 'senha',
                description: 'Senha para executar o comando',
                type: 3,
                required: true
            }]
        });
    }

    async run({ interaction }) {

        const nick = interaction.options.getString('nick') || 'pauloheroo';

        const cargo = interaction.options.getRole('cargo') || interaction.guild.roles.cache.find(r => r.name == 'CEO');

        const tipo = interaction.options.getString('tipo') || 'Adicionado';

        const color = tipo === 'Removido' ? "#b4b4b4" : cargo.hexColor;

        const canvas = createCanvas(700, 100)

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#171717';

        for (let i = 0; i < 43; i++) {
            ctx.fillRect(20, 30, canvas.width - (i > 20 ? i + 5 : i + 5), Math.floor(i));

            i += 0.5;
        }

        ctx.fillStyle = "#3f3c3c"

        ctx.arc(47, 50, 40, 0, Math.PI * 2, true);

        ctx.fill();

        ctx.font = '20px Open Sans';

        ctx.textAlign = 'start';

        ctx.fillStyle = color;

        const opts = {
            Adicionado: 'integrou a equipe como',
            Promovido: 'foi promovido a',
            Removido: 'não integra mais a equipe',
            Rebaixado: 'foi rebaixado a'
        };

        const fullString = nick + ' ' + opts[tipo] + ' ' + (tipo === 'Removido' ? '' : cargo.name);

        let now = 100

        for (let i = 0; i < fullString.length; i++) {

            ctx.fillStyle = i < nick.length ? color : i < nick.length + opts[tipo].length + 2 ? '#ffffff' : color;
            ctx.fillText(fullString[i], now, 43 + 15);

            if (fullString[i + 1]) now += ctx.measureText(fullString[i]).width;
        };

        await fetch(`https://mc-heads.net/head/${nick}`, {
            mode: 'no-cors',
        }).then(response => response.blob()).then(async blob => {

            const buff = Buffer.from(await blob.arrayBuffer());

            await loadImage(buff).then(image => {

                ctx.beginPath();

                ctx.shadowColor = 'black';

                ctx.shadowBlur = 15;

                ctx.drawImage(image, 16, 16, image.width / 3 + 2, image.height / 3 + 2);

                ctx.shadowBlur = 15;
            });

            ctx.beginPath();

            ctx.strokeStyle = color;

            ctx.fillStyle = color;

            ctx.lineWidth = 2;

            ctx.shadowBlur = 0;

            ctx.beginPath();

            ctx.moveTo(700, 29);

            ctx.moveTo(690, 29);

            ctx.quadraticCurveTo(690, 65, 670, 72);

            ctx.moveTo(700, 29);

            ctx.quadraticCurveTo(700, 65, 670, 72);

            ctx.moveTo(691, 29);

            ctx.quadraticCurveTo(691, 65, 670, 72);

            ctx.moveTo(692, 29);

            ctx.quadraticCurveTo(692, 65, 670, 72);

            ctx.moveTo(693, 29);

            ctx.quadraticCurveTo(693, 65, 670, 72);

            ctx.moveTo(694, 29);

            ctx.quadraticCurveTo(694, 65, 670, 72);

            ctx.moveTo(695, 29);

            ctx.quadraticCurveTo(695, 65, 670, 72);

            ctx.moveTo(696, 29);

            ctx.quadraticCurveTo(696, 65, 670, 72);

            ctx.moveTo(697, 29);

            ctx.quadraticCurveTo(697, 65, 670, 72);

            ctx.moveTo(698, 29);

            ctx.quadraticCurveTo(698, 65, 670, 72);

            ctx.moveTo(699, 29);

            ctx.quadraticCurveTo(699, 65, 670, 72);

            ctx.moveTo(690, 29);

            ctx.lineTo(700, 29);

            ctx.clip();

            ctx.stroke();

            ctx.beginPath()

            ctx.moveTo(701, 29);

            ctx.quadraticCurveTo(701, 65, 671, 73);

            interaction.reply({
                content: 'Changelog enviado com sucesso.',
                ephemeral: true
            });

            interaction.channel.send({
                files: [{
                    attachment: canvas.toBuffer(),
                    name: 'changelog_image.png'
                }]
            })
        })
    }
}