require('../constants');
const ip = require('ip');

class Packet {
    constructor(packetInfo) {
        this.type = packetInfo.type;
        this.sequenceNo = packetInfo.sequenceNo;
        this.peerAddress = packetInfo.peerAddress;
        this.peerPort = packetInfo.peerPort;
        this.payload = packetInfo.payload;
    }

    toBuffer() {
        const buffer = Buffer.alloc(PACKET_MAX_LENGTH);
        buffer.writeUInt8(this.type, 0);
        buffer.writeUInt32BE(this.sequenceNo, 1);
        ip.toBuffer(ip.address(), buffer, 5);
        buffer.writeUInt16BE(this.peerPort, 9);
        buffer.write(this.payload, 11);
        return buffer;
    };

    static fromBuffer(buf) {
        const packetInfo = {};
        packetInfo.type = buf.readUInt8(0);
        packetInfo.sequenceNo = buf.readUInt32BE(1);
        packetInfo.peerAddress = ip.toString(buf, 5, 4);
        packetInfo.peerPort = buf.readUInt16BE(9);
        packetInfo.payload = buf.toString('utf8', 11);
        return new Packet(packetInfo);
    }

    static create(http_request, address, port) {
        const packetInfo = {
            type: 0,
            sequenceNo: 1,
            peerAddress: address,
            peerPort: port,
            payload: http_request
        };
        const packet = new Packet(packetInfo);
        return packet.toBuffer();
    };
}

module.exports = Packet;