#!/usr/bin/env node

require('./cli').init();

const net = require('net');

const server = net.createServer((socket) => {
    console.log('Client Connected');
    socket.on('data', data => {
        console.log('Data received from Client: ' + data);
    })
}).on('error', err => {
    throw err;
});

server.listen({port: 3000}, () => {
    console.log('Server is listening at port 3000');
});
