#!/usr/bin/env node

require('../arguments');
const net = require('net');
const yargs = require('yargs');

handleRequest = (buf) => {
    const request = buf.toString('utf8');
    const reqData = request.split('\r\n');
    const typeHeader = reqData[0].toLowerCase();
    if (typeHeader.includes(GET_CONSTANT)) {
        //TODO GET Request handling
    } else if (typeHeader.includes(POST_CONSTANT)) {
        //TODO POST Request handling
    } else {
        //TODO INVALID Request handling
    }
};

handleClient = (socket) => {
    console.log(`New Client Connected from ${JSON.stringify(socket.address())}`);
    socket.on('data', buf => {
        handleRequest(buf);
    }).on('error', err => {
        console.log(`Socket error ${err}`);
        socket.destroy();
    }).on('end', () => {
        socket.destroy();
    });
};

const argv = yargs.usage('httpfs is a simple file server.\n\nusage: httpfs [-v] [-p PORT] [-d PATH-TO-DIR]')
    .default('port', 8080)
    .option('v', {
        default: false,
        description: 'Prints debugging messages.'
    })
    .option('p', {
        alias: 'port',
        description: 'Specifies the port number that the server will listen and serve at.\n' +
            'Default is 8080.'
    })
    .option('d', {
        description: 'Specifies the directory that the server will use to read/write requested files. ' +
            'Default is the current directory when launching the application.'
    })
    .help('help')
    .argv;


const server = net.createServer(handleClient)
    .on('error', err => {
        throw err;
    });

server.listen({port: argv.port || DEFAULT_PORT}, () => {
    console.log('Server listening at port ' +
        (server.address().hasOwnProperty('port') ? server.address().port : server.address()));
});
