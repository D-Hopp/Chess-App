var express = require('express');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
//http request logging
var logger = require('morgan');
//protection from https headers
var helmet = require('helmet')
var session = require('express-session');

var app = express();

//ejs layout
var expressLayouts = require('express-ejs-layouts')

//import db and session
var db = require('./db')
//var session = require('express-session');

//Import routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth')
var roomRouter = require('./routes/room')
var queueRouter = require('./routes/queue')
var challengeRouter = require('./routes/challenge')


//security
app.use(helmet({
  contentSecurityPolicy: false, // Fix for Bootstrap
}))

// view engine setup
app.use(expressLayouts)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('title', 'chess-app')

// setup sessions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionParser = session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: process.env.SESSION_SECRET
})
app.use(sessionParser);

// Session-persisted message middleware

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) console.log(error);
  if (msg) console.log(msg);
  next();
});

// setup middleware
app.use(logger(':req[x-real-ip] :url'));
app.use(cookieParser());



// setup routes - dynamic
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter)
app.use('/room', roomRouter)
app.use('/queue', queueRouter)
app.use('/challenge', challengeRouter)

// setup routes - static
app.use(express.static('public/stylesheets'));
app.use(express.static(path.join(__dirname, 'public', 'javascripts')));
app.use(express.static(path.join(__dirname, 'public', 'images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/impressum',(req, res, next) => res.render('impressum', {script: 'impressum', username: req.session?.user.name}))


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.sendFile('./public/impressum.html');
});


module.exports = {app: app, session: sessionParser};
