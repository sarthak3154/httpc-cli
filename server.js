require('./arguments');
const net = require('net');

handleClient = (socket) => {
    socket.on('data', buf => {

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
