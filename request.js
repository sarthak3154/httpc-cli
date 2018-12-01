const Util = require('./util');
const fs = require('fs');

exports.getRequestObject = (url, args) => {
    const url_args = Util.getURLProperties(url);
    const request = {
        method: args.method,
        h: args.h,
        args: url_args
    };
    if (args.hasOwnProperty('d')) request.d = args.d;
    else if (args.hasOwnProperty('f')) request.f = args.f;
    return request;
};

exports.createHTTPRequest = (request) => {
    let http_request;
    if (request.method === GET_CONSTANT) {
        http_request = 'GET ';
    } else if (request.method === POST_CONSTANT) {
        http_request = 'POST ';
    }
    http_request += (request.args.hasOwnProperty('pathname') ? request.args.pathname : '/')
        + (!Util.isEmpty(request.args.query) ? ('?' + request.args.href.toString().split('?')[1]) : '')
        + ' HTTP/1.0\r\nHost: ' + request.args.host + `\r\nUser-Agent: ${USER_AGENT}\r\n`;

    if (request.h.length > 0) {
        request.h.forEach(value => {
            http_request += (value + '\r\n');
        })
    }

    if (request.hasOwnProperty('d') || request.hasOwnProperty('f')) {
        const body = (request.hasOwnProperty('d') ? request.d : fs.readFileSync(request.f, 'utf8').trim());
        http_request += ('Content-Length: ' + body.length + '\r\n\r\n');
        http_request += (body + '\r\n');
    }
    http_request += '\r\n';
    return http_request;
};