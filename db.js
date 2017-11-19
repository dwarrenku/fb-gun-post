var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/fb';

module.exports.getStats = function(callback) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var start = moment().startOf('day').toDate();
    var end = moment().endOf('day').toDate();
    var killed = 0;
    var injured = 0;
    var collection = db.collection('documents');
    var cursor = collection.find({
      date: {
        $gte: start,
        $lt: end
      }
    });

    // Execute the each command, triggers for each document
    cursor.each(function(err, item) {
      if (item != null) {
        killed += item.Killed;
        injured += item.Injured;
      } else {
        callback(null, {killed : killed, injured : injured});
      }
    });

    db.close();
  });
}

module.exports.getUsers = function(callback) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('users');
    collection.find({}).toArray(function(err, results) {
      if (err) throw err;
      callback(null, results);
      db.close();
    });
  });
}

module.exports.scrape = function() {
  request('http://www.gunviolencearchive.org/last-72-hours', function(err, resp, body) {
    console.log('error:', err); // Print the error if one occurred
    console.log('statusCode:', resp && resp.statusCode); // Print the response status code if a response was received

    if (err)
      throw err;
    $ = cheerio.load(body);

    var headers = [];
    var rows = [];

    $("table").find("thead th").each(function() {
      var str = $(this).text();
      if (str.includes("#"))
        str = str.substring(str.indexOf("#") + 2)
      else if (str.toLowerCase().includes("city"))
        str = "CityState";
      else if (str.toLowerCase().includes("date"))
        str = "date";
      else if (str.toLowerCase().includes("operations"))
        str = "Links";
      headers.push(str);
    });

    //for each row
    $("table").find("tbody tr").each(function() {
      var obj = {};
      //for each cell in row
      $(this).find("td").each(function(i, elem) {
        if (headers[i] === "date")
          obj[headers[i]] = moment($(this).text(), "MMMM D, YYYY").toDate();
        //if there are links, store them as links
        else if (headers[i] === "Links") {
          var links = [];
          $(this).find("a").each(function() {
            links.push($(this).attr('href'));
          })
          obj[headers[i]] = links;
        } else if (headers[i] === "Killed" || headers[i] === "Injured") {
          obj[headers[i]] = Number($(this).text());
        } else { // if it isn't a link, store it as text
          obj[headers[i]] = $(this).text();
        }
      });
      rows.push(obj);
    });

    console.log(rows[0].Links[0]);
    //console.log(JSON.stringify(rows));

    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      var collection = db.collection('documents');
      // Insert some documents
      rows.forEach((d) => {
        collection.update({
          "Links.0": d.Links[0]
        }, d, {
          upsert: true
        });
      });
      db.close();
    });
  });
}
