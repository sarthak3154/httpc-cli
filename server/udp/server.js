#!/usr/bin/env node

require('../../constants');
const dgram = require('dgram');
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