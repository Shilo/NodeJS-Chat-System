var socket;
var ip = 'YOUR.IP.HERE';
var port = 4133; //4132;
var connected;
var PACKET_MOTD = "0";
var PACKET_JOINED = "1";
var PACKET_MESSAGE = "2";
var PACKET_LEFT = "3";
var PACKET_USERLIST = "4";
var PACKET_LOGIN = "5";
var PACKET_LOGIN_NAMETAKEN = "6";
var PACKET_LOGIN_PASSWORD = "7";
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

    promptUsername("Input a desired user name");
}

function promptUsername(message) {
	while(!username) {
  		username = prompt(message);
  		if (username == null) {
			promptCanceled();
			return;
		}
  	}
  	username = ucfirst(username);
  	load();
}

function promptPassword() {
	var password;
	while(!password) {
  		password = prompt('Input password');
  		if (password == null) {
			promptCanceled();
			return;
		}
  	}
  	
  	socket.send(PACKET_LOGIN_PASSWORD+chr(0)+password);
}

function promptCanceled() {
	output('Opps! You canceled the login process. Please reload page to try again.');
}

function load() {
	output('Connecting...');
    socket.connect();
}

function onSocketConnected() {
    socket.send(PACKET_LOGIN+chr(0)+username);
}

function onSocketData(packet) {
    var data = packet.split(chr(0));
    
    switch (data[0]) {
        case PACKET_MOTD:
        	connected = true;
            output(data[1]);
            break;
        case PACKET_JOINED:
            output('User "'+data[1]+'" has joined.');
            $('#userlist').append('<option id="'+data[1]+'">'+data[1]+'</option>');
            break;
        case PACKET_MESSAGE:
        	var params = data[1].split(chr(1));
        	output(params[0]+': '+params[1]);
            break;
        case PACKET_LEFT:
        	output('User "'+data[1]+'" has left.');
        	$('#'+data[1]).remove();
            break;
        case PACKET_USERLIST:
        	var users = data[1].split(chr(1));
        	for (i in users) {
        		if (users[i]) {
        			$('#userlist').append('<option id="'+users[i]+'">'+users[i]+'</option>');
        		}
        	}
        	break;
        case PACKET_LOGIN_NAMETAKEN:
        	socket.disconnect();
        	username = null;
        	promptUsername("User name taken, Input a different user name");
        	break;
        case PACKET_LOGIN_PASSWORD:
        	promptPassword();
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
	$('#input').val('').focus();
	if (!message.replace(/ /g, '')) return;
	socket.send(PACKET_MESSAGE+chr(0)+message);
}

function output(message) {
	$('#output').append(message+'<br />');
	$('#output').scrollTop($("#output").attr('scrollHeight'));
}

function chr(i) { 
    return String.fromCharCode(i);
}

function ucfirst(str) {
	var firstLetter = str.slice(0,1);
	return firstLetter.toUpperCase() + str.substring(1);
}
