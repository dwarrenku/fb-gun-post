var express = require("express");
var https = require("https");
var http = require("http");
var fs = require("fs");
var db = require('./db.js');
var fb = require('./post.js');
require('dotenv').config();
var auth = require('./auth.js');
var schedule = require('node-schedule');

schedule.scheduleJob('0 59 * * * *', db.scrape);
schedule.scheduleJob('0 0 21 * * *', fb.post);

var options = {
  cert: fs.readFileSync('./sslcert/fullchain.pem'),
  key: fs.readFileSync('./sslcert/privkey.pem')
};

var app = express();

app.use(function(req, res, next) {
  if (!/https/.test(req.protocol)) {
    res.redirect("https://" + req.headers.host + req.url);
  } else {
    return next();
  }
});

var webServer = app.listen(443, function() {
  console.log('Listening on port %d', webServer.address().port);
});

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
