global.defaultDir = __dirname + '/filedb';

const Util = require('../util');
const fs = require('fs');

getFilesList = (callback) => {
    fs.readdir(defaultDir, (err, files) => {
        callback(files);
    });
};

getFilesContentLength = (files) => {
    let contentLength = 0;
    files.forEach(fileName => {
        contentLength += fileName.length;
    });
    return contentLength;
};

prepareResponse = (statusLine, contentLength, body) => {
    let response = statusLine;
    const date = new Date();
    response += 'Date: ' + date + '\r\nServer: HTTP Server\r\nContent-Length: ' + contentLength + '\r\n' +
        'Connection: Close\r\n\r\n';
    if (body !== null) {
        response += JSON.stringify(body, null, '  ') + '\r\n';
    }
    return response;
};

exports.getFiles = (callback) => {
    getFilesList(files => {
        const statusLine = (files.length > 0 ? 'HTTP/1.0 200 OK\r\n' : 'HTTP/1.0 204 No Content\r\n');
        const contentLength = getFilesContentLength(files);
        const body = (files.length > 0 ? files : null);
        const response = prepareResponse(statusLine, contentLength, body);
        callback(response);
    });
};

exports.getFileDetails = (endPoint, callback) => {
    fs.readdir(defaultDir, (err, files) => {
        files.filter(Util.fileExtension).forEach((file) => {
            if (file.includes(endPoint.substring(1))) {
                const data = fs.readFileSync(defaultDir + '/' + file, 'utf8');
                const contentLength = data.length;
                const statusLine = (data.length > 0 ? 'HTTP/1.0 200 OK\r\n' : 'HTTP/1.0 204 No Content\r\n');
                const body = (data.length > 0 ? data : null);
                const response = prepareResponse(statusLine, contentLength, body);
                callback(response);
            }
        })

    })
};

exports.post = (endPoint, callback) => {
    //TODO POST request and response handling
};