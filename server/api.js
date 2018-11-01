global.defaultDir = __dirname + '/filedb';

require('../constants');
const Util = require('../util');
const fs = require('fs');
const mime = require('mime-types');

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

prepareResponse = (options) => {
    const {statusLine, contentType, contentLength, body, file} = options;
    let response = statusLine;
    const date = new Date();
    response += 'Date: ' + date + `\r\nServer: HTTP Server\r\nContent-Type: ${contentType}\r\n` +
        'Content-Disposition: ' + (Util.dispContentTypes.includes(contentType.split(';')[0]) ?
            `attachment; filename='${defaultDir + '/' + file}'\r\n` : 'inline\r\n') +
        'Content-Length: ' + contentLength + '\r\nConnection: Close\r\n\r\n';

    if (body !== null) {
        response += JSON.stringify(body, null, '  ') + '\r\n';
    }
    return response;
};

readFile = (fileName, callback) => {
    fs.readdir(defaultDir, (err, files) => {
        if (err) {
            const statusLine = 'HTTP/1.0 500 Internal Server Error\r\n';
            const options = {
                statusLine: statusLine,
                contentType: CONTENT_TYPE_TEXT,
                contentLength: INTERNAL_SERVER_ERROR.length,
                body: INTERNAL_SERVER_ERROR
            };
            const response = prepareResponse(options);
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
                const options = {
                    statusLine: statusLine,
                    contentType: mime.contentType(file),
                    contentLength: contentLength,
                    body: body,
                    file: defaultDir + '/' + file
                };
                const response = prepareResponse(options);
                callback(response);
            }
        });

        if (!found) {
            const statusLine = 'HTTP/1.0 404 Not Found\r\n';
            const options = {
                statusLine: statusLine,
                contentType: CONTENT_TYPE_TEXT,
                contentLength: FILE_NOT_FOUND.length,
                body: FILE_NOT_FOUND
            };
            const response = prepareResponse(options);
            callback(response);
        }
    });
};

exports.getFiles = (callback) => {
    getFilesList(files => {
        const statusLine = (files.length > 0 ? 'HTTP/1.0 200 OK\r\n' : 'HTTP/1.0 204 No Content\r\n');
        const contentLength = getFilesContentLength(files);
        const body = (files.length > 0 ? files : null);
        const options = {
            statusLine: statusLine,
            contentType: CONTENT_TYPE_TEXT,
            contentLength: contentLength,
            body: body
        };
        const response = prepareResponse(options);
        callback(response);
    });
};

exports.getFileDetails = (endPoint, callback) => {
    const path = endPoint.split('/');
    if (path.length > 2) {
        const statusLine = 'HTTP/1.0 403 Forbidden\r\n';
        const options = {
            statusLine: statusLine,
            contentType: CONTENT_TYPE_TEXT,
            contentLength: ERROR_FORBIDDEN.length,
            body: ERROR_FORBIDDEN
        };
        const response = prepareResponse(options);
        callback(response);
    } else {
        readFile(endPoint.substring(1), response => {
            callback(response);
        });
    }
};

exports.post = (endPoint, data, callback) => {

    fs.writeFile(defaultDir + endPoint + '.txt', data, (err) => {
        const statusLine = ((err) ? 'HTTP/1.0 500 Internal Server Error\r\n' : 'HTTP/1.0 200 OK\r\n');
        const contentLength = (err) ? INTERNAL_SERVER_ERROR.length : FILE_UPDATE_SUCCESS.length;
        const body = (err) ? INTERNAL_SERVER_ERROR : FILE_UPDATE_SUCCESS;
        const options = {
            statusLine: statusLine,
            contentType: CONTENT_TYPE_TEXT,
            contentLength: contentLength,
            body: body
        };
        const response = prepareResponse(options);
        callback(response);
    })
};