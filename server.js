//middleware and module requirements
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const express = require('express');
//declares API router
const apiRouter = require('./api/api');
//declars our server 'app' as an instance of 'express'
const app = express();
const PORT = process.env.PORT || 4000;
//third party middleware delcaration for our server to use
app.use(bodyParser.json());
app.use(cors());
//makes server use all ''/api' URL calls to the apiRouter
app.use('/api', apiRouter);
//makes server use middleware that sends error details to the client
app.use(errorhandler());
//command line message admin know the server is on
app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
});

module.exports = app;
