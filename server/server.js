#!/usr/bin/env node

require('../constants');
const Api = require('./api');
const net = require('net');
const yargs = require('yargs');

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

sendResponse = (response, socket) => {
    socket.write(response);
};

handleGetRequest = (requestLine, socket) => {
    if (requestLine.length === 2 || requestLine[1] === '/') {
        Api.getFiles(response => {
            sendResponse(response, socket);
        });
    } else {
        Api.getFileDetails(requestLine[1], response => {
            sendResponse(response, socket);
        });
    }
};

handleRequest = (buf, socket) => {
    const request = buf.toString('utf8');
    const reqData = request.split('\r\n');
    const method = reqData[0].toLowerCase();
    const requestLine = method.split(' ');

    if (method.includes(GET_CONSTANT)) {
        handleGetRequest(requestLine, socket);
    } else if (method.includes(POST_CONSTANT)) {
        Api.post(requestLine[1], request.split('\r\n\r\n')[1], response => {
            sendResponse(response, socket);
        });
    } else {
        //TODO INVALID Request handling
    }
};

handleClient = (socket) => {
    console.log(`New Client Connected from ${JSON.stringify(socket.address())}`);
    socket.on('data', buf => {
        handleRequest(buf, socket);
    }).on('error', err => {
        console.log(`Socket error ${err}`);
        socket.destroy();
    }).on('end', () => {
        socket.destroy();
    });

};

const server = net.createServer(handleClient)
    .on('error', err => {
        throw err;
    });

server.listen({port: argv.port || DEFAULT_PORT}, () => {
    console.log('Server listening at port ' +
        (server.address().hasOwnProperty('port') ? server.address().port : server.address()));
    if (argv.hasOwnProperty('d')) {
        defaultDir = argv.d;
    }
});
