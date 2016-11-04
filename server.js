var express = require('express');
var app  = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use("/node_modules", express.static(__dirname + '/node_modules'));
app.use("/", express.static(__dirname + '/'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', function(socket){
    console.log('A user connected');
    socket.on('login', function(data) {
        console.log(data);
        socket.join(data.username);
    });

    socket.on('sendOffer', function(data){
        socket.to(data.peerID).emit('receiveOffer', data);
        console.log('creating offer for', data.peerID);
    })

    socket.on('sendAnswer', function(data){
        socket.to(data.peerID).emit('userAnswer', data);
        console.log('creating answer for', data.peerID);
    });

    socket.on('sendCandidate', function(data) {
        console.log('send candidate');
        socket.broadcast.emit('sendCandidate', data);
    });

    socket.on('disconnect', function() {
        console.log('A user disconnected');
    });
});

http.listen(3000, function() {
    console.log('Server has started on localhost/3000');
});