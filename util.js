const parse = require('url-parse');
const path = require('path');

const extNames = ['.txt', '.json', '.html', '.png', '.jpg', 'jpeg'];
exports.dispContentTypes = [CONTENT_TYPE_HTML, CONTENT_TYPE_JSON, CONTENT_TYPE_JPEG];

exports.getURLProperties = (url) => {
    return parse(url, true);
};

exports.fileExtension = (file) => {
    const extName = path.extname(file);
    return extNames.includes(extName);
};

exports.isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};