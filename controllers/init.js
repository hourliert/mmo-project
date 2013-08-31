var opDB = require('../models/opDB');


/*
 * controller permettant de générer la liste des parametres d'initialisation du mmo
 * et de l'envoyer au client
 */
exports.envoyerInit = function(socket, globale){
	var aEnvoyer = {};

	opDB.recupParamInit(function(data){	
		if (data != -1){
			for (var i in data){
				if (data[i].nom){
					aEnvoyer[data[i].nom] = data[i].valeur;
					globale[data[i].nom] = data[i].valeur;
				}
			}
			
			for (var i in globale){
				if( i != 'terrain' && i != 'gilleCollision' && i!= 'globaleOS'){
					aEnvoyer[i] = globale[i];
				}
			}
			socket.emit('repInitEngine', aEnvoyer);
		} else {
			socket.emit('repInitEngine', {erreur : 1});
		}
	});
};

/*
 * deco un perso du jeu (bdd)
 */
exports.decoPerso = function(globale){
	if (globale.idPerso){
		var idPerso = globale.idPerso;
		opDB.updateDeconnecte(idPerso);
	}
};

/*
 * deco un perso du jeu (bdd) on se base uniquement sur l'id du perso local (qu'on recup avant l'init)
 */
exports.coPerso = function(globale){
	if (globale.idPerso){
		var idPerso = globale.idPerso;
		opDB.updateConnecte(idPerso);
	}
};