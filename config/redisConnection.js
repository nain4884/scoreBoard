const { createClient } = require("redis");

const redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});
redisClient.connect().then(console.log("connect redis")).catch(console.error);

module.exports = redisClient;