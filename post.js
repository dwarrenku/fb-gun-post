var https = require('https');
var querystring = require('querystring');
var db = require('./db.js');
var moment = require('moment');

module.exports.post = function() {
  console.log("------------starting posts------------");
  db.getUsers(function(err, users) {
    if (err)
      console.log("Failed getting users for post");
    else
      db.getStats(function(err, stats) {
        if (err)
          console.log("Failed getting stats");
        else {
          if (stats.incidents > 0) {
          console.log(stats);
          var today = moment().format('MMMM Do') + ": In the past 72 hours.";
          var message = today + "\r\n" +
            stats.incidents + " instances of violence.\r\n" +
            "At least " + stats.killed + " people were killed and " +
            stats.injured + " people were injured by the use of a gun.";
          console.log(message);
            users.forEach(function(u) {
              console.log("posting to: " + u.facebookId);
              postToFB(u.accessToken, u.facebookId, message, function(err, res) {
                console.log(err);
                console.log(res);
                if (err)
                  console.log("error: " + JSON.toString(err));
                else {
                  console.log("success: " + JSON.toString(res));
                }
              })
            });
          }
        }
      });
  });
}

function postToFB(token, id, message, callback) {
  var path = '/' + id + '/feed?access_token=' + token;
  var post_data = querystring.stringify({
    'message': message,
    'link': 'http://www.gunviolencearchive.org/last-72-hours'
  });

  var options = {
    host: 'graph.facebook.com',
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  var req = https.request(options, function(res) {
    //console.log("statuscode: ", res.statuscode);
    //console.log("headers: ", res.headers);
    res.setEncoding('utf8');
    res.on('data', function(d) {
      d = JSON.parse(d);
      if (d.error) {
        console.log(
          id + " " + d.error.message + "\n" +
          "\tcode: " + d.error.code + " | subcode: " + d.error.error_subcode
        );
      }
    });
  });

  req.on('error', function(e) {
    console.log("\nProblem with facebook post request");
    console.error(e);
  });

  req.write(post_data);
  req.end();
}
