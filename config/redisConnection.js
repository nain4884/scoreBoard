const { createClient } = require("redis");

const redisClient = createClient({
    host: "localhost",
    port: 6379,
});
redisClient.connect().then(console.log("connect redis")).catch(console.error);

module.exports = redisClient;