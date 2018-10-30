global.defaultDir = __dirname + '/filedb';

const fs = require('fs');

getFilesList = (callback) => {
    fs.readdir(defaultDir, (err, files) => {
        callback(files);
    });
};

exports.getFiles = () => {
    getFilesList(files => {
        console.log(files);
        //TODO prepare response
    });
};

exports.getFileDetails = (endPoint) => {
    fs.readdir(defaultDir, (err, files) => {
        files.forEach((file) => {
            if (file.includes(endPoint)) {

            }
        })
    })
};

exports.post = (endPoint) => {
    //TODO POST request and response handling
};