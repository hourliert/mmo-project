
/*
 * GET generMap.
 */

var controller = require('../controllers/map');

/*
 * valide l'envoi de la map pour le jeu
 */
exports.valideMap = function(socket, globale, data){	
	if (data.direction == null || data.idPerso == null){ //données user incorrect
		socket.emit('repCarte',{erreur : 1});
		socket.emit('repForeground',{erreur : 1});
	} else {		
		if (data.idPerso == globale.idPerso){ //on verifie : position correctes et l'id du perso envoyé est correct
			controller.envoyerMap(socket, globale, data.direction); //plus besoin de requete
		} else {
			socket.emit('repCarte',{erreur : 1}); 
			socket.emit('repForeground',{erreur : 1});
		}
	}
}

/*
 * valide l'envoi de la carte pour l'EDITEU
 */
exports.valideMapEditeur = function(socket, globale, data){	
	if (data.direction == null || data.idPerso == null){ //données user incorrect
		socket.emit('repCarteEditeur',{erreur : 1});
		socket.emit('repFGEditeur',{erreur : 1});
	} else {		
		if (data.idPerso == globale.idPerso){ //on verifie : position correctes et l'id du perso envoyé est correct
			controller.envoyerMapEditeur(socket, globale, data.direction); //plus besoin de requete
		} else {
			socket.emit('repCarteEditeur',{erreur : 1}); 
			socket.emit('repFGEditeur',{erreur : 1});
		}
	}
}

/*
 * sauvegarde la map recu en DB (check param avant d'appeler le controller)
 */
exports.sauvMapDB = function(socket, globale, data){	
	var terrains = {};
	
	if (data.idPerso == null){ //données user incorrect
		socket.emit('repSauvMapDB',{erreur : 1});
	} else {
		if (data.idPerso == globale.idPerso){ //on verifie : l'id du perso envoyé est correct (droit de mofifier la DB)
			if (data.terrain != null){
				terrains.terrain = data.terrain;
			}
			if (data.terrainFG != null){
				terrains.terrainFG = data.terrainFG;
			}
			controller.sauvMapDB(socket, globale, terrains); //plus besoin de requete
		} else {
			socket.emit('repSauvMapDB',{erreur : 1}); 
		}
	}
}