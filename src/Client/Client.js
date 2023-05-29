const { Client, Collection } = require('discord.js');

const { readdirSync } = require('fs');

const chalk = require('chalk');

const _ = require('lodash');

const { join } = require('path');

module.exports = class LothusClient extends Client {
    constructor(options) {

        super(options);

        this.commands = new Collection();

        this.modules = new Collection();

        this.events = new Collection();

        this.services = new Collection();

        this.embed = require(join(process.cwd(), 'src', 'Client', 'Embed.js'));

        this.developers = ['624997146453737472'];

        this.config = require(join(process.cwd(), 'config.json'));
    }

    async login() {
        return super.login(process.env.TOKEN).then(() => {
            return this.log(`BOT Ligado com sucesso!`, { tags: ['Discord Client'], color: 'green' });
        }, (err) => {
            this.log(`Erro ao ligar o BOT!`, { tags: ['Discord Client'], color: 'red' });

            console.error(err);
        })
    }

    log(message, {
        tags = [],
        bold = false,
        italic = false,
        underline = false,
        reversed = false,
        bgColor = false,
        color = 'white'
    } = {}) {

        const colorFunction = _.get(
            chalk,
            [bold, italic, underline, reversed, bgColor, color].filter(Boolean).join('.')
        )

        console.log(...tags.map(t => chalk.cyan(`[${t}]`)), colorFunction(message))
    };

    msToTime(ms) {
        const seconds = ~~(ms / 1000)
        const minutes = ~~(seconds / 60)
        const hours = ~~(minutes / 60)
        const days = ~~(hours / 24)


        return days.toString().replace('0-', '') + "d, " + (hours % 24).toString().replace('0-', '') + 'h, ' + (minutes % 24).toString().replace('0-', '') + 'm e ' + (seconds % 24).toString().replace('0-', '') + 's'
    }

    async loadModules() {
        const modules = readdirSync('src/modules').filter(f => f.endsWith('.js'));

        for (const modulePath of modules) {

            const Module = require(join(process.cwd(), 'src/modules', modulePath));

            const module = new Module(this);

            try {
                await module.load();

                this.modules.set(module.name, module);

                this.log(`Módulo ${module.name} carregado com sucesso!`, { tags: ['Módulos'], color: 'green' });
            } catch (err) {
                this.log(`Erro ao carregar o módulo ${module.name}: ${err}`, { tags: ['Módulos'], color: 'red' });
            }
        }
    };

    async loadServices() {
        const services = readdirSync('src/services').filter(f => f.endsWith('.js'));

        for (const servicePath of services) {

            const Service = require(join(process.cwd(), 'src/services', servicePath));

            const service = new Service(this);

            this.services.set(service.name, service);

            try {
                await service.start();

                this.log(`Serviço ${service.name} carregado com sucesso!`, { tags: ['Serviços'], color: 'green' });
            } catch (err) {
                this.log(`Erro ao carregar o serviço ${service.name}: ${err}`, { tags: ['Serviços'], color: 'red' });
            }
        }
    }
} 