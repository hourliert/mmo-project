/*
 * controller de gestion du site
 */


//var opMongoDB = require('../models/opMongoDB.js');
var opDB = require('../models/opDB');
var crypto = require('crypto');
	

/*
 * controller permettant d'envoyer la liste (noms) des persos d'un compte en JSON (ajax) pour la page de connexion
 * stocke par la même occasion l'id du compte en session
 */
exports.recupPerso = function(login, password, req, res){
	var shasum = crypto.createHash('sha1');
	
	shasum.update(password);
	var passSHA1 = shasum.digest('hex');

	opDB.listePerso(login, passSHA1, function(idCompte, liste, droitEditeur){
		if (idCompte == -1){ //compte introuvable
			res.json({erreur : 1});
		} else {
			if (liste != -1){ //perso sur le compte
				var aEnvoyer = {};
				var enSession = {};
				
				for (var i in liste){
					aEnvoyer[liste[i].idPerso] = liste[i].nom;
				}
				for (var i in liste){
					enSession[liste[i].idPerso] = liste[i];
				}
				
				//sauvegarde en session
				req.session.idCompte = idCompte;
				req.session.droitEditeur = droitEditeur;
				req.session.login = login;
				req.session.persos = enSession;
				req.session.save();
				
				res.json(aEnvoyer);
			} else { //aucun perso sur le compte
				req.session.idCompte = idCompte;
				req.session.droitEditeur = droitEditeur;
				req.session.login = login;
				req.session.save();
				
				res.json({vide : 1});
			}
		}

	});
};

/*
 * controller permettant de charger la page du jeu en fonction du perso du client select
 * stocke par la même occasion l'idPerso du client et l'idParam en session !
 */
exports.connexionIG = function(login, idPerso, req, res){		
	//on verifie simplement que la personne n'a pas changer de login, sinon on interrompt le procédé
	if (req.session.login != login){
		res.json({erreur : 1});
	} else {
		if(req.session.persos[idPerso]){ //si ce personnage est dans la listes des personnages du compte
			//ajout d'info en session
			req.session.idPerso = idPerso;
			req.session.hauteurEcran = req.session.persos[idPerso].hauteurEcran;
			req.session.largeurEcran = req.session.persos[idPerso].largeurEcran;
			req.session.position_ecran_x = req.session.persos[idPerso].position_ecran_x;
			req.session.position_ecran_y = req.session.persos[idPerso].position_ecran_y;
			req.session.save();
		
			res.render('jeu', {login : req.session.persos[idPerso].nom, droitEditeur : req.session.droitEditeur});
		} else {
			res.json({erreur : 1});
		}
	}
};

/*
 * check du login dispo
 */
exports.loginDispo = function(login, res){
	opDB.checkLogin(login, function(dispo){
		if (dispo){
			res.json({dispo : 1});
		} else {
			res.json({dispo : 0});
		}
	})
}

/*
 * check du email dispo
 */
exports.emailDispo = function(email, res){
	opDB.checkEmail(email, function(dispo){
		if (dispo){
			res.json({dispo : 1});
		} else {
			res.json({dispo : 0});
		}
	})
}

/*
 * check du nom dispo
 */
exports.nomDispo = function(nom, res){
	opDB.checkNom(nom, function(dispo){
		if (dispo){
			res.json({dispo : 1});
		} else {
			res.json({dispo : 0});
		}
	})
}

/*
 * ajoute un compte en DB
 */
exports.inscriptionCompte = function(login, email, password, res){
	opDB.ajouteCompte(login, email, password, function(){
		res.render('index', {login : login, password : password, creationPerso : null});
	});
}

/*
 * ajoute un perso en DB
 */
exports.creationPerso = function(nom, apparence, idCompte, req, res){
	var urlSprit = 'images/sprits/' + apparence;
	var nbAnimation = 4;
	var largeurSprit = 32;
	var hauteurSprit = 48;
	
	if (apparence == 'zelda.png'){
		nbAnimation = 3;
		largeurSprit = 50;
		hauteurSprit = 50;
	}
	
	opDB.ajoutePerso(nom, urlSprit, nbAnimation, largeurSprit, hauteurSprit, idCompte, function(idPerso){		
		
		req.session.idPerso = idPerso;
		if (req.session.persos == null){
			req.session.persos = {};
		}
		req.session.persos[idPerso] = {
			x : 0,
			y : 0,
			vitesse : 8,
			direction : 0,
			hauteurSprit : hauteurSprit,
			largeurSprit : largeurSprit,
			largeurEcran : 30,
			hauteurEcran : 17,
			connecte : 0,
			nom : nom,
			nbAnimation : nbAnimation,
			position_ecran_x : 15,
			position_ecran_y : 8,
			urlSprit : urlSprit
		};
		req.session.save();
		
		res.render('jeu', {'login' : nom, 'droitEditeur' : 0});
		
		//res.render('index', {login : null, password : null, creationPerso : true});
	});
}
