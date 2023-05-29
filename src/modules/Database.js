const { MongoClient } = require('mongodb');

module.exports = class Database {
    constructor(client) {
        this.client = client;

        this.name = 'Database';
    }

    async load() {

        const client = new MongoClient(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`);

        client.connect().then(async () => {
            this.client.log('MongoDB Conectado com Sucesso!', { color: 'green', tags: ['Database'] });
        })
            .catch(err => {
                console.log(err)
                this.client.log('Erro ao conectar ao MongoDB!', { color: 'redgreen', tags: ['Database'] });
            })

        this.client.database = client;

        // mongoose.connection.on('connected', () => {
        //     this.client.log('MongoDB Conectado com Sucesso!', { color: 'green', tags: ['Database'] })
        // });

        // mongoose.connection.on('err', err => {
        //     this.client.log('Erro ao conectar a database \n\n' + err, { color: 'red', tags: ['Database'] })
        // });

        // mongoose.connection.on('disconnected', () => {
        //     this.client.log('MongoDB desconectado com Sucesso!', { color: 'yellow', tags: ['Database'] })
        // });
    }
}