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
        return new Packet.Builder().withType(this.type).withSequenceNo(this.sequenceNo)
            .withPeerAddress(this.peerAddress).withPeerPort(this.peerPort).withPayload(this.payload);
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
        return new Packet.Builder().withType(buf.readUInt8(0)).withSequenceNo(buf.readUInt32BE(1))
            .withPeerAddress(ip.toString(buf, 5, 4)).withPeerPort(buf.readUInt16BE(9))
            .withPayload(buf.toString('utf8', 11)).build();
    }

    static get Builder() {
        class Builder {
            withType(packetType) {
                this.type = packetType;
                return this;
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