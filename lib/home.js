var mongo = require('mongodb'),
monk = require('monk'),
db = monk('mongodb://pcd:pcd@ds011439.mlab.com:11439/pcd');

exports.renderHome = function(req, res, data) {

    if (!req.cookies.email) {
        res.render('login');
        return;
    }

    db.get('files').find({
        "email" : req.cookies.email,
    }, function (err, doc) {
        if (err) {
            res.render('login');
        } else {
            data.files = doc;
            res.render('files', data);
        }
    });
}
