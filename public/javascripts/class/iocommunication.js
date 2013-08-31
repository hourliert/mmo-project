/*
 * classe de gestion des sockets
 * (communications client serveur)
 */

function IOcommunication(){
	this.socketsOuverts = new Array();
}

/*
 * ouvre une socket avec le serveur et la stocke dans le tableau de sockets ouverts
 */
IOcommunication.prototype.ouvreSocket = function(){
	var socket = io.connect();
	this.socketsOuverts.push(socket);
}

/*
 * requête PING
 */
IOcommunication.prototype.reqPing = function(idPing){
	this.socketsOuverts[0].emit('reqPing', {'idPing' : idPing})
}

/*
 * reponse PONG
 */
IOcommunication.prototype.repPong = function(callback){
	this.socketsOuverts[0].on('repPong', function(data){
		callback(data);
	})
}

/*
 * requête PONGPING
 */
IOcommunication.prototype.repPingPong = function(idPing){
	this.socketsOuverts[0].emit('repPingPong', {'idPing' : idPing})
}

/*
 * indique au serveur que l'on est prêt à démarrer
 */
IOcommunication.prototype.reqInitEngine = function(){ //implémentée
	this.socketsOuverts[0].emit('reqInitEngine', {pret : 1});
}

/*
 * récupére la réponse du serveur concernant l'init
 */
IOcommunication.prototype.repInitEngine = function(traiteInit){ //implémentée
	this.socketsOuverts[0].on('repInitEngine', function(data){
		traiteInit(data);
	});
}

/*
 * demande au serveur la carte pour le client BG
 */
IOcommunication.prototype.reqCarte = function(idPerso, direction){ //implémentée
	this.socketsOuverts[0].emit('reqCarte',{ "idPerso" : idPerso,
		"direction" : direction
	});
}

/*
 * reponse du serveur BG
 */
IOcommunication.prototype.repCarte = function(traiteCarte){ //implémentée
	this.socketsOuverts[0].on('repCarte',function(data){
		traiteCarte(data);
	});
}

/*
 * reponse du serveur FG
 */
IOcommunication.prototype.repForeground = function(traiteCarte){ //implémentée
	this.socketsOuverts[0].on('repForeground',function(data){
		traiteCarte(data);
	});
}

/*
 * envoi la demande d'opération du client au serveur
 */
IOcommunication.prototype.reqOpJoueur = function(idOP, opCode, idPerso, parametres){ //implémentée
	var aEnvoyer = {};
	aEnvoyer.idOP = idOP;
	aEnvoyer.opCode = opCode;
	aEnvoyer.idPerso = idPerso;
	aEnvoyer.ts = new Date().getTime();

	if(typeof parametres !== 'undefined'){
		if (typeof parametres.destX !== 'undefined'){
			aEnvoyer.destX = parametres.destX;
		}
		if (typeof parametres.destY !== 'undefined'){
			aEnvoyer.destY = parametres.destY;
		}
	}
		
	this.socketsOuverts[0].emit('reqOpJoueur', aEnvoyer);
}

/*
 * reception d'un ack du serveu pour une op de déplacement
 */
IOcommunication.prototype.repAckOP = function(callback){ //implémentée
	this.socketsOuverts[0].on('repAckOP',function(data){
		callback(data);
	});
}

/*
 * récepetion d'un boadcast d'opération de déplacement
 */
IOcommunication.prototype.repOpJoueur = function(traiteJoueurs){
	this.socketsOuverts[0].on('repOpJoueur',function(data){
		traiteJoueurs(data);
	});
}

/*
 * heartbeat permettant al synchronisation des clients avec leur position réelles connu du serveur
 */
IOcommunication.prototype.repHeartBeat = function(callback){ //implémentée
	this.socketsOuverts[0].on('repHeartBeat',function(data){
		callback(data);
	});
}


/*
 * demande au serveur la liste des joueurs autour du joueur
 */
IOcommunication.prototype.reqJoueursAutour = function(idPerso, x, y){ //implémentée
	this.socketsOuverts[0].emit('reqJoueursAutour',{
		"idPerso" : idPerso,
		"x" : x, 
		"y" : y});
}

/*
 * traite la reception de la liste des joueurs
 */
IOcommunication.prototype.repJoueursAutour = function(traiteJoueurs){
	this.socketsOuverts[0].on('repJoueursAutour',function(data){
		traiteJoueurs(data);
	});
}

/*
 * demande au serveur la liste des joueurs autour du joueur
 */
IOcommunication.prototype.reqObjetsAutour = function(idPerso, x, y){ //implémentée
	this.socketsOuverts[0].emit('reqObjetsAutour',{
		"idPerso" : idPerso,
		"x" : x, 
		"y" : y});
}

/*
 * traite la reception de la liste des joueurs
 */
IOcommunication.prototype.repObjetsAutour = function(traiteObjets){
	this.socketsOuverts[0].on('repObjetsAutour',function(data){
		traiteObjets(data);
	});
}

/*
 * envoie le terrain actuel pour être sauvegader en DB
 */
IOcommunication.prototype.reqSauvMapDB = function(idPerso, terrain, terrainFG){
	var aEnvoyer = {};

	aEnvoyer.idPerso = idPerso;	
	if (terrain != null && !isEmpty(terrain)){
		aEnvoyer.terrain = terrain;
	}
	if (terrainFG != null && !isEmpty(terrainFG)){
		aEnvoyer.terrainFG = terrainFG;
	}
	
	this.socketsOuverts[0].emit('reqSauvMapDB',aEnvoyer);
}

/*
 * réponse a la sauvegarde de la map dans l'éditeur
 */
IOcommunication.prototype.repSauvMapDB = function(traiteSauvDB){
	this.socketsOuverts[0].on('repSauvMapDB',function(data){
		traiteSauvDB(data);
	});
}

/*
 * demande au serveur la carte pour le client EDITEUR
 */
IOcommunication.prototype.reqCarteEditeur = function(idPerso, direction){ //implémentée
	this.socketsOuverts[0].emit('reqCarteEditeur',{ "idPerso" : idPerso,
		"direction" : direction
	});
}

/*
 * demande au serveur la carte pour le client EDITEUR
 */
IOcommunication.prototype.repCarteEditeur = function(traiteCarte){ //implémentée
	this.socketsOuverts[0].on('repCarteEditeur',function(data){
		traiteCarte(data);
	});
}

/*
 * demande au serveur la carte pour le client EDITEUR
 */
IOcommunication.prototype.repFGEditeur = function(traiteCarte){ //implémentée
	this.socketsOuverts[0].on('repFGEditeur',function(data){
		traiteCarte(data);
	});
}

/*
 * sauvegarde les paramètres rentrés par l'user
 */
IOcommunication.prototype.reqSauvParam = function(idPerso, largeur, hauteur, position_ecran_x, position_ecran_y){ //implémentée
	this.socketsOuverts[0].emit('reqSauvParam',{ 
		"idPerso" : idPerso,
		"largeurEcran" : largeur,
		"hauteurEcran" : hauteur,
		'position_ecran_x' : position_ecran_x,
		'position_ecran_y' : position_ecran_y
	});
}

/*
 * TCHAT
 */
IOcommunication.prototype.reqEnvoiMsgTchat = function(message){ //implémentée
	this.socketsOuverts[0].emit('reqEnvoiMsgTchat',{ 
		"message" : message
	});
}

IOcommunication.prototype.repMshTchat = function(callback){ //implémentée
	this.socketsOuverts[0].on('repMshTchat',function(data){
		callback(data.message);
	});
}





