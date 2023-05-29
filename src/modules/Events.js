const { readdirSync, statSync } = require('fs');

const { join } = require('path');

module.exports = class Events {
    constructor(client) {
        this.client = client;

        this.name = 'Events';
    }

    async load() {
        await this.getEvents('src/events');
    };

    async getEvents(path) {
        const events = readdirSync(path);

        for (const eventPath of events) {
            if (eventPath.endsWith('.js')) {

                const event = require(join(process.cwd(), path, eventPath));

                const ev = new event(this.client);

                this.client.on(ev.name, (...args) => ev.run(...args));

                this.client.events.set(ev.name, ev);

            } else if (statSync(path + '/' + eventPath).isDirectory()) {
                await this.getEvents(path + '/' + eventPath);
            }
        };
        return true;
    };
}