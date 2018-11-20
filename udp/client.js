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
    const packetBuf = new Packet.Builder(0).withSequenceNo(1).withPeerAddress(ip.address())
        .withPeerPort(SERVER_PORT).withPayload(http_request).build().toBuffer();
    client.send(packetBuf, 0, PACKET_HEADERS_LENGTH + http_request.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) client.close();
        else console.log('Request sent');
    });
};

threeWayHandshake = () => {

};

exports.initRequest = (args) => {
    threeWayHandshake();
    const request = Request.getRequestObject(args.url, args);
    const http_request = Request.createHTTPRequest(request);
    send(http_request);
};