var controller = require('../controllers/ui');

/*
 * sauvegarde les parametres reçu par le client
 */
exports.sauvParam = function(socket, globale, data){	
	var param = {};
	if (!(data.idPerso == null || data.largeurEcran == null || data.hauteurEcran == null || data.position_ecran_x == null || data.position_ecran_y == null)){
		if (data.idPerso == globale.idPerso){ //on verifie : l'id du perso envoyé est correct (droit de mofifier la DB)
			if (!(data.largeurEcran > 60 || data.largeurEcran < 20)){ //largeur valide
				param.largeurEcran = data.largeurEcran;
			}
			if (!(data.hauteurEcran > 30 || data.hauteurEcran < 15)){ //largeur valide
				param.hauteurEcran = data.hauteurEcran;
			}
			if (!(data.position_ecran_x > data.largeurEcran - 1 || data.position_ecran_x < 0)){ //largeur valide
				param.position_ecran_x = data.position_ecran_x;
			}
			if (!(data.position_ecran_y > data.hauteurEcran - 1 || data.position_ecran_y < 0)){ //largeur valide
				param.position_ecran_y = data.position_ecran_y;
			}
			
			controller.sauvParam(socket, globale.idPerso, param); //plus besoin de requete
		}
	}
}

/*
 * ajoute un message au tchat
 */
exports.addMessageTchat = function(socket, globale, data){	
	if (data.message != null){
		controller.traiteMessageTchat(socket, globale, data.message);
	}
}