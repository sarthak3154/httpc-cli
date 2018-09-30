const net = require('net');
const client = net.createConnection({port: 3000});

connectClient = () => {
    client.on('connect', () => {
        console.log('Connected to Server');
        client.write('<TEST MESSAGE>');
    });
};

client.on('data', (data) => {
    console.log(data);
});

client.on('end', () => {
    console.log('Disconnected from Server');
});

exports.get = () => {
    connectClient();
};