// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var ejs = require('ejs');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



// custom libraries
// routes
var route = require('./route');
// model
var Model = require('./model');

var app = express();
// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
var sess;
// var session = require('express-session');
//  app.use(session({
//   cookieName: 'session',
//   secret: 'ecommerce',
//   duration: 30 * 60 * 1000,
//   activeDuration: 5 * 60 * 1000,
// }));

passport.use(new LocalStrategy(function(username, password, done) {
   new Model.User({uName: username}).fetch().then(function(data) {
      var user = data;
      console.log("Paspsort!");
      if(user === null) {
         console.log("Invalid uname");
         return done(null, false, {message: 'That username and password combination was not correct'});
      } else {
         user = data.toJSON();
         if(!(password == user.pWord)) {
            console.log("Invalid password");
            return done(null, false, {message: 'That username and password combination was not correct'});
         } else {

            return done(null, user);
         }
      }
   });
}));

passport.serializeUser(function(user, done) {
  done(null, user.uName);
});

passport.deserializeUser(function(username, done) {
   new Model.User({uName: username}).fetch().then(function(user) {
      done(null, user);
   });
});

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser());
app.use(session({secret: 'secret strategic xxzzz code'}));
app.use(passport.initialize());
app.use(passport.session());

// GET
app.get('/', route.index);
app.get('/viewUsers', route.viewUsers);
app.get('/getProducts', route.getProducts);
// signin
// GET
app.get('/login', route.signIn);
// POST
app.post('/login', route.signInPost);

// signup
// GET
app.get('/registerUser', route.signUp);
// POST
app.post('/registerUser', route.signUpPost);
app.post('/modifyProduct', route.modifyProduct);
// logout
// GET
app.post('/logout', route.signOut);
app.post('/buyProduct', route.buyProduct);
app.post('/getOrders', route.getOrders);
app.get('/updateInfo',route.updateInfo);
app.post('/updateInfo',route.updateInfoPost);

/********************************/

/********************************/
// 404 not found
app.use(route.notFound404);

var server = app.listen(app.get('port'), function(err) {
   if(err) throw err;

   var message = 'Server is running @ http://localhost:' + server.address().port;
   console.log(message);
});

