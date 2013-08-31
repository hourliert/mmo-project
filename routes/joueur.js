var controller = require('../controllers/joueur');

var OPCODE = {
	'MOVE_HAUT' : 3,
	'MOVE_BAS' : 0,
	'MOVE_GAUCHE' : 1,
	'MOVE_DROITE' : 2,
	'STOP' : -1,
	'MOVE_TO' : 4
}

var DIRECTION = {
	'HAUT' : 3,
	'BAS' : 0,
	'GAUCHE' : 1,
	'DROITE' : 2
};

/*
 * traite un OPCODE envoyé par le client
 */
exports.traiteOpCode = function(socket, globale, pOPJoueur){	
	if (pOPJoueur.idOP > globale.idOP){
		globale.idOP = pOPJoueur.idOP;
		
		globale.precision = 0.15; //precision du pathfinding (15% d'une case)
		
		if (globale.idPerso != pOPJoueur.idPerso){ // + condition sur les data recues à faire
			socket.emit('repAckOP', {'erreur' : 1});
		} else {
			switch (pOPJoueur.opCode){
				case OPCODE.MOVE_BAS : //déplacement clavier
				case OPCODE.MOVE_HAUT :
				case OPCODE.MOVE_GAUCHE :
				case OPCODE.MOVE_DROITE :	
					globale.tsServeur = new Date().getTime();
					globale.tsClient = pOPJoueur.ts;
					globale.direction = pOPJoueur.opCode;	
						
					if (!controller.detecteCollision(globale)){ //déplacement possible
						clearInterval(globale.timerClavier); //on reset les timer
						clearInterval(globale.timerSouris);
						clearInterval(globale.timerHB);
						
						socket.emit('repAckOP', {'ok' : 1}); //le joueur peut se déplacer
						socket.broadcast.emit('repOpJoueur', pOPJoueur); //on avertit les autres joueurs qu'il se déplace
						
						controller.simuleDeplacement(socket, globale, pOPJoueur); //on simule son déplacement
						
						//déclenchement du systeme d'heartbeat pour resynchro des clients
						globale.timerHB = setInterval(function(){
							var aEnvoyerHB = {};
							
							aEnvoyerHB.idPerso = pOPJoueur.idPerso;
							aEnvoyerHB.x = globale.x;
							aEnvoyerHB.y = globale.y;
							aEnvoyerHB.direction = globale.direction;
							aEnvoyerHB.idHB = globale.idHB;
							
							globale.idHB++;
							
							socket.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat au client
							socket.broadcast.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat aux autres client
							
						},500);
						
					} else {
						clearInterval(globale.timerClavier); //on reset les timer
						clearInterval(globale.timerSouris);
						clearInterval(globale.timerHB);
						
						socket.emit('repAckOP', {'collision' : 1}); //collision
					}
					break;
				case OPCODE.STOP : //fin de déplacement
					clearInterval(globale.timerClavier); //on reset les timer
					clearInterval(globale.timerSouris);
					clearInterval(globale.timerHB);
	
					socket.broadcast.emit('repOpJoueur', pOPJoueur); //on avertit les autres joueurs que le joueur s'arrete
					
					globale.tsServeur = new Date().getTime() - globale.tsServeur; //on calcul les TS client et serveur
					globale.tsClient= pOPJoueur.ts - globale.tsClient;
					
					var ecartTS = Math.abs(globale.tsServeur - globale.tsClient);
					var signEcart = (globale.tsClient < globale.tsServeur) ? -1 : 1;
					switch(globale.direction){ //CORRECTION (l'écart client PRIME)
						case DIRECTION.HAUT : 
							globale.y -= signEcart * ecartTS * globale.vitesse / 1000;
							break;
						case DIRECTION.BAS :
							globale.y += signEcart * ecartTS * globale.vitesse / 1000;
							break;
						case DIRECTION.GAUCHE : 
							globale.x -= signEcart * ecartTS * globale.vitesse / 1000;
							break;
						case DIRECTION.DROITE :
							globale.x += signEcart * ecartTS * globale.vitesse / 1000;
							break;
					}
					
					//fin de déplacement : on resynchronise les clients une dernière fois
					var aEnvoyerHB = {};
					aEnvoyerHB.idPerso = pOPJoueur.idPerso;
					aEnvoyerHB.x = globale.x;
					aEnvoyerHB.y = globale.y;
					aEnvoyerHB.direction = globale.direction;
					aEnvoyerHB.idHB = globale.idHB;
					aEnvoyerHB.HBfinal = true;
							
					globale.idHB++;
					
					socket.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat au client
					socket.broadcast.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat aux autres client
					
					controller.majPosition(globale);
					break; 
					
				case OPCODE.MOVE_TO :
					globale.tsServeur = new Date().getTime();
					globale.tsClient = pOPJoueur.ts;
				
					var precision = globale.precision;
					var destX = pOPJoueur.destX;
					var destY = pOPJoueur.destY;
				
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
				
					if (!controller.detecteCollision(globale)){ //déplacement possible
						clearInterval(globale.timerClavier); //on reset les timer
						clearInterval(globale.timerSouris);
						clearInterval(globale.timerHB);
						
						socket.emit('repAckOP', {'ok' : 1}); //le joueur peut se déplacer
						socket.broadcast.emit('repOpJoueur', pOPJoueur); //on avertit les autres joueurs qu'il se déplace
						
						controller.simuleDeplacementTo(socket, globale, pOPJoueur); //on simule son déplacement
						
						//déclenchement du systeme d'heartbeat pour resynchro des clients
						globale.timerHB = setInterval(function(){
							var aEnvoyerHB = {};
							
							aEnvoyerHB.idPerso = pOPJoueur.idPerso;
							aEnvoyerHB.x = globale.x;
							aEnvoyerHB.y = globale.y;
							aEnvoyerHB.direction = globale.direction;
							aEnvoyerHB.idHB = globale.idHB;
							
							globale.idHB++;
							
							socket.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat au client
							socket.broadcast.emit('repHeartBeat', aEnvoyerHB); //envoi du heartbeat aux autres client
							
						},500);
						
					} else {
						clearInterval(globale.timerClavier); //on reset les timer
						clearInterval(globale.timerSouris);
						clearInterval(globale.timerHB);
						
						socket.emit('repAckOP', {'collision' : 1}); //collision
					}
					break;
			}	
		}
	}
}