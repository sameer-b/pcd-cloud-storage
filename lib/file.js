var exec = require('child_process').exec,
    path = require('path'),
    __parentDir = path.dirname(module.parent.filename),
    fs = require('fs'),
    mongo = require('mongodb'),
    monk = require('monk'),
    db = monk('mongodb://pcd:pcd@ds011439.mlab.com:11439/pcd'),
    home = require('./home.js');

/**
 * Handles file upload which includes
 * 1) Saving the file into the user's directory
 * 2) Running the PCD bridge.
 * Multer writes the file to tmp directory.
 * This method writes the file into app directory.
 * @param  {Object} req [Express Request]
 * @param  {Object} res [Express Response]
 * @return {Void}
 */
exports.processFile = function(req, res) {
    fs.readFile(req.file.path, function (err, data) {
        var newPath = __parentDir + "/uploads/" + req.cookies.email + '/' + req.file.filename;
        fs.writeFile(newPath, data, function (err) {
            executeBridge(req, res);
        });
    });
};

/**
 * Route to download a user file.
 * The Content-disposition header forces
 * the browser to download the file.
 * @param  {Object} req [Express Request]
 * @param  {Object} res [Express Response]
 * @return {Void}
 */
exports.download = function(req, res) {
    var file = __parentDir + '/uploads/' + req.cookies.email + '/' + req.params.file,
        filestream;

    if (!req.cookies.email) {
        res.render('login');
        return;
    }

    res.setHeader('Content-disposition', 'attachment; filename=' + req.params.file);

    filestream = fs.createReadStream(file);
    filestream.pipe(res);
};

/**
 * Route to delete a user file.
 * Deletion consists of deleting the
 * file from the server and updating
 * the filestore in mongodb.
 * @param  {Object} req [Express Request]
 * @param  {Object} res [Express Response]
 * @return {Void}
 */
exports.delete = function(req, res) {
    var file = __parentDir + '/uploads/' + req.cookies.email + '/' + req.params.file,
        filestream;

    if (!req.cookies.email) {
        res.render('login');
        return;
    }

    fs.unlinkSync(file);

    db.get('files').remove({
        'filename' : req.params.file
    }, function(err, doc) {
        res.redirect('/files');
    });

};

/**
 * Builds command to execute PCDBridge
 * @param  {String} email [Email address of currently authenticated user]
 * @param  {String} filename [Input file to be decrypted]
 * @return {String} [Command to execute bridge]
 */
var getCmd = function(email, filename) {
    return 'java -jar ' + __dirname + '/PCDBridge.jar ' +  __parentDir +'/uploads/' + email + '/' +filename;
};

/**
 * Sets up envrionment variables
 * @return {Object} [Object containing env variables]
 */
var getEnv = function() {
    return {
        env: {
            'PCD_PUB_FILE': process.env.PCD_PUB_FILE,
            'PCD_PRV_FILE': process.env.PCD_PRV_FILE
        }
    }
};

/**
 * Processes File on upload event.
 * If decryption on the file fails
 * it indicates that the cloud storage
 * provider does not comply with the policy
 * associated with the file.
 * If the decryption is succssful it
 * means all is well and file can be storaged
 * safely.
 * @param  {Object} req [Express Request]
 * @param  {Object} res [Express Response]
 * @return {Void}
 */
var executeBridge = function(req, res) {
    var cmd = getCmd(req.cookies.email, req.file.filename),
        env = getEnv();

    exec(cmd, env, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error || stderr) {
            home.renderHome(req, res, {
                uploadFail: "Something went wrong! Looks like we do not comply with your policy!"
            });
            return;
        }

        if(stdout) {
            addFileEntry(req.cookies.email, req.file.originalname, req.file.filename);
            home.renderHome(req, res, {
                uploadSuccess: "Success! We comply with your policy!"
            });
        }
    });
}

/**
 * Updates file store with new file entry
 * @param  {String} email        [Email address of authenticated user]
 * @param  {String} originalname [Original file name without timestamp]
 * @param  {String} filename     [Filename with prefixed timestamp]
 * @return {Void}
 */
var addFileEntry = function(email, originalname, filename) {
    db.get('files').insert({
        'email': email,
        'originalname': originalname,
        'filename' : filename
    });
}
