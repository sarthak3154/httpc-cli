#!/usr/bin/env node

require('../../constants');
const Api = require('../api');
const Packet = require('../../udp/packet');
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

handleRequest = (packet) => {
    const payload = packet.payload;
    const reqData = request.split('\r\n');
    const method = reqData[0].toLowerCase();

    if (method.includes(GET_CONSTANT)) {
        //TODO handle GET request
    } else if (method.includes(POST_CONSTANT)) {
        //TODO handle POST request
    }
};

server.on('message', (buf, info) => {
    const packet = Packet.fromBuffer(buf);
    console.log(`Server received from ${info.address}:${info.port}`);
    handleRequest(packet);
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server is listening at ${address.address}:${address.port}`);
});

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.bind(SERVER_PORT);