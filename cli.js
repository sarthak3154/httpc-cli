require('./arguments');
const Api = require('./api');
const yargs = require('yargs');
const fs = require('fs');

checkHelpCommands = (argv) => {

    if (argv._[0] === HELP_CONSTANT) {
        if (argv._.length > 1) {

            if (argv._[1] === GET_CONSTANT) {
                console.log('\nUsage: httpc get [-v] [-h key:value] URL\n\n' +
                    'Get executes a HTTP GET request for a given URL\n\n' +
                    'Options:\n' +
                    '  -v\t\tPrints the detail of the response such as protocol, status, and headers.\n' +
                    '  -h key:value\tAssociates headers to HTTP Request with the format \'key:value\'.');
                process.exit(0)
            } else if (argv._[1] === POST_CONSTANT) {
                console.log('\nUsage: httpc post [-v] [-h key:value] [-d inline-data] [-f file] URL\n\n' +
                    'Post executes a HTTP POST request for a given URL with inline data or from file.\n\n' +
                    'Options:\n' +
                    '  -v\t\tPrints the detail of the response such as protocol, status, and headers.\n' +
                    '  -h key:value\tAssociates headers to HTTP Request with the format \'key:value\'.\n' +
                    '  -d string\tAssociates an inline data to the body HTTP POST request.\n' +
                    '  -f file\tAssociates the content of a file to the body HTTP POST request.\n\n' +
                    'Either [-d] or [-f] can be used but not both.');
                process.exit(0)
            } else {
                console.log('Invalid command\nhttpc: try \'httpc help\' or \'httpc --help\' for more information\n');
                process.exit(0)
            }
        }
    }
};

getHeaders = (argv) => {
    let headers_array = [];
    if (argv.hasOwnProperty('h')) {
        if (Array.isArray(argv.h)) {
            headers_array = headers_array.concat(argv.h);
        } else {
            headers_array.push(argv.h);
        }
    }
    return headers_array;
};

getJSONRequestArguments = (argv, headers) => {
    let args = {
        method: argv._[0],
        url: argv.url,
        v: argv.v,
        h: headers
    };
    if (argv.hasOwnProperty('o')) args.o = argv.o;
    return args;
};

exports.init = () => {
    let argv = yargs.usage('Usage: httpc <command> [arguments]')
        .command('get <url> [arguments]', 'Get executes a HTTP GET request' +
            ' for a given URL and prints response', () => {
        }, (argv) => {
            const headers = getHeaders(argv);
            const args = getJSONRequestArguments(argv, headers);
            Api.get(args);
        })
        .command('post <url> [arguments]', 'Post executes a HTTP POST request and prints the response.', () => {
        }, (argv) => {
            const headers = getHeaders(argv);
            const args = getJSONRequestArguments(argv, headers);

            if (argv.hasOwnProperty('d') && argv.hasOwnProperty('f')) {
                console.log('Either [-d] or [-f] can be used but not both.');
                process.exit(0);
            } else if (argv.hasOwnProperty('d')) {
                args.d = argv.d;
            } else if (argv.hasOwnProperty('f')) {
                args.f = argv.f;
                fs.access(args.f, fs.constants.F_OK, (err) => {
                    if (err) console.log(`${args.f} does not exist`);
                });
            }
            Api.post(args);
        })
        .option('verbose', {
            alias: 'v',
            default: false,
            description: 'Prints the detail of the response such as protocol, status,' +
                'and headers.'
        })
        .help('help')
        .argv;

    checkHelpCommands(argv);
};
