const { readdirSync, statSync } = require('fs');

const { join } = require('path');

module.exports = class Commands {
    constructor(client) {
        this.client = client;

        this.name = 'Commands';


    }

    async load() {
        await this.getCommands('src/commands');

        this.client.application.commands.set(this.client.commands.map(command => command));
    };

    async getCommands(path) {
        const commands = readdirSync(path);

        for (const commandPath of commands) {
            if (commandPath.endsWith('.js')) {

                const command = require(join(process.cwd(), path, commandPath));

                const cmd = new command(this.client);

                this.client.commands.set(cmd.name, cmd);

            } else if (statSync(path + '/' + commandPath).isDirectory()) {
                await this.getCommands(path + '/' + commandPath);
            }
        };
        return true;
    };
}