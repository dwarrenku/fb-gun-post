var express = require("express");
var https = require("https");
var db = require('./db.js');
var fb = require('./post.js');
require('dotenv').config();
var auth = require('./auth.js');
var schedule = require('node-schedule');
var app = express();

schedule.scheduleJob('0 */10 * * * *', db.scrape);
schedule.scheduleJob('0 0 0 21 * *', fb.post);


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

app.get('/test', function(req, res) {
  db.getStats(function(err, count) {});
});

app.get('/post', function(req, res) {
  fb.post();
})

app.listen(8080);
