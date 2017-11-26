var express = require("express");
var https = require("https");
var http = require("http");
var fs = require("fs");
var db = require('./db.js');
var fb = require('./post.js');
require('dotenv').config();
var auth = require('./auth.js');
var schedule = require('node-schedule');
var app = express();

schedule.scheduleJob('0 59 * * * *', db.scrape);
schedule.scheduleJob('0 0 21 * * *', fb.post);

var useHttps = true;
var httpApp = null,
  httpsApp = null;

if (useHttps) {
  // if you want to redirect to https, you HTTP service must be empty and have only this middleware
  httpApp = http.createServer(function(req, res) {
    res.writeHead(301, {
      "Location": "https://" + req.headers.host + req.url
    });
    res.end();
  });

  var options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
  };
  httpsApp = https.createServer(options, app);
  httpsApp.listen(443);
} else {
  httpApp = http.createServer(app);
  httpApp.listen(80);
}

//the facebook oAuth stuff is in here
auth.init(app);

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/about', function(req, res) {
  res.sendFile(__dirname + '/static/about.html');
});

app.get('/scrape', function(req, res) {
  db.scrape();
  res.send("done");
});

app.get('/post', function(req, res) {
  fb.post();
  res.send("done");
})
