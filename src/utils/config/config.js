/* eslint-disable linebreak-style */
const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  redis: {
    host: process.env.REDIS_SERVER,
  },
};

module.exports = config;
