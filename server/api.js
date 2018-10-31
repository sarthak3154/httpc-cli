global.defaultDir = __dirname + '/filedb';

require('../arguments');
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

readFile = (fileName) => {
    fs.readdir(defaultDir, (err, files) => {
        if (err) {
            const statusLine = 'HTTP/1.0 500 Internal Server Error\r\n';
            const response = prepareResponse(statusLine, INTERNAL_SERVER_ERROR.length, INTERNAL_SERVER_ERROR);
            callback(response);
        }

        let found = false;
        files.filter(Util.fileExtension).forEach((file) => {
            if (file.includes(fileName)) {
                found = true;
                const data = fs.readFileSync(defaultDir + '/' + file, 'utf8');
                const contentLength = data.length;
                const statusLine = (data.length > 0 ? 'HTTP/1.0 200 OK\r\n' : 'HTTP/1.0 204 No Content\r\n');
                const body = (data.length > 0 ? data : null);
                const response = prepareResponse(statusLine, contentLength, body);
                callback(response);
            }
        });

        if (!found) {
            const statusLine = 'HTTP/1.0 404 Not Found\r\n';
            const response = prepareResponse(statusLine, FILE_NOT_FOUND.length, FILE_NOT_FOUND);
            callback(response);
        }
    });
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
    const path = endPoint.split('/');
    if (path.length > 2) {
        const statusLine = 'HTTP/1.0 403 Forbidden\r\n';
        const response = prepareResponse(statusLine, ERROR_FORBIDDEN.length, ERROR_FORBIDDEN);
        callback(response);
    } else {
        readFile(endPoint.substring(1));
    }
};

exports.post = (endPoint, data, callback) => {
    fs.writeFile(defaultDir + endPoint + '.txt', data, (err) => {
        const statusLine = ((err) ? 'HTTP/1.0 500 Internal Server Error\r\n' : 'HTTP/1.0 200 OK\r\n');
        const contentLength = (err) ? INTERNAL_SERVER_ERROR.length : FILE_UPDATE_SUCCESS.length;
        const body = (err) ? INTERNAL_SERVER_ERROR : FILE_UPDATE_SUCCESS;
        const response = prepareResponse(statusLine, contentLength, body);
        callback(response);
    })
};