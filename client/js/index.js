var socket;
var ip = '67.181.244.12';
var port = 4133; //4132;
var connected;
var PACKET_MOTD = "0";
var PACKET_JOINED = "1";
var PACKET_MESSAGE = "2";
var PACKET_LEFT = "3";
var username;

$(document).ready(function() {
	init();
});

function init() {
	socket = new io.Socket(ip, {port: port}); 
    socket.on('connect', function(){ onSocketConnected(); });
    socket.on('message', function(packet){ onSocketData(packet); });
    socket.on('disconnect', function(){ onSocketDisconnected(); });
    
    $('#input').keyup(function(e) { if(e.keyCode == 13) sendMessage(); });
    $('#send').click(function() { sendMessage(); });
    $('#input').focus();

    promptUsername();
}

function promptUsername() {
	while(!username) {
  		username = prompt("Input a desired user name");
  		if (username == null) {
			promptCanceled();
			return;
		}
  	}
  	load();
}

function promptCanceled() {
	output('Opps! You canceled the login process. Please reload page to try again.');
}

function load() {
	output('Connecting...');
    socket.connect();
}

function onSocketConnected() {
	connected = true;
    socket.send(PACKET_JOINED+chr(0)+username);
}

function onSocketData(packet) {
    var data = packet.split(chr(0));
    
    switch (data[0]) {
        case PACKET_MOTD:
            output(data[1]);
            break;
        case PACKET_JOINED:
            output('User "'+data[1]+'" has joined.');
            $('#userlist').append('<option>'+data[1]+'</option>');
            break;
        case PACKET_MESSAGE:
        	var params = data[1].split(chr(1));
        	output(params[0]+': '+params[1]);
            break;
        case PACKET_LEFT:
        	output('User "'+data[1]+'" has left.');
            break;
        default:
            alert('[ERROR] command \''+data[0]+'\' does not exist. (packet='+packet+')');
    }
}

function onSocketDisconnected() {
    output('[Disconnected from server]');
}

function sendMessage() {
	if (!connected) return;
	
	var message = $('#input').val();
	$('#input').val('');
	if (!message.replace(/ /g, '')) return;
	socket.send(PACKET_MESSAGE+chr(0)+message);
}

function output(message) {
	$('#output').append(message+'<br />');
}

function chr(i) { 
    return String.fromCharCode(i);
}