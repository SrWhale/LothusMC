const { createClient } = require('redis');

module.exports = class Redis {
    constructor(client) {
        this.client = client;

        this.name = 'Redis';
    }

    async load() {
        const client = createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            },
            password: process.env.REDIS_PASSWORD,
            pingInterval: 10000
        });

        this.client.redis = client;

        client.connect();

        client
            .on('connect', () => {
                this.client.log(`Redis conectado com sucesso!`, { tags: ['Redis'], color: 'green' });
            })
            .on('error', (err) => {
                this.client.log(`Erro ao conectar com o Redis!`, { tags: ['Redis'], color: 'red' });

                console.error(err);
            })
    }
}