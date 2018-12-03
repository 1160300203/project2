var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// create session
var session = require('express-session');


// database setup
var db = require("mongoose");
db.connect('mongodb://localhost/project2',(err)=>{
    if (err)
        console.log("MongoDB connection error: "+err);
    else
        console.log("Connected to MongoDB");
});

// create Login mongodb schema
var Login = new db.Schema({
    _id: String,
    PW: String
});
// create Login model
var login = db.model("Login",Login,"Logins");

const ObjectId = db.Schema.Types.ObjectId;

// create Film mongodb schema
var Film = new db.Schema({
    FilmName: String,
    Duration: String,
    Category: String,
    Language: String,
    Director: String,
    Description: String,
    Poster: String
});
// create Film model
var film = db.model("Film", Film, "Films");

// create Comment mongodb schema
var Comment = new db.Schema({
    FilmId: [{
        type: ObjectId, ref: 'Films'
    }],
    UserId: [{
        type: String, ref: 'Logins'
    }],
    Comment: String
});
// create Comment model
var comment = db.model("Comment", Comment, "Comments");

// create House mongodb schema
var House = new db.Schema({
    _id: String,
    HouseRow: Number,
    HouseCol: Number
});
// create House model
var house = db.model("House", House, "Houses");

// create BroadCast mongodb schema
var BroadCast = new db.Schema({
    Dates: String,
    Time: String,
    FilmId:[{
        type: ObjectId, ref: "Films"
    }],
    HouseId:[{
        type: String, ref: "Houses"
    }],
    day: String
});
var broadCast = db.model("BroadCast", BroadCast, "BroadCasts");

// create Ticket mongodb schema
var Ticket = new db.Schema({
    SeatNo: String,
    BroadCastId: [{
        type: ObjectId, ref: "BroadCasts"
    }],
    Valid: Boolean,
    UserId: [{
        type: String, ref: "Logins"
    }],
    TicketType: String,
    TicketFee: String
});
var ticket = db.model("Ticket", Ticket, "Tickets");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// add session middleware
app.use(session({
    secret: 'Hello world!',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 1000
    }
}));

// add mongoose database model
app.use(function (req, res, next) {
    req.login = login;
    req.film = film;
    req.comment = comment;
    req.house = house;
    req.broadCast = broadCast;
    req.ticket = ticket;
    next();
});

console.log(indexRouter);

app.use('/', indexRouter);
app.use('/users', usersRouter);


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
  res.render('error');
});

module.exports = app;
