
module.exports.init = function(app) {

  var mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/fb');

  var Schema = mongoose.Schema;
  var UserSchema = new Schema({
    facebookId: String,
    accessToken: String
  });
  var User = mongoose.model('User', UserSchema);
  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new FacebookStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://guns-kill-people.org/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      User.update({
        facebookId: profile.id
      }, {
        facebookId: profile.id,
        accessToken: accessToken
      }, {
        upsert: true
      }, function(err, user) {
        if (user.nModified == 0) {
          console.log('A new user was inserted:  "%s"', profile.id);
        } else
          console.log("This user already exists: " + profile.id);
        return done(err, user);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  app.get('/auth/facebook',
    passport.authenticate('facebook', {
      scope: 'publish_actions'
    }));

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/authfailed'
    }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    }
  );

  app.get('/authfailed', function(req, res) {
    res.sendFile(__dirname + '/fail.html');
  });
}
