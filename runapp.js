const app = require('./app.js');

const dotenv = require('dotenv');
dotenv.config();

var event, context;
app.lambdaHandler(event, context);