var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    user = require('./lib/user.js'),
    file = require('./lib/file.js'),
    exphbs = require('express-handlebars'),
    multer  = require('multer'),
    home = require('./lib/home.js');

var storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
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
    home.renderHome(req, res, {});
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

app.get('/download/:file', function(req, res) {
    file.download(req, res);
});

app.get('/delete/:file', function(req, res) {
    file.delete(req, res);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
