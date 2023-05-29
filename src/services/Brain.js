const brain = require('brain.js');

module.exports = class Brain {
    constructor(client) {
        this.client = client;

        this.name = 'Brain';
    }

    async start() {
        // const net = new brain.recurrent.LSTM();

        // const train = async () => {
        //     const data = [
        //         {
        //             input: 'Qual o IP do servidor?',
        //             output: 'Alguem me manda o IP'
        //         },
        //         { input: 'Qual é o anime mais popular de todos os tempos?', output: 'O anime mais popular de todos os tempos é Naruto.' },
        //         { input: 'Qual é o anime mais triste?', output: 'Existem muitos animes tristes, mas um dos mais conhecidos e emocionantes é Clannad.' },
        //     ];
        //     console.log("INICIANDO TRAIN")
        //     net.train(data);
        //     console.log("UU")
        //     console.log(net.run("qual o ip do sv?"))
        // };
        // train()
    };
}