/*
 * en POST connexion
 */


var controller = require('../controllers/site');

/*
 * permet de récuperer la liste des personnages associées au compte pour la premiere phase de connexion
 */
exports.recupPerso = function(req, res){
	if (req.body.login != null && req.body.password != null){
		var login = req.body.login,
			password = req.body.password;
			
		controller.recupPerso(login, password, req, res);
	}
}

/*
 * deuxieme phase de connexion, on se connecte avec le perso et le compte
 */
exports.connexionIG = function(req, res){	
	if (req.body.login != null && req.body.password != null && req.body.idPerso != null){
		var login = req.body.login,
			idPerso = req.body.idPerso;

		controller.connexionIG(login, idPerso, req, res);
	}
}

/*
 * check dispo login
 */
exports.loginDispo = function(req, res){	
	if (req.body.login != null){
		var login = req.body.login;
		
		controller.loginDispo(login, res);	
	}
}

/*
 * check dispo email
 */
exports.emailDispo = function(req, res){	
	if (req.body.email != null){
		var email = req.body.email;
		
		controller.emailDispo(email, res);	
	}
}

/*
 * check dispo nom
 */
exports.nomDispo = function(req, res){	
	if (req.body.nom != null){
		var nom = req.body.nom;
		
		controller.nomDispo(nom, res);	
	}
}

/*
 * inscription d'un compte
 */
exports.inscriptionCompte = function(req, res){	
	if (req.body.login != null && req.body.email != null && req.body.password != null){
		var email = req.body.email;
		var login = req.body.login;
		var password = req.body.password;
		
		controller.inscriptionCompte(login, email, password, res);
	}
}

/*
 * ajout d'un perso
 */
exports.creationPerso = function(req, res){		
	if (req.body.nom != null && req.body.apparence != null){
		var nom = req.body.nom;
		var apparence = req.body.apparence;
		var idCompte = req.session.idCompte;
		
		controller.creationPerso(nom, apparence,idCompte, req, res);
	}
}