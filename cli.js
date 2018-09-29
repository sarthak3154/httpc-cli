const yargs = require('yargs');

exports.init = function() {
  let argv = yargs.usage('Usage: httpc <command> [arguments]')
                    .command('get <url>', 'Get executes a HTTP GET request' +
                    ' for a given URL')
                    .option('verbose', {
                        alias: 'v',
                        default: false
                      })
                    .help('help')
                    .argv;

    console.log(argv)
}
