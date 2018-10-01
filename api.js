require('./arguments');
const net = require('net');
const parse = require('url-parse');
const client = new net.Socket();

getURLProperties = (url) => {
    return parse(url, true);
};

connectClient = (request) => {
    client.connect({host: request.args.host, port: request.args.port || 80}, () => {
        let http_request;
        if (request.method === GET_CONSTANT) {
            http_request = 'GET ';
        } else if (request.method === POST_CONSTANT) {
            http_request = 'POST ';
        }
        http_request += (request.args.hasOwnProperty('pathname') ? request.args.pathname : '/')
            + ' HTTP/1.0\r\nHost: ' + request.args.host + '\r\nUser-Agent: Concordia-HTTP/1.0\r\n';

        if (request.h.length > 0) {
            request.h.forEach(value => {
                http_request += (value + '\r\n');
            })
        }
        http_request += '\r\n';
        client.end(http_request);
    });
};

client.on('data', (data) => {
    console.log('Response :' + data);
});

client.on('end', () => {
    client.end();
    process.exit(-1);
});

exports.get = (args) => {
    const url_args = getURLProperties(args.url);
    const request = {
        method: args.method,
        v: args.v,
        h: args.h,
        args: url_args
    };
    console.log(JSON.stringify(request));
    connectClient(request);
};

exports.post = (args) => {
    const url_args = getURLProperties(args.url);

}