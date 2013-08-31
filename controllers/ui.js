var opDB = require('../models/opDB');


/*
 * sauvegarde les param recu en DB
 */
exports.sauvParam = function(socket, idPerso, param){
	opDB.sauvParamDB(idPerso, param);
}

/*
 * traite un message arrivant d'un client pour l'add en BDD puis  broadcast
 */
exports.traiteMessageTchat = function(socket, globale, message){
	var nom = globale.nom;
	var idPerso = globale.idPerso;
	
	opDB.ajouteMessageDB(nom, idPerso, message, function(){
		socket.broadcast.emit('repMshTchat', {'message' : message});
	});
}
