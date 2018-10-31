// Argument Constants

global.HELP_CONSTANT = "help";
global.GET_CONSTANT = "get";
global.POST_CONSTANT = "post";
global.DEFAULT_PORT = 8080;
global.USER_AGENT = 'Concordia-HTTP/1.0';
global.REDIRECT_STATUS_CODE = '302';

// Response Status Code Messages
global.INTERNAL_SERVER_ERROR = 'There seems to be an internal server error.' +
    'We are working on it. Please try again';
global.ERROR_FORBIDDEN = 'Access Restricted. Looks like you were trying to access ' +
    'the file outside the file server working directory.';
global.FILE_NOT_FOUND = 'File Not found in the File Server Directory.';
global.FILE_UPDATE_SUCCESS = 'File Created/Updated Successfully.';