const net = require('net');
const client = net.createConnection({host: 'google.com', port: 80});

connectClient = () => {
    client.on('connect', () => {
        console.log('Connected to Server');
        client.end('GET / HTTP/1.0\r\nHost: google.com\r\n\r\n');
    });
};

client.on('data', (data) => {
    console.log('Response ' + data);
});

client.on('end', () => {
    console.log('Disconnected from Server');
});

exports.get = () => {
    connectClient();
};