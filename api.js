require('./arguments');
const net = require('net');
const parse = require('url-parse');
const fs = require('fs');

const client = new net.Socket();

getURLProperties = (url) => {
    return parse(url, true);
};

isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};

createHTTPRequest = (request) => {
    let http_request;
    if (request.method === GET_CONSTANT) {
        http_request = 'GET ';
    } else if (request.method === POST_CONSTANT) {
        http_request = 'POST ';
    }
    http_request += (request.args.hasOwnProperty('pathname') ? request.args.pathname : '/')
        + (!isEmpty(request.args.query) ? ('?' + request.args.href.toString().split('?')[1]) : '')
        + ' HTTP/1.0\r\nHost: ' + request.args.host + `\r\nUser-Agent: ${USER_AGENT}\r\n`;

    if (request.h.length > 0) {
        request.h.forEach(value => {
            http_request += (value + '\r\n');
        })
    }

    if (request.hasOwnProperty('d') || request.hasOwnProperty('f')) {
        const body = (request.hasOwnProperty('d') ? request.d : fs.readFileSync('DATA', 'utf8'));
        http_request += ('Content-Length: ' + body.length + '\r\n\r\n');
        http_request += (body + '\r\n');
    }
    http_request += '\r\n';
    return http_request;
};

connectClient = (request) => {
    client.connect({host: request.args.host, port: request.args.port || DEFAULT_PORT}, () => {
        const http_request = createHTTPRequest(request);
        client.end(http_request);
    });
};

let v = false, saveToFile = false, file;
client.on('data', (data) => {
    let response = data.toString().split('\r\n\r\n');
    if (saveToFile) {
        fs.writeFile(file, (v ? data.toString() : response[1]), (err) => {
            if (err) console.log(`Error saving to ${file}`);
        });
    } else {
        console.log((v ? data.toString() : response[1]));
    }
});

client.on('end', () => {
    client.end();
});

assignOptionalArguments = (args) => {
    v = args.v;
    if (args.hasOwnProperty('o')) {
        saveToFile = true;
        file = args.o;
    }
};

exports.get = (args) => {
    const url_args = getURLProperties(args.url);
    assignOptionalArguments(args);
    const request = {
        method: args.method,
        h: args.h,
        args: url_args
    };
    connectClient(request);
};

exports.post = (args) => {
    const url_args = getURLProperties(args.url);
    assignOptionalArguments(args);
    const request = {
        method: args.method,
        h: args.h,
        d: args.d,
        f: args.f,
        args: url_args
    };
    connectClient(request);
};