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
let segmentedPackets = [], slidingWindow = [];

createPacket = (clientPacket, packetType, sequenceNo, response) => {
    let packetBuilder = clientPacket.toBuilder().withSequenceNo(sequenceNo).withPayload(response);
    if (packetType === PacketType.SYN_ACK) {
        packetBuilder = packetBuilder.withType(packetType);
    }
    return packetBuilder.build();
};

send = (sendPacket) => {
    const packetBuf = sendPacket.toBuffer();
    server.send(packetBuf, 0, PACKET_HEADERS_LENGTH + sendPacket.payload.length, ROUTER_PORT, ROUTER_HOST, (err) => {
        if (err) server.close();
        else {
            if (debug) {
                if (sendPacket.type === PacketType.SYN_ACK) {
                    console.log(`Connection SYN-ACK Response sent to client ${sendPacket.peerAddress}:${sendPacket.peerPort}`);
                } else {
                    console.log(`Response sent to ${sendPacket.peerAddress}:${sendPacket.peerPort}`);
                }
            }
            if (sendPacket.type !== PacketType.SYN_ACK) {
                this.initPacketTimeout(sendPacket);
            }
        }
    })
};

exports.initPacketTimeout = (packet) => {
    new Promise((resolve, reject) => {
        setTimeout(() => {
            if (segmentedPackets.length > 0 && segmentedPackets[0].sequenceNo <= packet.sequenceNo &&
                slidingWindow[packet.sequenceNo - segmentedPackets[0].sequenceNo] === PacketType.NAK) {
                reject(packet);
            }
        }, RESPONSE_TIMEOUT);
    }).catch((packet) => {
        send(packet);
    });
};

sendPendingPacket = (packetNo) => {
    send(segmentedPackets[packetNo]);
    slidingWindow.push(PacketType.NAK);
};

sendMultiplePackets = (packet, response) => {
    const packetsCount = response.length / PACKET_PAYLOAD_SIZE;
    if (debug) console.log('#packets to be sent: ' + Math.floor(packetsCount) + '\n');
    for (let i = 0; i < packetsCount; i++) {
        const payload = response.slice(i * PACKET_PAYLOAD_SIZE, PACKET_PAYLOAD_SIZE * (i + 1));
        const sendPacket = createPacket(packet, PacketType.DATA, i + 1, payload);
        if (i < WINDOW_SIZE) {
            slidingWindow.push(PacketType.NAK);
            send(sendPacket);
        }
        segmentedPackets.push(sendPacket);
    }
};

handleGetRequest = (requestLine, packet) => {
    if (requestLine[1] === '' || requestLine[1] === '/') {
        if (debug) {
            console.log('Requesting GET /');
        }
        Api.getFiles(response => {
            if (response.length > PACKET_MAX_LENGTH) {
                sendMultiplePackets(packet, response);
            } else {
                const sendPacket = createPacket(packet, PacketType.DATA, packet.sequenceNo, response);
                slidingWindow.push(PacketType.NAK);
                send(sendPacket);
                segmentedPackets.push(sendPacket);
            }
        });
    } else {
        if (debug) {
            console.log(`Requesting GET ${requestLine[1]}`);
        }
        Api.getFileDetails(requestLine[1], response => {
            if (response.length > PACKET_MAX_LENGTH) {
                sendMultiplePackets(packet, response);
            } else {
                const sendPacket = createPacket(packet, PacketType.DATA, packet.sequenceNo, response);
                slidingWindow.push(PacketType.NAK);
                send(sendPacket);
                segmentedPackets.push(sendPacket);
            }
        });
    }
};

handleRequest = (packet) => {
    const payload = packet.payload;
    const reqData = payload.split('\r\n');
    const method = reqData[0].toLowerCase();
    const requestLine = method.split(' ');

    if (packet.type === PacketType.SYN) {
        if (debug) console.log(`Connection SYN Request received from client ${packet.peerAddress}:${packet.peerPort}`)
        const sendPacket = createPacket(packet, PacketType.SYN_ACK, packet.sequenceNo, EMPTY_REQUEST_RESPONSE);
        send(sendPacket);
    } else if (packet.type === PacketType.ACK) {
        if (debug) {
            if (packet.payload === ESTABLISH_CONNECTION) {
                console.log(`Connection ACK Reply received from client ${packet.peerAddress}:${packet.peerPort}`);
                console.log('Connection Established.\n');
            } else if (segmentedPackets.length > 0 && packet.sequenceNo >= segmentedPackets[0].sequenceNo &&
                slidingWindow[packet.sequenceNo - segmentedPackets[0].sequenceNo] === PacketType.NAK) {
                console.log(`ACK #${packet.sequenceNo} received from ${packet.peerAddress}:${packet.peerPort}`);
            }
        }

        new Promise(resolve => {
            if (segmentedPackets.length > 0) {
                slidingWindow[packet.sequenceNo - segmentedPackets[0].sequenceNo] = PacketType.ACK;
                if (slidingWindow[0] === PacketType.ACK) {
                    segmentedPackets.shift();
                    slidingWindow.shift();
                    resolve();
                }
            }
        }).then(() => {
            if (segmentedPackets.length > slidingWindow.length) {
                sendPendingPacket(slidingWindow.length);
            }
        });
    } else {
        if (debug) console.log(`DATA Request received from ${packet.peerAddress}:${packet.peerPort}`);
        if (method.includes(GET_CONSTANT)) {
            handleGetRequest(requestLine, packet);
        } else if (method.includes(POST_CONSTANT)) {
            Api.post(requestLine[1], payload.split('\r\n\r\n')[1], response => {
                const sendPacket = createPacket(packet, PacketType.DATA, packet.sequenceNo, response);
                slidingWindow.push(PacketType.NAK);
                send(sendPacket);
                segmentedPackets.push(sendPacket);
            });
        }
    }
};

server.on('message', (buf, info) => {
    const packet = Packet.fromBuffer(buf);
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