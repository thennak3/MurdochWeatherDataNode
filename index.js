// import our exported modules
var server = require("./js/server");
var router = require("./js/router");
var requestHandlers = require("./js/requestHandlers");

var handle ={};
// call the startServer() function associated
// with the server object
// pass the route() function associated with
// the router object as its parameter


handle["/"] = requestHandlers.reqStart;
handle["/index.html"] = requestHandlers.reqStart;
handle["/css/style.css"] = requestHandlers.reqCSSStyle;
handle["/js/jq.js"] = requestHandlers.reqJQJS;
handle["/validdates"] = requestHandlers.reqValidDates;
handle["/getdata"] = requestHandlers.reqData;
handle["/images/clouds-clouds-form-color-186980.jpg"] = requestHandlers.reqBackgroundPicture;
server.startServer(router.route,handle);