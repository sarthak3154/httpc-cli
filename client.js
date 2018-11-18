require('./constants');
const Util = require('./util');
const Request = require('./request');
const net = require('net');
const fs = require('fs');

let v = false, saveToFile = false, file;
let redirect_args = {}, redirect_count = 0;
connectClient = (request) => {
    let client = new net.Socket();
    const defaultPort = request.args.hostname.includes('localhost') ? LOCALHOST_PORT : DEFAULT_PORT;

    client.connect({host: request.args.hostname, port: request.args.port || defaultPort}, () => {
        const http_request = Request.createHTTPRequest(request);
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
                            const url_args = Util.getURLProperties(redirect_args.url);
                            redirect_url = url_args.origin + redirect_url;
                        }
                        const request = Request.getRequestObject(redirect_url, redirect_args);
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
                client.end();
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

exports.initRequest = (args) => {
    assignOptionalArguments(args);
    const request = Request.getRequestObject(args.url, args);
    connectClient(request);
};