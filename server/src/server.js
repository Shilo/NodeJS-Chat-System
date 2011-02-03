var sys = require('sys');
var http = require('http');
var io = require('/node-v0.2.6/socket.io');
var server;
var socket;
var clients;
var port = 4133;// 4132;
var PACKET_MOTD = "0";
var PACKET_JOINED = "1";
var PACKET_MESSAGE = "2";
var PACKET_LEFT = "3";
var PACKET_USERLIST = "4";
var PACKET_LOGIN = "5";
var PACKET_LOGIN_NAMETAKEN = "6";
var PACKET_LOGIN_PASSWORD = "7";

var MOTD = "Welcome to HollaBox!";
var admins = new Array("Shilo", "Henrico", "Inkybro");
var adminPasswords = new Array("iRock", "iRock", "iRock");

function init() {
    server = http.createServer();
    socket = io.listen(server);
    socket.on('connection', function(client){ 
        onClientConnected(client);
        client.on('message', function(packet){ onClientSentData(client, packet); });
        client.on('disconnect', function(){ onClientDisconnected(client); });
    });
    clients = new Array();
    load();
}

function load() {
    server.listen(port);
    sys.puts('');
    sys.puts('==========================');
    sys.puts('== HollaBox Server v0.3 ==');
    sys.puts('==========================');
    log('Server is listening on port '+port+'...');
}

function onClientConnected(client) {
    log('Client "'+client.sessionId+'" has connected.');
}

function onClientSentData(client, packet) {
    var data = packet.split(chr(0));

    switch (data[0]) {
        case PACKET_MESSAGE:
            onClientMessage(client, data[1]);
            break;
        case PACKET_LOGIN:
        	onClientLogin(client, data[1]);
        	break;
        case PACKET_LOGIN_PASSWORD:
        	onClientPassword(client, data[1]);
        	break;
        default:
            error('command "'+data[0]+'" does not exist. (packet='+packet+')');
    }
}

function isAdmin(username) {
	for (i in admins) {
		if (admins[i].toLowerCase() == username.toLowerCase()) return true;
	}
	return false;
}

function onClientDisconnected(client) {
	clients[client.id] = null;
    onClientLeft(client);
    log('Client "'+client.sessionId+'" has disconnectedd.');
}

function onClientLogin(client, username) {
	username = ucfirst(username);
	
	for (id in clients) {
        if (clients[id] && clients[id] != client) {
            if (clients[id].username.toLowerCase() == username.toLowerCase()) {
            	client.send(PACKET_LOGIN_NAMETAKEN);
            	return;
            }
        }
    }
    
    client.username = username;
    if (isAdmin(username)) {
    	client.send(PACKET_LOGIN_PASSWORD);
    	return;
    }
    
    onClientJoined(client);
}

function onClientPassword(client, password) {
	var username = client.username.toLowerCase();
	for (i in admins) {
		if (admins[i].toLowerCase() == username) {
			if (adminPasswords[i] == password) {
				onClientJoined(client);
				return;
			} else {
				client.send(PACKET_LOGIN_PASSWORD);
				return;
			}
		}
	}
	client.disconnect();
}
function onClientJoined(client) {
	var userlist = '';
	for (id in clients) {
        if (clients[id] && clients[id].username != undefined) {
            userlist += clients[id].username + chr(1);
        }
    }
    if (userlist) client.send(PACKET_USERLIST + chr(0) + userlist);
    
    var id = clients.length;
    client.id = id;
    clients[id] = client;
    
	client.send(PACKET_MOTD+chr(0)+MOTD);
	client.send(PACKET_JOINED+chr(0)+client.username);
	client.broadcast(PACKET_JOINED+chr(0)+client.username);
	chat('User "'+client.username+'" has joined.');
}

function onClientMessage(client, message) {
	chat(client.username+': '+message);
	if (!isAdmin(client.username)) message = parse(message);
	client.send(PACKET_MESSAGE+chr(0)+client.username+chr(1)+message);
	client.broadcast(PACKET_MESSAGE+chr(0)+client.username+chr(1)+message);
}

function onClientLeft(client) {
	client.broadcast(PACKET_LEFT+chr(0)+client.username);
	chat('User "'+client.username+'" has left.');
}

function chr(i) { 
    return String.fromCharCode(i);
}

function parse(message) {
	message = message.replace(/</g, '&#60;').replace(/>/g, '&#62;');
	return message;
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

function ucfirst(str) {
	var firstLetter = str.slice(0,1);
	return firstLetter.toUpperCase() + str.substring(1);
}

init();