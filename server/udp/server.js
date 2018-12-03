#!/usr/bin/env node

require('../../constants');
const Api = require('../api');
const Packet = require('../../udp/packet');
const Util = require('../../util');
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
    return clientPacket.toBuilder().withType(packetType).withSequenceNo(sequenceNo)
        .withPayload(response).build();
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
            if (sendPacket.type === PacketType.DATA) {
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
    if (debug) console.log('#packets to be sent: ' + (Math.floor(packetsCount) + 1) + '\n');
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

handleGetRequest = (endPoint, packet) => {
    if (endPoint === '' || endPoint === '/') {
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
            console.log(`Requesting GET ${endPoint}`);
        }
        Api.getFileDetails(endPoint, response => {
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

let contentLength = 0, shiftCount = 0, packetCount = 0, endPoint, postResponse = false,
    receivedPackets = new Array(WINDOW_SIZE), packets = [], packetSet = new Set();
receivedPackets.fill(null);

comparePacket = (a, b) => {
    if (a.sequenceNo > b.sequenceNo)
        return 1;
    else if (b.sequenceNo > a.sequenceNo)
        return -1;
    return 0;
};

getHeaderLength = (packet) => {
    return packet.payload.split('\r\n\r\n')[0].length;
};

getSortedRequestBody = (packets) => {
    let body = '';
    packets.forEach(packet => {
        const data = packet.payload;
        body += (data.toLowerCase().includes(POST_CONSTANT) ? data.split('\r\n\r\n')[1] : data);
    });
    return body;
};

handlePostRequest = (reqData, packet) => {
    if (reqData[0].toLowerCase().includes(POST_CONSTANT)) {
        endPoint = reqData[0].split(' ')[1];
        let i = 0;
        while (contentLength === 0) {
            if (reqData[i].includes(HEADER_CONTENT_LENGTH)) {
                contentLength = parseInt(reqData[i].split(' ')[1].trim());
                packetCount = Math.floor((contentLength + getHeaderLength(packet)) / PACKET_PAYLOAD_SIZE) + 1;
            }
            i++;
        }
    }

    if (packetSet.has(packet.sequenceNo)) {
        console.log(`Packet #${packet.sequenceNo} already received`);
        const sendPacket = createPacket(packet, PacketType.ACK, packet.sequenceNo, EMPTY_REQUEST_RESPONSE);
        send(sendPacket);
    } else {
        console.log(`Packet #${packet.sequenceNo} arrived`);
        console.log(`Payload-Length: ${packet.payload.length}\n`);
        packetSet.add(packet.sequenceNo);
        const notNullIndex = receivedPackets.findIndex(Util.isNotNull);
        const packetPosition = (notNullIndex !== -1 && packet.sequenceNo > WINDOW_SIZE) ?
            packet.sequenceNo - (receivedPackets[notNullIndex].sequenceNo + notNullIndex) : packet.sequenceNo - 1;
        receivedPackets[packetPosition - shiftCount] = packet;
        packets.push(packet);
        packets.sort(comparePacket);

        if (receivedPackets[0] !== null && WINDOW_SIZE + shiftCount !== packetCount) {
            ++shiftCount;
            receivedPackets.shift();
            receivedPackets.push(null);
        }

        if (packetSet.size === packetCount && !postResponse) {
            postResponse = true;
            const sortedRequestBody = getSortedRequestBody(packets);
            Api.post(endPoint, sortedRequestBody, response => {
                const sendPacket = createPacket(packet, PacketType.ACK, packet.sequenceNo, response);
                send(sendPacket);
                packetSet.clear();
            });
        } else {
            const sendPacket = createPacket(packet, PacketType.ACK, packet.sequenceNo, EMPTY_REQUEST_RESPONSE);
            send(sendPacket);
        }
    }
};

handleRequest = (packet) => {

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
        const reqData = packet.payload.split('\r\n');
        const methodHeader = reqData[0].toLowerCase();
        if (debug) console.log(`DATA Request received from ${packet.peerAddress}:${packet.peerPort}`);
        if (methodHeader.includes(GET_CONSTANT)) {
            handleGetRequest(methodHeader.split(' ')[1], packet);
        } else {
            handlePostRequest(reqData, packet);
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