#!/usr/bin/env node

require('../constants');
const Packet = require('./packet.js');
const Request = require('../request');
const ip = require('ip');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let threeWayConnection = false;

send = (packet_type, sequence_no, http_request) => {
    const packetBuf = new Packet.Builder().withType(packet_type).withSequenceNo(sequence_no).withPeerAddress(ip.address())
        .withPeerPort(SERVER_PORT).withPayload(http_request).build().toBuffer();
    client.send(packetBuf, 0, PACKET_HEADERS_LENGTH + http_request.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) {
            client.close();
        } else {
            if (packet_type === PacketType.SYN)
                console.log(`Connection SYN Request sent to server ${ip.address()}:${SERVER_PORT}`);
        }
    });
};

const clientPromise = new Promise((resolve) => {
    client.on('message', (buf, info) => {
        const packet = Packet.fromBuffer(buf);

        if (packet.type === PacketType.SYN_ACK) {
            console.log(`Connection SYN-ACK Response received from server ${packet.peerAddress}:${packet.peerPort}`);
            console.log(`Connection ACK Reply sent to server ${packet.peerAddress}:${packet.peerPort}`);
            send(PacketType.ACK, 1, EMPTY_REQUEST_RESPONSE);
            threeWayConnection = true;
            console.log('Connection Established.\n');
            resolve(true);
        } else {
            console.log('Received %d bytes from %s:%d', buf.length, packet.peerAddress, packet.peerPort);
            console.log('Data received from server :\n\n' + packet.payload);
        }
    });
});

threeWayHandshake = () => {
    send(PacketType.SYN, 1, EMPTY_REQUEST_RESPONSE);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!threeWayConnection) reject();
        }, RESPONSE_TIMEOUT);
    });
};

exports.initRequest = (args) => {
    const request = Request.getRequestObject(args.url, args);
    const http_request = Request.createHTTPRequest(request);
    threeWayHandshake().catch(() => {
        console.log('Three Way Handshake failed. Connection couldn\'t be established');
    });
    clientPromise.then(isConnected => {
        if (isConnected) {
            send(PacketType.DATA, 1, http_request);
        }
    });
};