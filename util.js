const parse = require('url-parse');
const path = require('path');

exports.getURLProperties = (url) => {
    return parse(url, true);
};

exports.fileExtension = (file) => {
    const extName = path.extname(file);
    return ['.txt'].includes(extName);
};