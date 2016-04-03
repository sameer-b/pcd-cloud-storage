var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var user = require('./lib/user.js');
var file = require('./lib/file.js');
var exphbs = require('express-handlebars');
var multer  = require('multer');
var exec = require('child_process').exec, child;


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());
app.use(multer({storage:storage}).single('file'));


app.get('/', function (req, res) {
    if(req.cookies && req.cookies.email) {
        res.redirect('files');
    } else {
        res.redirect('login');
    }
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/authenticate', function(req, res) {
    user.login(req, res);
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/files', function(req, res) {
    if(req.cookies && req.cookies.email) {
        res.render('files');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    res.clearCookie('email');
    res.redirect('/login');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.post('/addUser', function(req, res) {
    user.add(req, res);
});

app.get('/addFiles', function(req, res) {
    user.authRender(req, res, 'addFile');
});

app.post('/upload', function(req, res) {
    file.processFile(req, res);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
