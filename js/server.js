var http = require("http"); // import http core modules
var url = require("url"); // import url core modules
function startServer(route,handle){
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        
        route(handle,pathname,request, response); 

    }
    http.createServer(onRequest).listen(41064);
    console.log("Server has started.");
}
exports.startServer = startServer; 