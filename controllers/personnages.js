var opDB = require('../models/opDB.js');



/*
 * controller permettant d'envoyer la liste des perso autour du client
 */
exports.envoyerPerso = function(socket, data){
	var marge = 50;
	var aEnvoyer = {};
	
	opDB.listeJoueursAutour(data.posX, data.posY, marge, data.idPerso, function(data){
		if (data != -1){
			for (var i in data){
				aEnvoyer[data[i].idPerso] = data[i];
			}
			socket.emit('repJoueursAutour',aEnvoyer);
		} else {
			socket.emit('repJoueursAutour',{erreur : 1});
		}
	})
};