require('./arguments');
const yargs = require('yargs');

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

exports.init = () => {
    let argv = yargs.usage('Usage: httpc <command> [arguments]')
        .command('get <url> [arguments]', 'Get executes a HTTP GET request' +
            ' for a given URL and prints response', () => {
        }, (argv) => {
            console.log('This GET message will be printed')
        })
        .command('post <url> [arguments]', 'Post executes a HTTP POST request and prints the response.', () => {
        }, (argv) => {
            console.log('This POST message will be printed')
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
