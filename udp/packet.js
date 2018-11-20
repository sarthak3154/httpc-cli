require('../constants');
const ip = require('ip');

class Packet {
    constructor(builder) {
        this.type = builder.type;
        this.sequenceNo = builder.sequenceNo;
        this.peerAddress = builder.peerAddress;
        this.peerPort = builder.peerPort;
        this.payload = builder.payload;
    }

    toBuilder() {
        return new Packet.Builder(this.type).withSequenceNo(this.sequenceNo).withPeerAddress(this.peerAddress)
            .withPeerPort(this.peerPort).withPayload(this.payload);
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

    static get Builder() {
        class Builder {
            constructor(packetType) {
                this.type = packetType;
            }

            withSequenceNo(sequenceNo) {
                this.sequenceNo = sequenceNo;
                return this;
            }

            withPeerAddress(peerAddress) {
                this.peerAddress = peerAddress;
                return this;
            }

            withPeerPort(peerPort) {
                this.peerPort = peerPort;
                return this;
            }

            withPayload(payload) {
                this.payload = payload;
                return this;
            }

            build() {
                return new Packet(this);
            }
        }

        return Builder;
    }
}

module.exports = Packet;