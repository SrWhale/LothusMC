const express = require("express");

const https = require('https');

const http = require("http");

const app = express();

const fs = require('fs');

const cors = require('cors');

const { Collection } = require("discord.js");

app.use(express.json());

app.use(cors());

const routes = express.Router();

module.exports = class API {
    constructor(client) {
        this.client = client;

        this.name = "API";

        this.cooldown = new Collection();
    }

    async load() {

        routes.get('/privacidade', async (req, res) => {
            return res.sendFile("politicas.html", {
                root: `/Users/megawin/Desktop/sucumba/src/config`
            })
        });

        routes.get('/login', async (req, res) => {
            const { username, password } = req.query;
            console.log(username, password)
            if (!username || !password) return res.send({ status: false })

            const user = await this.client.database.db('app').collection('profiles').findOne({
                nickname: username,
                password
            });

            res.send({ status: user ? true : false, data: user })
        });

        routes.get('/', async (req, res) => {
            res.send({ status: true })
        });

        routes.get('/buy', async (req, res) => {
            const { produtoData, username, password } = req.query;

            const parse = JSON.parse(produtoData);

            const check = await this.client.database.db('app').collection('profiles').findOne({
                nickname: username,
                password
            });

            if (!check) return res.send({
                status: false,
                error: "LOGIN INVÀLIDO"
            });

            const userSchema = this.client.database.db('core').collection('players');

            const item = await this.client.database.db("app").collection("shop").findOne({
                produto: parse.produto,
                subproduto: parse.subproduto,
                VALOR: parse.VALOR
            });

            const profile = await userSchema.findOne({
                name: username
            });

            if (profile.cash < item.VALOR) return res.send({
                status: false,
                error: "SALDO INSUFICIENTE"
            });

            const format = {
                "CASH": item.produto.toLowerCase().includes("cash"),
                "VIP": item.produto.toLowerCase().includes("vip"),
                "BOX": item.produto.toLowerCase().includes("caixa"),
                "COSMETICS": item.produto.toLowerCase().includes("cosméticos")
            };

            const type = Object.entries(format).find(([key, value]) => Boolean(value))[0];

            switch (type) {
                case 'CASH':
                    this.client.database.db('core').collection('players').updateOne({
                        name: user
                    }, {
                        $inc: {
                            cash: item.add_database
                        }
                    });
                    break;

                case 'VIP':
                    const ranking = ["CEO", "GER", "DEV", "ADMIN", "MOD", "AJD", "YT_PLUS", "YT", "STREAM", "BUILDER", "BETA", "COPA", "MASTER", "PRO", "VIP", "MEMBRO"];

                    const userRank = profile.group.rank

                    console.log(userRank, item.add_database, ranking.indexOf(userRank), ranking.indexOf(item.add_database))
                    if (!(ranking.indexOf(userRank) <= ranking.indexOf(item.add_database))) {
                        userSchema.updateOne({
                            name: username
                        }, {
                            $set: {
                                "group.rank": item.add_database,
                                "group.tag": item.add_database,
                            },
                            $inc: {
                                "group.expires": Date.now() + (Number(item.duration) * 8.64e+7)
                            }
                        });
                    } else return res.send({
                        status: false,
                        error: "Você já possui esse item"
                    })
                    break;
            }

            userSchema.updateOne({
                name: username
            }, {
                $inc: {
                    cash: -(Number(item.VALOR))
                }
            });

            const userDc = this.client.users.cache.get(BigInt(profile.social.discord).toString());

            userDc?.send(`Você acaba de realizar a compra de **${item.produto} - ${item.subproduto}** por **${item.VALOR}** CASH. Verifique sua conta no servidor.`);

            console.log({
                name: username,
                product: `${item.produto} ${item.subproduto ? ` - ` + item.subproduto : ""}`,
                type,
                days: 7
            })

            this.client.redis.publish("BUY_IN_APP", JSON.stringify({
                name: username,
                product: `${item.produto} ${item.subproduto ? ` - ` + item.subproduto : ""}`,
                type,
                days: 7
            }));

            return res.send({
                status: true
            })
        })
        routes.get('/adsense', async (req, res) => {
            const user = req.query.user_id;

            const userProfile = await this.client.database.db('core').collection('players').findOne({ name: user });

            if (!userProfile) return res.send({
                status: false
            })

            this.client.database.db('core').collection('players').updateOne({
                name: user
            }, {
                $inc: {
                    cash: Number(req.query.reward_amount)
                }
            });

            const userDc = this.client.users.cache.get(BigInt(userProfile.social.discord).toString());

            userDc?.send(`Você ganhou ${req.query.reward_amount} coins por assistir um anúncio! Obrigado :D`);

            res.send({ status: true });

            this.client.redis.publish("APP_UPDATE_ACCOUNT", JSON.stringify({
                nickname: user,
                cash: userProfile.cash + Number(req.query.reward_amount)
            }))
        })
        routes.get('/getUserData', async (req, res) => {
            const { username } = req.query;

            if (!username) return res.send({ status: false });

            const profile = await this.client.database.db('core').collection('players').findOne({ name: username });

            if (!profile) return res.send({ status: false });

            const data = {
                profile: { ...profile, discordTag: profile.social.discord ? this.client.users.cache.get(BigInt(profile.social.discord).toString()) : undefined },
                skywars: {
                    profile: await this.client.database.db('skywars').collection('players').findOne({ uniqueId: profile.uniqueId }),
                    solo: await this.client.database.db('skywars').collection('solo').findOne({ uniqueId: profile.uniqueId }),
                    team: await this.client.database.db('skywars').collection('team').findOne({ uniqueId: profile.uniqueId }),
                },
            }

            return res.send({ status: true, data })
        });

        routes.get('/getShop', async (req, res) => {
            const shop = await this.client.database.db('app').collection('shop').find({}).toArray();

            return res.send({
                status: true,
                data: shop
            })
        })

        routes.get('/new_ads_rewarded', async (req, res) => {
            const { user, reward, Date } = req.query;

            if (!user || !reward) return;

            if (this.cooldown.get(user)) return;

            const userProfile = await this.client.database.db('core').collection('players').findOne({ name: user });

            if (!userProfile) return;

            this.cooldown.set(user, { value: 120, user });

            setTimeout(() => {
                this.cooldown.delete(user);
            }, 60000 * 2);
        })

        routes.get('/check_time', async (req, res) => {
            const { user } = req.query;

            return res.send({ status: this.cooldown.get(user) ? true : false, data: this.cooldown.get(user)?.value })
        });

        setInterval(() => {
            this.cooldown.forEach(co => {

                this.cooldown.get(co.user).value--
            })
        }, 1100)

        app.use(routes);

        const options = {
            key: fs.readFileSync('C:/Certbot/live/api.mc-lothus.com/privkey.pem'),
            cert: fs.readFileSync("C:/Certbot/live/api.mc-lothus.com/cert.pem")
        };

        https.createServer(options, app).listen(443, () => {
            this.client.log(`API iniciada com sucesso`, { color: 'green', tags: ['API'] })
        });

        http.createServer(app).listen(25567, () => {
            console.log("YEAH")
        })
    }
}