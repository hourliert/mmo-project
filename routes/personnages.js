var controller = require('../controllers/personnages');



exports.valideJoueurAutour = function(socket, globale, data){
	if (data.x == null || data.y == null || data.idPerso == null){
		socket.emit('repJoueursAutour',{erreur : 1});
	} else {
		var parametres = {};
		parametres.posX = parseInt(data.x);
		parametres.posY = parseInt(data.y);
		parametres.idPerso = data.idPerso;
				
		if (!isNaN(parametres.posX) && !isNaN(parametres.posY) && parametres.idPerso == globale.idPerso){
			controller.envoyerPerso(socket, parametres);
		} 
	}
}