const axios = require('axios');
const config = require('../config');

const snowClient = axios.create({
    baseURL: `${config.snowInstance}/api/now/table`,
    auth: { username: config.snowUser, password: config.snowPass },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

module.exports = snowClient;
