#!/usr/bin/env node

require('../constants');
const Packet = require('./packet.js');
const Request = require('../request');
const ip = require('ip');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

client.on('message', (msg, info) => {
    console.log('Data received from server : ' + msg.toString());
    console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
});

send = (http_request) => {
    const buf = Packet.create(http_request, ip.address(), SERVER_PORT);
    client.send(buf, 0, PACKET_HEADERS_LENGTH + http_request.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        client.close();
    });
};

exports.initRequest = (args) => {
    const request = Request.getRequestObject(args.url, args);
    const http_request = Request.createHTTPRequest(request);
    send(http_request);
};
