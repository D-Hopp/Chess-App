var session = require('express-session');


const http = require('http');



//create shared Session
const express = require('./app')
const sessionParser = express.session

//Import express app and set port
var app = express.app;
var port = process.env.HTTP_PORT || 3000;

app.use(sessionParser)


const wss = require('./websocket')
//
// Create an HTTP server.
//
const server = http.createServer(app);


//
// Create a WebSocket server completely detached from the HTTP server.
//


server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session) {
      socket.write('HTTP/1.1 401 No Session\r\n\r\n');
      socket.destroy();
       console.log("noSession")
       return;
    }
    if (!request.session.user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
       console.log("noID")
       return;
     }

    console.log('Session is parsed! from room'+request.url);

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});


  //Start express server
  server.listen(port, function() {
  console.log('Express server listening on port ' + port);
  //Start Websocket server
  //var websocketHookup = require('./websocket')(sessionParser) 

  });
