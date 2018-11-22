global.defaultDir = __dirname + '/filedb';

require('../constants');
const Util = require('../util');
const fs = require('fs');
const mime = require('mime-types');

getFilesList = (callback) => {
    fs.readdir(defaultDir, (err, files) => {
        if (err) callback(null);
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
            if (debug) console.log('Error reading files from the Server Directory. Preparing Response...');
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
            if (file.includes(fileName) && !found) {
                found = true;
                if (debug) console.log(`File \'${file}\' found in Server Directory. Preparing Response...`);
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
            if (debug) console.log('File Not Found in the Server Directory. Preparing Response...');
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
    if (debug) {
        console.log('Retrieving files from the Server Directory');
    }
    getFilesList(files => {
        if (debug) {
            if (files) {
                console.log('Files Successfully Accessed. Preparing Response...');
            } else {
                console.log('Error retrieving files. Preparing response');
            }
        }
        const statusLine = (files != null ? (files.length > 0 ? 'HTTP/1.0 200 OK\r\n' : 'HTTP/1.0 204 No Content\r\n') :
            'HTTP/1.0 500 Internal Server Error\r\n');
        const contentLength = (files != null ? getFilesContentLength(files) : 0);
        const body = (files != null && files.length > 0 ? files : null);
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
        if (debug) {
            console.log('Trying to access outside the File Server Directory. Access Restricted. Preparing Response...');
        }
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
    if (debug) {
        console.log(`Requesting POST ${endPoint}`);
    }
    fs.writeFile(defaultDir + endPoint + '.txt', data, (err) => {
        if (err && debug) console.log('Error writing the file. Preparing Response...');
        else console.log(`Write to file \'${endPoint.substring(1) + '.txt\''} successful. Preparing Response...`);
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