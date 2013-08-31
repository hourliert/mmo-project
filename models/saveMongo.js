//controlle site.js

	/*opMongoDB.listePerso(login, passSHA1, function(retour){
		if (!retour.erreur){
			req.session.idCompte = retour.idCompte; //on sauvegarde en session l'id du compte
			req.session.idParam = retour.idParam; //et l'id du parametres perso associé
			req.session.save();
			
			var aEnvoyer = {};
			for (var i in retour){ //on retourne la liste des persos du compte avec leur nom
				if (i !== 'idCompte' && i !== 'idParam'){
					aEnvoyer[i] = retour[i];
				}
			}
			
			res.json(aEnvoyer);
		} else {
			res.json({erreur : 1});
		}
	});*/

//controller sites

	/*var shasum = crypto.createHash('sha1');
	
	shasum.update(password);
	var passSHA1 = shasum.digest('hex');
		
	opMongoDB.connexionPerso(login, passSHA1, idPerso, function(retour){	
		if (!retour.erreur){
			var nomPerso = null;
			for (var i in retour){ //qu'un seul element
				req.session.idPerso = i; //on sauvegarde en session l'id du perso
				req.session.save();
				
				nomPerso = retour[i];
			}
			
			res.render('jeu', {login : nomPerso}); //on chage la page de jeu
		} else {
			res.json({erreur : 1});
		}
	});*/

//controller init.js

	//on récupère la liste des parametres globaux, perso et les infos du personnage et on les envoi au client
	/*opMongoDB.listeParamInit(globale, function(retour){
		//le controller s'occupe de mettre la réponse en forme à partir de l'objet retour
		var aEnvoyer = {};
		if (!retour.erreur){
			aEnvoyer.nom = retour.personnage.nom;
			aEnvoyer.vitesse = retour.personnage.vitesse;
			aEnvoyer.x = retour.personnage.x;
			aEnvoyer.y = retour.personnage.y;
			aEnvoyer.direction = retour.personnage.direction;
			aEnvoyer.urlSprit = retour.personnage.urlSprit;
			aEnvoyer.nbAnimation = retour.personnage.nbAnimation;
			aEnvoyer.hauteurSprit = retour.personnage.hauteurSprit;
			aEnvoyer.largeurSprit = retour.personnage.largeurSprit;
			aEnvoyer.connecte = retour.personnage.connecte;
			
			aEnvoyer.position_ecran_y = retour.paramPerso.position_ecran_y;
			aEnvoyer.position_ecran_x = retour.paramPerso.position_ecran_x;
			aEnvoyer.hauteurEcran = retour.paramPerso.hauteurEcran;
			aEnvoyer.largeurEcran = retour.paramPerso.largeurEcran;
			
			for (var i in retour){
				if (i != 'personnage' && i != 'paramPerso' && i != '_id'){
					aEnvoyer[i] = retour[i];
				}
			}
			
			aEnvoyer.idPerso = retour.personnage._id;
			
			socket.emit('repInitEngine', aEnvoyer);
			
		} else {
			socket.emit('repInitEngine', {erreur : 1});
		}	
	});*/



/*
 * declaration des Schemas et modeles de la mongoDB
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
	
var compteSchema = new Schema({
	login : String,
	password : String,
	email : String,
	personnages : [{ type: Schema.Types.ObjectId, ref: 'Personnage' }],
	parametres : { type: Schema.Types.ObjectId, ref: 'ParametrePerso' }
});
compteSchema.index({login : 1}, {unique : true});
compteSchema.index({email : 1}, {unique : true});

var personnageSchema = new Schema({
	nom : String,
	x : Number, 
	y : Number,
	vitesse : Number,
	direction : Number,
	urlSprit : String,
	nbAnimation : Number,
	hauteurSprit : Number,
	largeurSprit : Number,
	connecte : Boolean,
	zone : { type: Schema.Types.ObjectId, ref: 'Zone' },
	compte : { type: Schema.Types.ObjectId, ref: 'Compte' }
});
personnageSchema.index({nom : 1}, {unique : true});

var parametreSchema = new Schema({
	nom : String,
	valeur : String
});
parametreSchema.index({nom : 1}, {unique : true});

var parametrePersoSchema = new Schema({
	largeurEcran : Number,
	hauteurEcran : Number,
	position_ecran_x : Number,
	position_ecran_y : Number
});

var celluleSchema = new Schema({
	x : Number,
	y : Number,
	tuile : Number,
	zone : { type: Schema.Types.ObjectId, ref: 'Zone' }
});
celluleSchema.index({x : 1, y : 1}, {unique : true}); //index composé sur les coordonnees (impossible d'avoir 2 fois les mêmes)

var zoneSchema = new Schema({
	nom : String,
	zone : Number,
	xtop : Number,
	ytop : Number,
	largeur : Number,
	hauteur : Number
});
zoneSchema.index({nom : 1}, {unique : true});
zoneSchema.index({zone : 1}, {unique : true});

mongoose.model('Compte', compteSchema);
mongoose.model('Personnage', personnageSchema);
mongoose.model('Parametre', parametreSchema);
mongoose.model('ParametrePerso', parametrePersoSchema);
mongoose.model('Cellule', celluleSchema);
mongoose.model('Zone', zoneSchema);


/*
 * Connexion a la mongoDB
 */

var mongoose = require('mongoose');

var uri = "mongodb://localhost/mmo";
var option = { //option de connexion à la DB
	
};

exports.connectDB = function(){
	mongoose.connect(uri, option, function(err){
		if (err) throw err;
		console.log("Connected to the Mongo DataBase");
	});
};

/*
 * gestion de requête pour MongoDB
 */

var mongoose = require('mongoose');
var async = require('async');

/*
 * models
 */
var Parametre = mongoose.model('Parametre');
var Personnage = mongoose.model('Personnage');
var Compte = mongoose.model('Compte');
var Cellule = mongoose.model('Cellule');
var Zone = mongoose.model('Zone');
var ParametrePerso = mongoose.model('ParametrePerso');


/*
 * retourne la liste des personnages et l'idCompte du joueur
 */
exports.listePerso = function(login, passSHA1, callback){
	var retourCB = {};

	//on cherche le compte en DB du joueur et on select son id, ses persos	
	Compte.findOne({login : login, password : passSHA1}, '_id personnages parametres',function(err, compte){
		if (compte){
			if(err) throw err;
			//on stocke l'id du compte
			retourCB.idCompte = compte._id;
			retourCB.idParam = compte.parametres;
			
			//pour chaque perso, on recup le nom
			async.forEach(compte.personnages, function(idPerso, next){
				//on recheche en DB les perso associés
				Personnage.findOne({_id : idPerso},'nom', function(err, perso){
					if (perso){
						//on stocke leur nom pa exemple
						retourCB[perso._id] = perso.nom;
					}
					next(null);
				});
			}, function(err){ //et on appelle le callback de la fonction
				if (err) throw err;
				callback(retourCB);
			});
		} else {
			retourCB.erreur = 1;
			callback(retourCB);
		}
	});
}

/*
 * vérifie que le perso est bien en DB et que les log n'ont pas changé au cas où
 */
exports.connexionPerso = function(login, passSHA1, idPerso, callback){
	var retourCB = {};
	
	//on cherche le compte en DB du joueur et on select son id, ses persos	
	Compte.findOne({login : login, password : passSHA1}, '_id personnages',function(err, compte){
		if(err) throw err;
		if (compte){
			//le perso demandé par le joueur est bien rataché à ce compte
			if (compte.personnages.indexOf(idPerso) != -1){
				
				//on recupere des infos sur le perso en DB
				Personnage.findOne({_id : idPerso},'nom', function(err, perso){
					if(err) throw err;
					if (perso){
						retourCB[perso._id] = perso.nom;
						callback(retourCB);
					} else {
						retourCB.erreur = 1;
						callback(retourCB);
					}
				});
			} else {
				retourCB.erreur = 1;
				callback(retourCB);
			}
		} else {
			retourCB.erreur = 1;
			callback(retourCB);
		}
	});
}

/*
 * retourne la liste des paramètres (globaux + perso)
 */

exports.listeParamInit = function(globale, callback){
	var retourCB = {};
	
	var idParam = globale.idParam;
	var idPerso = globale.idPerso;
	
	// execution en parallele des 3 requêtes d'init (pas de jointure possible avec MONGO !!! /!\)
	async.parallel([function(next){ //recup parametre globaux
			Parametre.find(function(err, parametres){
				if(parametres){
					for (var i in parametres){
						retourCB[parametres[i].nom] = parametres[i].valeur;
					}	
				} else {
					retourCB.erreur = 1;
				}
				next(null);
			})
	}, function(next){	//parametre perso
			ParametrePerso.findOne({_id : idParam}, 'position_ecran_y position_ecran_x hauteurEcran largeurEcran', function(err, parametresPerso){
					if (parametresPerso){
						retourCB.paramPerso = parametresPerso;
					} else {
						retourCB.erreur = 1;
					}
					next(null);
			})
	}, function(next){	//info perso
			Personnage.findOne({_id : idPerso}, 'nom x y vitesse direction urlSprit	nbAnimation	hauteurSprit largeurSprit connecte', function(err, personnage){
				if (personnage){
					retourCB.personnage = personnage;
				} else {
					retourCB.erreur = 1;
				}
				next(null);
			});
	}], function(err, results){
		if (err) throw err;	
		//et on appel le callback pour que le controller traite les données !
		callback(retourCB);
	});
}

/*
 * retourne la map à envoyer au client en fonction des parametres
 */

exports.recupMap = function(posX, posY, marge, callback){
	var minX = -50;
	var maxX = 50;
	var minY = -50;
	var maxY = 50;
	
	var temps = new Date().getTime();
	var query = Cellule.find().where('x').gt(minX).lt(maxX).where('y').gt(minY).lt(maxY).select('x y tuile').exec(function(err, data){
		
		console.log( new Date().getTime() - temps);
	});
	
}

/*var Parametre = mongoose.model('Parametre');
var Personnage = mongoose.model('Personnage');
var Compte = mongoose.model('Compte');
var Cellule = mongoose.model('Cellule');
var Zone = mongoose.model('Zone');
var ParametrePerso = mongoose.model('ParametrePerso');*/

/*Parametre.find().remove();
Personnage.find().remove();
Compte.find().remove();
ParametrePerso.find().remove();
Cellule.find().remove();
Zone.find().remove();*/

/*var param = new Parametre();
param.nom = "hauteurTuile";
param.valeur = 32;
param.save();*/

/*var paramPerso = new ParametrePerso();
paramPerso.largeurEcran = 30;
paramPerso.hauteurEcran = 17;
paramPerso.position_ecran_x = 15;
paramPerso.position_ecran_y = 8;*/


/*ParametrePerso.find(function(err, doc){
	var idParam = doc[0]._id;
	
	Zone.find(function(err,doc){
		var zone = doc[0]._id;
		
		var perso = new Personnage();
		perso.nom = "Test",
		perso.x = 2; 
		perso.y = 2;
		perso.vitesse = 10;
		perso.direction = 0;
		perso.urlSprit = "images/sprits/perso.png";
		perso.nbAnimation = 4;
		perso.hauteurSprit = 32;
		perso.largeurSprit = 32;
		perso.connecte = false;
		perso.zone = zone;
		
		perso.save(function(){
			var idPerso = perso._id;
		
			console.log(idParam +" " + idPerso);
			
			var compte = new Compte();
			compte.login = "test";
			compte.password = "1";
			compte.email = "test@gmail.com";
			compte.personnages = idPerso;
			compte.parametres = idParam;
			compte.save();
		});
	})
});*/



//PEUPLEMENT DB RANDOM
  
/*var zone = new Zone();

zone.nom = "Developpement";
zone.zone = 1;
zone.xtop = -100;
zone.ytop = -100;
zone.largeur = 200;
zone.hauteur = 200;

zone.save(function(){
	var idZone = zone._id;
	console.log(idZone);

	for (var i = -100; i < 100; i++){
		for (var j = -100; j < 100; j++){
			var cellule = new Cellule();
			cellule.x = i;
			cellule.y = j;
			cellule.tuile = Math.floor((Math.random()*11));
			cellule.zone = idZone;
			cellule.save();
			
			delete cellule;
		}
	}
});*/

/*
 * UPDATEEEE
 * 
 * 
 */

/*var Compte = mongoose.model('Compte');
var Personnage = mongoose.model('Personnage');

Compte.findOne({login : 'test'}, '_id personnages',function(err, compte){
	var idCompte = compte._id;
	//console.log(compte.personnages[0]);
	
	Personnage.find({_id : compte.personnages[0]}, function(err, perso){
		console.log(perso);
	});
	
	Personnage.update({_id : compte.personnages[0]}, {$set : {compte : idCompte}},function(){
		console.log('Update effectué');
	});
});*/