#!/usr/bin/env node

require('../constants');
const Packet = require('./packet.js');
const Request = require('../request');
const Util = require('../util');
const ip = require('ip');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

createPacket = (packet_type, sequence_no, http_request) => {
    return new Packet.Builder().withType(packet_type).withSequenceNo(sequence_no).withPeerAddress(ip.address())
        .withPeerPort(SERVER_PORT).withPayload(http_request).build();
};

send = (sendPacket) => {
    const packetBuf = sendPacket.toBuffer();
    client.send(packetBuf, 0, PACKET_HEADERS_LENGTH + sendPacket.payload.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) {
            client.close();
        } else {
            if (sendPacket.type === PacketType.SYN)
                console.log(`Connection SYN Request sent to server ${ip.address()}:${SERVER_PORT}`);
        }
    });
};

let receivedPackets = new Array(WINDOW_SIZE);
receivedPackets.fill(null);
let segmentedPackets = [], slidingWindow = [];

handleDataTypePacket = (packet, buf) => {
    let notNullIndex = receivedPackets.findIndex(Util.isNotNull);
    if (notNullIndex !== -1 &&
        receivedPackets[notNullIndex].sequenceNo - notNullIndex > packet.sequenceNo) {
        console.log(`Packet #${packet.sequenceNo} already received`);
        const sendPacket = createPacket(PacketType.ACK, packet.sequenceNo, EMPTY_REQUEST_RESPONSE);
        send(sendPacket);
    } else {
        console.log('\nReceived %d bytes from %s:%d', buf.length, packet.peerAddress, packet.peerPort);
        console.log('Data received from server :\n\n' + packet.payload);
        if (receivedPackets[0] !== null) {
            receivedPackets.shift();
            receivedPackets.push(null);
        }
        notNullIndex = receivedPackets.findIndex(Util.isNotNull);
        const packetPosition = (packet.sequenceNo > WINDOW_SIZE) ?
            packet.sequenceNo - receivedPackets[notNullIndex].sequenceNo - notNullIndex :
            packet.sequenceNo - 1;
        receivedPackets[packetPosition] = packet;
        const sendPacket = createPacket(PacketType.ACK, packet.sequenceNo, EMPTY_REQUEST_RESPONSE);
        send(sendPacket);
    }
};

const clientPromise = new Promise((resolve) => {
    client.on('message', (buf, info) => {
        const packet = Packet.fromBuffer(buf);

        if (packet.type === PacketType.SYN_ACK && !isTimedOut) {
            console.log(`Connection SYN-ACK Response received from server ${packet.peerAddress}:${packet.peerPort}`);
            console.log(`Connection ACK Reply sent to server ${packet.peerAddress}:${packet.peerPort}`);
            console.log('Connection Established.');
            const sendPacket = createPacket(PacketType.ACK, 1, ESTABLISH_CONNECTION);
            send(sendPacket);
            threeWayConnection = true;
            resolve(true);
        } else {
            if (packet.type === PacketType.DATA) {
                handleDataTypePacket(packet, buf);
            } else if (packet.type === PacketType.ACK) {

            }
        }
    });
});

sendMultiplePackets = (request) => {
    const packetsCount = request.length / PACKET_PAYLOAD_SIZE;
    if (debug) console.log('#packets to be sent: ' + Math.floor(packetsCount) + '\n');
    for (let i = 0; i < packetsCount; i++) {
        const payload = request.slice(i * PACKET_PAYLOAD_SIZE, PACKET_PAYLOAD_SIZE * (i + 1));
        const sendPacket = createPacket(PacketType.DATA, i + 1, payload);
        if (i < WINDOW_SIZE) {
            slidingWindow.push(PacketType.NAK);
            send(sendPacket);
        }
        segmentedPackets.push(sendPacket);
    }
};

let threeWayConnection = false, isTimedOut = false;
threeWayHandshake = () => {
    const sendPacket = createPacket(PacketType.SYN, 1, EMPTY_REQUEST_RESPONSE);
    send(sendPacket);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!threeWayConnection) reject();
        }, RESPONSE_TIMEOUT);
    });
};

exports.initRequest = (args) => {
    threeWayHandshake().catch(() => {
        isTimedOut = true;
        console.log('Three Way Handshake failed. Connection couldn\'t be established');
    });

    const request = Request.getRequestObject(args.url, args);
    const http_request = Request.createHTTPRequest(request);
    clientPromise.then(isConnected => {
        if (isConnected) {
            if (request.method === POST_CONSTANT && http_request.length > PACKET_MAX_LENGTH) {
                sendMultiplePackets(http_request);
            } else {
                const sendPacket = createPacket(PacketType.DATA, 1, http_request);
                send(sendPacket);
            }
        }
    });
};