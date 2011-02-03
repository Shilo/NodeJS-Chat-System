var sys = require('sys');
var http = require('http');
var io = require('/node-v0.2.6/socket.io');
var server;
var socket;
var port = 4133;// 4132;
var PACKET_MOTD = "0";
var PACKET_JOINED = "1";
var PACKET_MESSAGE = "2";
var PACKET_LEFT = "3";

var MOTD = "Welcome to HollaBox! Have a HollaTime. ummm....";

function init() {
    server = http.createServer();
    socket = io.listen(server);
    socket.on('connection', function(client){ 
        onClientConnected(client);
        client.on('message', function(packet){ onClientSentData(client, packet); });
        client.on('disconnect', function(){ onClientDisconnected(client); });
    });
    load();
}

function load() {
    server.listen(port);
    sys.puts('');
    sys.puts('==========================');
    sys.puts('== HollaBox Server v0.1 ==');
    sys.puts('==========================');
    log('Server is listening on port '+port+'...');
}

function onClientConnected(client) {
	client.send(PACKET_MOTD+chr(0)+MOTD);
    log('Client "'+client.sessionId+'" has connected.');
}

function onClientSentData(client, packet) {
    var data = packet.split(chr(0));

    switch (data[0]) {
        case PACKET_JOINED:
        	onClientJoined(client, data[1]);
            break;
        case PACKET_MESSAGE:
            onClientMessage(client, data[1]);
            break;
        default:
            error('command "'+data[0]+'" does not exist. (packet='+packet+')');
    }
}

function onClientDisconnected(client) {
    onClientLeft(client);
    log('Client "'+client.sessionId+'" has disconnectedd.');
}

function onClientJoined(client, username) {
	client.username = username;
	client.send(PACKET_JOINED+chr(0)+username);
	client.broadcast(PACKET_JOINED+chr(0)+username);
	chat('User "'+username+'" has joined.');
}

function onClientMessage(client, message) {
	client.send(PACKET_MESSAGE+chr(0)+client.username+chr(1)+message);
	client.broadcast(PACKET_MESSAGE+chr(0)+client.username+chr(1)+message);
	chat(client.username+': '+message);
}

function onClientLeft(client) {
	client.broadcast(PACKET_LEFT+chr(0)+client.username);
	chat('User "'+client.username+'" has left.');
}

function chr(i) { 
    return String.fromCharCode(i);
}

function time() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    
    return hours+':'+minutes+':'+seconds;
}

function chat(message) {
    sys.puts('<'+time()+'> [CHAT] '+message);
}

function log(message) {
    sys.puts('<'+time()+'> [LOG] '+message);
}

function warning(message) {
    sys.puts('<'+time()+'> [WARNING] '+message);
}

function error(message) {
    sys.puts('<'+time()+'> [ERROR] '+message);
}

init();