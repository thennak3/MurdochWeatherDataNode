// create route function with pathname as parameter
function route(handle, pathname, request, response) {
    if(typeof handle[pathname] === 'function') {
        handle[pathname](request, response);
    } else {
        console.log("No request handler found for: " + pathname);
        response.setHeader('refresh',10 + ';URL="index.html"');
        response.writeHead(404, {"Content-Type" : "text/html"});
        response.write('Resource not found! Returning to <a href="index.html">index.html</a> in 10 seconds');
        response.end();
    }
}
// export route function
exports.route = route;