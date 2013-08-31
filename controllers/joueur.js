var opDB = require('../models/opDB.js');
var microtime = require('microtime');

var OPCODE = {
	'MOVE_HAUT' : 3,
	'MOVE_BAS' : 0,
	'MOVE_GAUCHE' : 1,
	'MOVE_DROITE' : 2,
	'STOP' : -1
}

var DIRECTION = {
	'HAUT' : 3,
	'BAS' : 0,
	'GAUCHE' : 1,
	'DROITE' : 2
};

function trunc(n){
	return Math.floor(n);
}

function frac(n) {
    return n - trunc(n);
}

/*
 * maj de la postion du joueur en DB
 */
exports.majPosition = function(globale){	
	if (globale.x != null || globale.y != null){
		var parametres = {};
		parametres.posX = parseInt(globale.x);
		parametres.posY = parseInt(globale.y);
		parametres.direction = parseInt(globale.direction);
		parametres.idPerso = globale.idPerso;
		
		
		if (!isNaN(parametres.posX) && !isNaN(parametres.posY)){
			opDB.updatePosition(parametres.posX, parametres.posY, parametres.direction, parametres.idPerso);
		} 
	}
}

/*
 * indique si le déplacement est possible (collision) ou non
 */
function detecteCollision(globale){	
	var posX = trunc(globale.x);
	var posY = trunc(globale.y);
	
	var direction = globale.direction;
	
	switch (direction){
		case DIRECTION.GAUCHE : 
			posX = trunc(globale.x - (globale.largeurSprit/(2*globale.largeurTuile)));
			posY = trunc(globale.y);
			break;
		case DIRECTION.DROITE :
			posX = trunc(globale.x + (globale.largeurSprit/(2*globale.largeurTuile)));
			posY = trunc(globale.y);
			break;
		case DIRECTION.HAUT :
			posX = trunc(globale.x);
			posY = trunc(globale.y - (globale.hauteurSprit/(2*globale.hauteurSprit)));
			break;
		case DIRECTION.BAS :
			posX = trunc(globale.x);
			posY = trunc(globale.y + (globale.hauteurSprit/(2*globale.hauteurSprit)));
			break;
	}
	
	var condition = (direction == DIRECTION.GAUCHE && typeof globale.globaleOS.grilleCollision[posX] !== 'undefined' && typeof globale.globaleOS.grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.DROITE && typeof globale.globaleOS.grilleCollision[posX] !== 'undefined' && typeof globale.globaleOS.grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.HAUT && typeof globale.globaleOS.grilleCollision[posX] !== 'undefined' && typeof globale.globaleOS.grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.BAS && typeof globale.globaleOS.grilleCollision[posX] !== 'undefined' && typeof globale.globaleOS.grilleCollision[posX][posY] !== 'undefined') ;
	
	return condition;
}

exports.detecteCollision = detecteCollision;

/*
 * simule le déplacement d'un joueur (clavier)
 */
exports.simuleDeplacement = function(socket, globale, OPJoueur){
	var vitesse = globale.vitesse/1000000; //et la vitesse
	
	var temp = microtime.now(); //temps de début traitement
	var tempEcoule = 0; //compensation de la latence client
	var tempSuivant = 0;	
	
	/*
	 * on met a jours la direction du personnages
	 */
	switch(OPJoueur.opCode){ //sauvegarde de la position précédente
		case OPCODE.MOVE_HAUT : 
			globale.direction = DIRECTION.HAUT;
			break;
		case OPCODE.MOVE_BAS :
			globale.direction = DIRECTION.BAS;
			break;
		case OPCODE.MOVE_GAUCHE : 
			globale.direction = DIRECTION.GAUCHE;
			break;
		case OPCODE.MOVE_DROITE :
			globale.direction = DIRECTION.DROITE;
			break;		
	}
	
	globale.timerClavier = setInterval(function(){
		tempSuivant = microtime.now();
		tempEcoule = tempSuivant - temp;
		
		if (!detecteCollision(globale)){
			switch(OPJoueur.opCode){
				case OPCODE.MOVE_HAUT : 
					globale.y -= vitesse * tempEcoule;
					globale.y.toFixed(3);
					break;
				case OPCODE.MOVE_BAS :
					globale.y += vitesse * tempEcoule;
					globale.y.toFixed(3);
					break;
				case OPCODE.MOVE_GAUCHE : 
					globale.x -= vitesse * tempEcoule;
					globale.x.toFixed(3);
					break;
				case OPCODE.MOVE_DROITE :
					globale.x += vitesse * tempEcoule;
					globale.x.toFixed(3);
					break;		
			}
		} else {			
			clearInterval(globale.timerClavier); //on reset les timer
			clearInterval(globale.timerSouris);
			clearInterval(globale.timerHB);
			
			socket.emit('repAckOP', {'collision' : 1}); //collision
		}
		
		temp = tempSuivant;
	},4);
};

/*
 * simule le déplacement d'un joueur (souris)
 */
exports.simuleDeplacementTo = function(socket, globale, OPJoueur){
	var vitesse = globale.vitesse/1000000; //et la vitesse

	var destX = OPJoueur.destX;
	var destY = OPJoueur.destY;
	
	var precision = globale.precision;
	
	var temp = microtime.now(); //temps de début traitement
	var tempEcoule = 0; //compensation de la latence client
	var tempSuivant = 0;
	
	if (globale.x +precision< destX){
		globale.direction = DIRECTION.DROITE;
		} else if (globale.x -precision > destX){
			globale.direction = DIRECTION.GAUCHE;
		} else {
			if (globale.y +precision< destY){
				globale.direction = DIRECTION.BAS;
			} else if (globale.y -precision> destY){
				globale.direction = DIRECTION.HAUT;
			}
	}

	globale.timerSouris = setInterval(function(){
		tempSuivant = microtime.now();
		tempEcoule = tempSuivant - temp;
		
		/*
		 * A améliorer (ce moteur de pathfinding doit être identique à celui du client)
		 */
		if (!detecteCollision(globale)){
			if (globale.x + precision< destX){
				globale.x += tempEcoule * vitesse;
				globale.direction = DIRECTION.DROITE;
				globale.x.toFixed(3);
			} else if (globale.x - precision > destX){
				globale.x -= tempEcoule * vitesse;
				globale.direction = DIRECTION.GAUCHE;
				globale.x.toFixed(3);
			} else {
				if (globale.y + precision< destY){
					globale.y += tempEcoule * vitesse;
					globale.direction = DIRECTION.BAS;
					globale.y.toFixed(3);
				} else if (globale.y - precision> destY){
					globale.y -= tempEcoule * vitesse;
					globale.direction = DIRECTION.HAUT;
					globale.y.toFixed(3);
				} else {
					//on est arrivé, le cleint aussi, en attente d'un OPSTOP
				}
			}
		} else {
			clearInterval(globale.timerClavier); //on reset les timer
			clearInterval(globale.timerSouris);
			clearInterval(globale.timerHB);
			
			socket.emit('repAckOP', {'collision' : 1}); //collision
		}
		
		temp = tempSuivant;
	},4);
};