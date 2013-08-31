/*
 * classe gérant le tchat
 */

function Tchat(ioCom){
	var monTchat = this;
	this.ioCom = ioCom;
	this.uiTchat = $('#messages-tchat');

	this.ioCom.repMshTchat(function(data){
		monTchat.addMessageTchat(data);
	});
}

Tchat.prototype.envoiMessage = function(message){
	this.ioCom.reqEnvoiMsgTchat(message);
	this.uiTchat.append('<li>' + message + '</li>');	
	this.uiTchat.scrollTop(this.uiTchat.height());
}

Tchat.prototype.addMessageTchat = function(message){
	this.uiTchat.append('<li>' + message + '</li>');	
	this.uiTchat.scrollTop(this.uiTchat.height());
}
