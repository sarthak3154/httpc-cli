const parse = require('url-parse');

exports.getURLProperties = (url) => {
    return parse(url, true);
};