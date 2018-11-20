#!/usr/bin/env node

require('../../constants');
const Api = require('../api');
const Packet = require('../../udp/packet');
const dgram = require('dgram');
const yargs = require('yargs');

global.debug = false;

const argv = yargs.usage('httpfs is a simple file server.\n\nusage: httpfs [-v] [-p PORT] [-d PATH-TO-DIR]')
    .default('port', 8007)
    .option('v', {
        default: false,
        description: 'Prints debugging messages.'
    })
    .option('p', {
        alias: 'port',
        description: 'Specifies the port number that the server will listen and serve at.\n' +
            'Default is 8007.'
    })
    .option('d', {
        description: 'Specifies the directory that the server will use to read/write requested files. ' +
            'Default is the current directory when launching the application.'
    })
    .help('help')
    .argv;

const server = dgram.createSocket('udp4');

send = (packet, response) => {
    const sendPacket = packet.toBuilder().withPayload(response).build();
    const packetBuf = sendPacket.toBuffer();
    server.send(packetBuf, 0, PACKET_HEADERS_LENGTH + response.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) server.close();
        else if (debug) console.log('Response sent');
    })
};

handleGetRequest = (requestLine, packet) => {
    if (requestLine[1] === '' || requestLine[1] === '/') {
        if (debug) {
            console.log('Requesting GET /');
        }
        Api.getFiles(response => {
            send(packet, response);
        });
    } else {
        if (debug) {
            console.log(`Requesting GET ${requestLine[1]}`);
        }
        Api.getFileDetails(requestLine[1], response => {
            send(packet, response);
        });
    }
};

handleRequest = (packet) => {
    const payload = packet.payload;
    const reqData = payload.split('\r\n');
    const method = reqData[0].toLowerCase();
    const requestLine = method.split(' ');

    if (method.includes(GET_CONSTANT)) {
        handleGetRequest(requestLine, packet);
    } else if (method.includes(POST_CONSTANT)) {
        //TODO handle POST request
    }
};

server.on('message', (buf, info) => {
    const packet = Packet.fromBuffer(buf);
    console.log(`Request received from ${packet.peerAddress}:${packet.peerPort}`);
    handleRequest(packet);
});

server.on('listening', () => {
    if (argv.v) debug = true;
    if (debug) {
        const address = server.address();
        console.log(`Server is listening at ${address.address}:${address.port}`);
    }
    if (argv.hasOwnProperty('d')) defaultDir = argv.d;
});

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.bind(argv.port || SERVER_PORT);