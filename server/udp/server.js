#!/usr/bin/env node

require('../../constants');
const dgram = require('dgram');
const yargs = require('yargs');

const argv = yargs.usage('httpfs is a simple file server.\n\nusage: httpfs [-v] [-p PORT] [-d PATH-TO-DIR]')
    .default('port', 8080)
    .option('v', {
        default: false,
        description: 'Prints debugging messages.'
    })
    .option('p', {
        alias: 'port',
        description: 'Specifies the port number that the server will listen and serve at.\n' +
            'Default is 8080.'
    })
    .option('d', {
        description: 'Specifies the directory that the server will use to read/write requested files. ' +
            'Default is the current directory when launching the application.'
    })
    .help('help')
    .argv;

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, info) => {
    console.log(msg);
    console.log(`server received: ${msg} from ${info.address}:${info.port}`);
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server is listening at ${address.address}:${address.port}`);
});

send = (msg, address, port) => {

    server.send()
};

server.bind(SERVER_PORT);