global.defaultDir = __dirname + '/filedb';

const fs = require('fs');

listFiles = () => {
    fs.readdir(defaultDir, (err, files) => {
        console.log(files);
    })
};

exports.get = (endPoint) => {
    if (endPoint === '/') {
        listFiles();
    }
    //TODO response handling
};

exports.post = (endPoint) => {
    //TODO POST request and response handling
};