var express = require("express");
var https = require("https");
var helmet = require('helmet');
var fs = require("fs");
var db = require('./db.js');
var fb = require('./post.js');
require('dotenv').config();
var auth = require('./auth.js');
var schedule = require('node-schedule');
var app = express();

var sixtyDaysInSeconds = 5184000
app.use(helmet.hsts({
  maxAge: sixtyDaysInSeconds
}));


schedule.scheduleJob('0 59 * * * *', db.scrape);
schedule.scheduleJob('0 0 21 * * *', fb.post);

var options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
};

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

app.all('*', ensureSecure); // at top of routing calls

function ensureSecure(req, res, next){
  if(req.secure){
    // OK, continue
    return next();
  };
  // handle port numbers if you need non defaults
  // res.redirect('https://' + req.host + req.url); // express 3.x
  res.redirect('https://' + req.hostname + req.url); // express 4.x
}

app.createServer(app).listen(80);
https.createServer(options, app).listen(443);
