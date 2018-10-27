require('./arguments');
const net = require('net');

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

const server = net.createServer(handleClient)
    .on('error', err => {
        throw err;
    });

server.listen({port: DEFAULT_PORT}, () => {
    console.log('Server listening at port ' +
        (server.address().hasOwnProperty('port') ? server.address().port : server.address()));
});
