#!/usr/bin/env node

require('../constants');
const Packet = require('./packet.js');
const Request = require('../request');
const ip = require('ip');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

client.on('message', (buf, info) => {
    const packet = Packet.fromBuffer(buf);
    console.log('Received %d bytes from %s:%d', buf.length, packet.peerAddress, packet.peerPort);
    console.log('Data received from server :\n\n' + packet.payload);
});

send = (http_request) => {
    const packetBuf = Packet.create(http_request, ip.address(), SERVER_PORT);
    client.send(packetBuf, 0, PACKET_HEADERS_LENGTH + http_request.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) client.close();
        else console.log('Request sent');
    });
};

exports.initRequest = (args) => {
    const request = Request.getRequestObject(args.url, args);
    const http_request = Request.createHTTPRequest(request);
    send(http_request);
};