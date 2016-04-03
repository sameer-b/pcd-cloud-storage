var exec = require('child_process').exec,
    path = require('path'),
    __parentDir = path.dirname(module.parent.filename),
    fs = require('fs'),
    mongo = require('mongodb'),
    monk = require('monk'),
    db = monk('mongodb://pcd:pcd@ds011439.mlab.com:11439/pcd');

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
            addFileEntry(req.cookies.email, req.file.originalname, req.file.filename);
        });
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
            res.send("Something went wrong");
            return;
        }

        if(stdout) {
            res.send("File uploaded");
            return;
        }
    });
}

var addFileEntry = function(email, originalname, filename) {
    db.get('files').insert({
        'email': email,
        'originalname': originalname,
        'filename' : filename
    });
}
