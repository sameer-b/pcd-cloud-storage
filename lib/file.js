var exec = require('child_process').exec,
    path = require('path'),
    __parentDir = path.dirname(module.parent.filename);

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
exports.processFile = function(req, res) {
    var cmd = getCmd(req.file.originalname),
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
};

/**
 * Builds command to execute PCDBridge
 * @param  {String} email [Email address of currently authenticated user]
 * @param  {String} filename [Input file to be decrypted]
 * @return {String} [Command to execute bridge]
 */
var getCmd = function(email, filename) {
    return 'java -jar ' + __dirname + '/PCDBridge.jar ' +  __parentDir +'/uploads/' + filename;
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
