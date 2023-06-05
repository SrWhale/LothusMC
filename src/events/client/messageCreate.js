const fs = require("fs");

const brain = require("brain.js");

const net = new brain.recurrent.LSTM();

module.exports = class messageCreateEvent {
    constructor(client) {
        this.client = client;

        this.name = 'messageCreate';
    }

    async run(message) {
        if (message.channel.type === 'dm') return;

        if (message.author.bot) return;

        if (this.client.config.canaisParaSubstituirMensagem.includes(message.channel.id)) {

            message.delete();

            let obj = {
                content: message.content,
                files: message.attachments.map(a => a.url)
            };

            if (!message.content.length) delete obj.content;

            message.channel.send({ ...obj });
        };

        if (this.client.config.antipalavras.blacklist.find(palavra => message.content?.split(" ").includes(palavra)) && !this.client.config.antipalavras.whitelist.find(palavra => message.content.includes(palavra)) && !this.client.config.antipalavras.bypassRoles.some(r => message.member.roles.cache.has(r))) {
            await message.member.send({
                content: `Ops! Você não pode falar \`${this.client.config.antipalavras.blacklist.filter(palavra => message.content?.split(" ").includes(palavra)).join(" | ")}\` no chat!`
            }).catch(err => message.reply({
                content: "Hey, há palavras nessa mensagem que não podem ser ditas!"
            }))

            await message.delete();
        }

        if (message.channel.id === "1115073278709604452") {
            const trainFile = JSON.parse(fs.readFileSync("train.json", "utf8"))

            let attempts = 0;

            const dataToTrain = trainFile;

            function checkSimilarity(str1, str2) {
                if (str1 === str2) return 1.0

                const len1 = str1.length
                const len2 = str2.length

                const maxDist = ~~(Math.max(len1, len2) / 2) - 1
                let matches = 0

                const hash1 = []
                const hash2 = []

                for (var i = 0; i < len1; i++)
                    for (var j = Math.max(0, i - maxDist); j < Math.min(len2, i + maxDist + 1); j++)
                        if (str1.charAt(i) === str2.charAt(j) && !hash2[j]) {
                            hash1[i] = 1
                            hash2[j] = 1
                            matches++
                            break
                        }

                if (!matches) return 0.0

                let t = 0
                let point = 0

                for (var k = 0; k < len1; k++)
                    if (hash1[k]) {
                        while (!hash2[point])
                            point++

                        if (str1.charAt(k) !== str2.charAt(point++))
                            t++
                    }

                t /= 2

                return ((matches / len1) + (matches / len2) + ((matches - t) / matches)) / 3.0
            }

            function getMostSimilar(question, arrayy) {
                let tests = [];

                arrayy.forEach(x => {
                    console.log(checkSimilarity(question.toLowerCase(), x.toLowerCase()), x)
                    tests.push(checkSimilarity(question.toLowerCase(), x.toLowerCase()))
                });
                return {
                    most: arrayy[tests.indexOf(Math.max(...tests))],
                    similarity: Math.max(...tests),
                    all: tests
                }
            };

            let msg;

            async function train(reply = true) {
                attempts++;

                const question = getMostSimilar(message.content, Object.keys(trainFile))

                console.log(question.all)
                if (question.similarity === 1 || question.all.length === 1 || (question.similarity > 0.5 && ((question.all.sort((a, b) => b - a)[0] - question.all.sort((a, b) => b - a)[1]) > 0.15))) return message.reply({
                    content: `${trainFile[question.most]} \n\nEsta resposta foi útio? Reaja com 👍 ou 👎`,
                    fetchReply: true
                }).then(async m => {
                    await m.react("👍");
                    await m.react("👎");

                    m.createReactionCollector({
                        filter: (reaction, user) => ["👍", "👎"].includes(reaction.emoji.name) && user.id === message.author.id,
                        max: 1,
                        time: 60000
                    }).on("collect", async ({ emoji }) => {
                        console.log(emoji)
                        if (emoji.name === "👍") {
                            message.reply({
                                content: "Obrigado por me ajudar a melhorar! :D",
                                ephemeral: true
                            })

                            dataToTrain[message.content] = trainFile[question.most];

                            fs.writeFileSync("train.json", JSON.stringify(dataToTrain));
                        } else {
                            await m.edit({
                                content: "Aguarde, estou estudando o que responder...",
                            });

                            msg = m;

                            net.train(Object.entries(dataToTrain).map(([key, value]) => {
                                return {
                                    input: key,
                                    output: value
                                }
                            }), {
                                parallel: {
                                    threads: 10,
                                    iterationsPerThread: 3,
                                    log: true,
                                    logPeriod: 1
                                },
                                iterations: 1000,
                                learningRate: 0.01,
                                hiddenLayers: [50, 50],
                                errorThresh: 0.005,
                                activation: 'tanh',
                                momentum: 0.5,
                                binaryThresh: 0.5,
                                beta1: 0.9,
                                beta2: 0.999,
                                epsilon: 1e-8,
                                logPeriod: 100,
                                log: true
                            });

                            const output = net.run(message.content);
                            
                            if (Object.values(dataToTrain).find(v => output.includes(v))) {

                                dataToTrain[message.content] = Object.values(dataToTrain).find(v => output.includes(v));

                                msg.edit({
                                    content: `${Object.values(dataToTrain).find(v => output.includes(v))} \n\nEsta resposta foi útil? Reaja com 👍 ou 👎`
                                });
                                
                                await m.react("👍");
                    			await m.react("👎");

                                fs.writeFileSync("train.json", JSON.stringify(dataToTrain));
                            } else if (attempts < 3) {
                                console.log("OXIII")
                                await train(false);
                            } else {
                                msg.edit({
                                    content: "Não sei o que responder, aguarde um membro da equipe de suporte."

                                })
                            }
                        }
                    })
                })

                if (reply) msg = await message.reply({
                    content: "Aguarde, estou estudando o que responder...",
                    fetchReply: true
                });

                net.train(Object.entries(dataToTrain).map(([key, value]) => {
                    return {
                        input: key,
                        output: value
                    }
                }), {
                    parallel: {
                        threads: 2,
                        iterationsPerThread: 3,
                        partitionSize: 3200,
                        log: false,
                        logPeriod: 1
                    },
                    iterations: 1000,
                    learningRate: 0.01,
                    hiddenLayers: [50, 50],
                    errorThresh: 0.005,
                    activation: 'tanh',
                    momentum: 0.5,
                    binaryThresh: 0.5,
                    beta1: 0.9,
                    beta2: 0.999,
                    epsilon: 1e-8,
                    logPeriod: 100,
                    log: true
                });

                const output = net.run(message.content);
                console.log(output)
                if (Object.values(dataToTrain).find(v => v.toLowerCase() === output.toLowerCase())) {

                    dataToTrain[message.content] = output;

                    msg.edit({
                        content: `${output} \n\nEsta resposta foi útil? Reaja com 👍 ou 👎`
                    })

                    fs.writeFileSync("train.json", JSON.stringify(dataToTrain));
                } else if (attempts < 10) {
                    console.log("OXIII")
                    await train(false);
                } else {
                    msg.edit({
                        content: "Não sei o que responder, aguarde um membro da equipe de suporte."

                    })
                }
            };

            train()
        }
    }
}
