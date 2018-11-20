/* Request/Response Argument Constants */

global.HELP_CONSTANT = "help";
global.GET_CONSTANT = "get";
global.POST_CONSTANT = "post";
global.DEFAULT_PORT = 80;
global.LOCALHOST_PORT = 8080;
global.USER_AGENT = 'Concordia-HTTP/1.0';
global.REDIRECT_STATUS_CODE = '302';
global.UDP_REQUEST_TYPE = true;
global.EMPTY_REQUEST_RESPONSE = "";
global.RESPONSE_TIMEOUT = 15000;


/* Request/Response Content PacketType */

global.CONTENT_TYPE_TEXT = 'text/plain';
global.CONTENT_TYPE_JSON = 'application/json';
global.CONTENT_TYPE_JPEG = 'image/jpeg';
global.CONTENT_TYPE_HTML = 'text/html';


/* Response Status Code Messages */

global.INTERNAL_SERVER_ERROR = 'There seems to be an internal server error.' +
    'We are working on it. Please try again';
global.ERROR_FORBIDDEN = 'Access Restricted. Looks like you were trying to access ' +
    'the file outside the file server working directory.';
global.FILE_NOT_FOUND = 'File Not found in the File Server Directory.';
global.FILE_UPDATE_SUCCESS = 'File Created/Updated Successfully.';


/* UDP Config */

global.SERVER_PORT = 8007;
global.SERVER_HOST = 'localhost';
global.ROUTER_PORT = 3000;
global.ROUTER_HOST = 'localhost';
global.PACKET_MIN_LENGTH = 11;
global.PACKET_MAX_LENGTH = 11 + 1024;
global.PACKET_HEADERS_LENGTH = 12;

global.PacketType = {
    DATA: 0,
    ACK: 1,
    SYN: 2,
    SYN_ACK: 3,
    NAK: 4
};
