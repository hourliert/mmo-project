var opDB = require('../models/opDB.js');



/*
 * controller permettant d'envoyer la liste des perso autour du client
 */
exports.envoyerObjets = function(socket, globale, data){
	var marge = 50;
	var aEnvoyer = {};
	
	opDB.listeObjetsAutour(data.posX, data.posY, marge, data.idPerso, function(data){
		if (data != -1){
			for (var i in data){
				aEnvoyer[data[i].idObjet] = data[i];
			}
			socket.emit('repObjetsAutour',aEnvoyer);
			
			//ici il faut mettre a jours la grille de collision à partir de la liste d'objets récupérés
			// a voir pour faire ça de manière asynchrone
			var x = 0,
				y = 0,
				hauteurTuile = parseInt(globale.hauteurTuile),
				largeurTuile = parseInt(globale.largeurTuile);
						
			//mise a jours de la grille de collision
			for (var i in aEnvoyer){
				if (aEnvoyer[i].collision == 1){
					x = aEnvoyer[i].x * globale.largeurTuile;
					y = 0;
					
					while (x < aEnvoyer[i].x * largeurTuile + aEnvoyer[i].largeur){
						y = aEnvoyer[i].y * globale.hauteurTuile;
						while (y > aEnvoyer[i].y * hauteurTuile - aEnvoyer[i].hauteur){
							globale.globaleOS.grilleCollision[x/globale.largeurTuile][y/globale.hauteurTuile] = 1;
							y -= hauteurTuile;
						}
						x += largeurTuile;
					}
				}
			}
		} else {
			socket.emit('repObjetsAutour',{erreur : 1});
		}
	})
};