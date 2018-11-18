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

    static create(msg, address, port) {
        const packetInfo = {
            type: 0,
            sequenceNo: 1,
            peerAddress: address,
            peerPort: port,
            payload: msg
        };
        const packet = new Packet(packetInfo);
        return packet.toBuffer();

    };
}

module.exports = Packet;