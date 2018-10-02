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
        + ' HTTP/1.0\r\nHost: ' + request.args.host + '\r\nUser-Agent: Concordia-HTTP/1.0\r\n';

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
    client.connect({host: request.args.host, port: request.args.port || 80}, () => {
        const http_request = createHTTPRequest(request);
        client.end(http_request);
    });
};

let v = false, o = false;
client.on('data', (data) => {
    let response = data.toString().split('\r\n\r\n');
    console.log((v ? data.toString() : response[1]));
});

client.on('end', () => {
    client.end();
    process.exit(-1);
});

exports.get = (args) => {
    const url_args = getURLProperties(args.url);
    v = args.v;
    const request = {
        method: args.method,
        h: args.h,
        args: url_args
    };
    connectClient(request);
};

exports.post = (args) => {
    const url_args = getURLProperties(args.url);
    v = args.v;
    const request = {
        method: args.method,
        h: args.h,
        d: args.d,
        f: args.f,
        args: url_args
    };
    connectClient(request);
};