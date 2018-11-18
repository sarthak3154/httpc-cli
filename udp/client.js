#!/usr/bin/env node

require('../constants');
const Packet = require('./packet.js');
const ip = require('ip');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

send = (data) => {
    const buf = Packet.create(data, ip.address(), SERVER_PORT)
    client.send(buf, 0, PACKET_HEADERS_LENGTH + data.length, ROUTER_PORT, ROUTER_HOST)
};

send('Hello');

