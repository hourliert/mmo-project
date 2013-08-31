/*
 * fonction du controler
 */

var opDB = require('../models/opDB');

var DIRECTION = {
	'STOP' : -1,
	'HAUT' : 3,
	'BAS' : 0,
	'GAUCHE' : 1,
	'DROITE' : 2
};

var TERRAIN = {
	'BG' : 0,
	'FG' : 1
};


/*
 * ajoute en cache les info de la carte récement récupérés
 * a voir pour mettre ça de manière asynchrone
 */
function ajouteMapCache(globaleOS, donnees, bgfg){
	var zoneD = donnees.zone,
		terrainD = donnees.terrain;
	
	switch (bgfg){
		case TERRAIN.BG : //bg
			if (!globaleOS.terrain[zoneD.idZone]){ //si la zone n'est pas encore dans le cache
				globaleOS.terrain[zoneD.idZone] = {};
				var terrain = globaleOS.terrain[zoneD.idZone];
				
				for (var i in terrainD){
					(function(i){
						setTimeout(function(){
							for (var j in terrainD[i]){
								//(function(j){
									if (!terrain[i]){
										terrain[i] = {};
									}
									if (!terrain[i][j]){
										terrain[i][j] = {};
									}
									
									terrain[i][j] = terrainD[i][j];
								//})(j);
							}
						},0);
					})(i);
				}		
			}
			break;
			
		case TERRAIN.FG : //fg
			if (!globaleOS.terrainFG[zoneD.idZone]){ //si la zone n'est pas encore dans le cache
				globaleOS.terrainFG[zoneD.idZone] = {};
				var terrainFG = globaleOS.terrainFG[zoneD.idZone];
				
				for (var i in terrainD){
					(function(i){
						setTimeout(function(){
							for (var j in terrainD[i]){
								//(function(j){
									if (!terrainFG[i]){
										terrainFG[i] = {};
									}
									if (!terrainFG[i][j]){
										terrainFG[i][j] = {};
									}
									
									terrainFG[i][j] = terrainD[i][j];
								//})(j);
							}
						},0);
					})(i);
				}			
			}
			break;
	}

}

/*
 * fonction complétant la grille de collision
 */
function completeCollision(globaleOS, terrain){
	for(var i in terrain){
		(function(i){
			setTimeout(function(){
				for (var j in terrain[i]){
					//(function(j){
						if (terrain[i][j][1] != null && terrain[i][j][1] == 1){
							if (!globaleOS.grilleCollision[i]){
								globaleOS.grilleCollision[i]={};	
							}
							globaleOS.grilleCollision[i][j] = 1;
						}
					//})(j);
				}
			},0);
		})(i);
	}
}

/*
 * controller permettant de génerer et envoyer la portion de map au client
 */
exports.envoyerMap = function(socket, globale, direction){
	var aEnvoyer = {};
	var aEnvoyerFG = {};
	var terrain = {};
	var terrainFG = {};
	var temp = null;
	var tempFG = null;
	var marge = 30;
	
	var xRecup = globale.x,
		yRecup = globale.y;
		
	if (direction != DIRECTION.STOP){
		switch(direction){
			case DIRECTION.GAUCHE : 
				xRecup -= marge;
				break;
			case DIRECTION.DROITE :
				xRecup += marge;
				break;
			case DIRECTION.HAUT :
				yRecup -= marge;
				break;
			case DIRECTION.BAS :
				yRecup += marge;
				break;
		}
	}
	xRecup = Math.floor(xRecup);
	yRecup = Math.floor(yRecup);
	
	opDB.recupIdZone(xRecup, yRecup, function(idZone){
		opDB.recupInfoZone(idZone, function(zone){
			
			aEnvoyer.zone = zone;
			aEnvoyerFG.zone = zone;
			
			//on recheche en cache les info demandé, si elles sont présentes, on les envoie, sinon on faire la requête en DB
			if(globale.globaleOS.terrain[idZone]){
				aEnvoyer.terrain = globale.globaleOS.terrain[idZone];
				
				socket.emit('repCarte', aEnvoyer);
			} else {
				opDB.recupMap(idZone, function(data){
					if (data != -1){
						for (var i  in data){ //pour chaque objet récupéré
							temp = data[i];
							
							if (!terrain[temp.x]){
								terrain[temp.x] = new Object();
							}
							terrain[temp.x][temp.y] = new Object();
							terrain[temp.x][temp.y][0] = temp.tile;
							terrain[temp.x][temp.y][1] = temp.collision;
						}
						
						aEnvoyer.terrain = terrain;
						
						socket.emit('repCarte',aEnvoyer);
						
						//on affecte en cache les données recupéré
						ajouteMapCache(globale.globaleOS, aEnvoyer, TERRAIN.BG);
						
						//on affecte ici la grille de collision
						completeCollision(globale.globaleOS, terrain);
					} else {
						socket.emit('repCarte', {erreur : 1});
					}
				});
			}
			if(globale.globaleOS.terrainFG[idZone]){
			
				aEnvoyerFG.terrain = globale.globaleOS.terrainFG[idZone];
				
				socket.emit('repForeground', aEnvoyerFG);
			} else {
				opDB.recupFG(idZone, function(data){
					if (data != -1){
						for (var i  in data){ //pour chaque objet récupéré
							tempFG = data[i];
							
							if (!terrainFG[tempFG.x]){
								terrainFG[tempFG.x] = new Object();
							}
							terrainFG[tempFG.x][tempFG.y] = new Object();
							terrainFG[tempFG.x][tempFG.y][0] = tempFG.tile;
							terrainFG[tempFG.x][tempFG.y][1] = tempFG.fore;
						}
						
						aEnvoyerFG.terrain = terrainFG;
						
						socket.emit('repForeground', aEnvoyerFG);
						
						//on affecte en cache les données recupéré
						ajouteMapCache(globale.globaleOS, aEnvoyerFG, TERRAIN.FG);
					} else {
						socket.emit('repForeground', {erreur : 1});
					}
				});
			}
		});
	});
};

/*
 * controller permettant de génerer et envoyer la portion de map au client
 */
exports.envoyerMapEditeur = function(socket, globale, direction){	
	var aEnvoyer = {};
	var aEnvoyerFG = {};
	var terrain = {};
	var terrainFG = {};
	var temp = null;
	var tempFG = null;
	var marge = 30;
	
	var xRecup = globale.x,
		yRecup = globale.y;
	
	xRecup = Math.floor(xRecup);
	yRecup = Math.floor(yRecup);
	
	opDB.recupIdZone(xRecup, yRecup, function(idZone){
		opDB.recupInfoZone(idZone, function(zone){
			
			aEnvoyer.zone = zone;
			aEnvoyerFG.zone = zone;
			
			//on recheche en cache les info demandé, si elles sont présentes, on les envoie, sinon on faire la requête en DB
			if(globale.globaleOS.terrain[idZone]){
				aEnvoyer.terrain = globale.globaleOS.terrain[idZone];
				
				socket.emit('repCarteEditeur', aEnvoyer);
			} else {
				opDB.recupMap(idZone, function(data){
					if (data != -1){
						for (var i  in data){ //pour chaque objet récupéré
							temp = data[i];
							
							if (!terrain[temp.x]){
								terrain[temp.x] = new Object();
							}
							terrain[temp.x][temp.y] = new Object();
							terrain[temp.x][temp.y][0] = temp.tile;
							terrain[temp.x][temp.y][1] = temp.collision;
						}
						
						aEnvoyer.terrain = terrain;
						
						socket.emit('repCarteEditeur',aEnvoyer);
						
						//on affecte en cache les données recupéré
						ajouteMapCache(globale.globaleOS, aEnvoyer, TERRAIN.BG);
						
						//on affecte ici la grille de collision
						completeCollision(globale.globaleOS, terrain);
					} else {
						socket.emit('repCarteEditeur', {erreur : 1});
					}
				});
			}
			if(globale.globaleOS.terrainFG[idZone]){
			
				aEnvoyerFG.terrain = globale.globaleOS.terrainFG[idZone];
				
				socket.emit('repFGEditeur', aEnvoyerFG);
			} else {
				opDB.recupFG(idZone, function(data){
					if (data != -1){
						for (var i  in data){ //pour chaque objet récupéré
							tempFG = data[i];
							
							if (!terrainFG[tempFG.x]){
								terrainFG[tempFG.x] = new Object();
							}
							terrainFG[tempFG.x][tempFG.y] = new Object();
							terrainFG[tempFG.x][tempFG.y][0] = tempFG.tile;
							terrainFG[tempFG.x][tempFG.y][1] = tempFG.fore;
						}
						
						aEnvoyerFG.terrain = terrainFG;
						
						socket.emit('repFGEditeur', aEnvoyerFG);
						
						//on affecte en cache les données recupéré
						ajouteMapCache(globale.globaleOS, aEnvoyerFG, TERRAIN.FG);
					} else {
						socket.emit('repFGEditeur', {erreur : 1});
					}
				});
			}
		});
	});
};

/*
 * sauvegarde la map recu en DB
 */
exports.sauvMapDB = function(socket, globale, terrains){
	if (terrains.terrain != null){
		opDB.sauvMapDB(terrains.terrain, function(){
			socket.emit('repSauvMapDB',{ok : 1});
		});
	}
	if (terrains.terrainFG != null){
		opDB.sauvFGDB(terrains.terrainFG, function(){
			socket.emit('repSauvMapDB',{ok : 1});
		});
	}
}