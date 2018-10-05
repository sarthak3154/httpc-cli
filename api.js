require('./arguments');
const net = require('net');
const parse = require('url-parse');
const fs = require('fs');

getURLProperties = (url) => {
    return parse(url, true);
};

getRequestObject = (url, args) => {
    const url_args = getURLProperties(url);
    const request = {
        method: args.method,
        h: args.h,
        args: url_args
    };
    if (args.hasOwnProperty('d')) request.d = args.d;
    else if (args.hasOwnProperty('f')) request.f = args.f;
    return request;
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
        const body = (request.hasOwnProperty('d') ? request.d : fs.readFileSync(request.f, 'utf8'));
        http_request += ('Content-Length: ' + body.length + '\r\n\r\n');
        http_request += (body + '\r\n');
    }
    http_request += '\r\n';
    return http_request;
};

let v = false, saveToFile = false, file;
let redirect_args = {}, redirect_count = 0;
connectClient = (request) => {
    let client = new net.Socket();

    client.connect({host: request.args.host, port: request.args.port || DEFAULT_PORT}, () => {
        const http_request = createHTTPRequest(request);
        client.write(http_request);

        client.on('data', (data) => {
            let response = data.toString().split('\r\n\r\n');
            if (data.toString().includes(REDIRECT_STATUS_CODE) && data.toString().includes('Location')
                && redirect_count <= 5) {
                const redirect_array = data.toString().split('\r\n');
                redirect_array.forEach(value => {
                    if (value.includes('Location')) {
                        let redirect_url = value.split(': ')[1];
                        if (redirect_url.startsWith('/')) {
                            const url_args = getURLProperties(redirect_args.url);
                            redirect_url = url_args.origin + redirect_url;
                        }
                        const request = getRequestObject(redirect_url, redirect_args);
                        redirect_count++;
                        console.log(`Redirecting to ${redirect_url}`);
                        connectClient(request);
                    }
                })
            } else {
                if (saveToFile) {
                    fs.writeFile(file, (v ? data.toString() : response[1]), (err) => {
                        if (err) console.log(`Error saving to ${file}`);
                    });
                } else {
                    console.log((v ? data.toString() : response[1]));
                }
            }
        });

        client.on('end', () => {
            client.end();
        });
    });
};

assignOptionalArguments = (args) => {
    redirect_args = Object.assign({}, args);
    v = args.v;
    if (args.hasOwnProperty('o')) {
        saveToFile = true;
        file = args.o;
    }
};

exports.httpRequest = (args) => {
    assignOptionalArguments(args);
    const request = getRequestObject(args.url, args);
    connectClient(request);
};