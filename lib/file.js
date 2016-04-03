var exec = require('child_process').exec, child;

exports.processFile = function(req, res) {
    child = exec('java -jar ' + __dirname + '/lib/PCDBridge.jar ' +  __dirname + '/uploads/' + req.file.originalname ,
        {
            env: {
                'PCD_PUB_FILE': process.env.PCD_PUB_FILE,
                'PCD_PRV_FILE': process.env.PCD_PRV_FILE
            }
        }, function (error, stdout, stderr){
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
