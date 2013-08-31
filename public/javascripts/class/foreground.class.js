/*
 * classe Foreground (gestion de l'affichage du FG + objets dyn)
 * par défaut map de 20 tuiles x 15 tuiles (de 32 pixels^2)
 */

function Foreground(monMmo){
	var foreground = this;
	
	this.mmo = monMmo;
	
	this.ioCom = monMmo.ioCom;
	
	this.ctx_objets = monMmo.ctx_objets;
	//this.ctx_joueurs = monMmo.ctx_joueurs;

	this.grilleCollision = monMmo.grilleCollision;
	this.grilleFore = monMmo.grilleFore;

	this.largeurEcran = monMmo.init.largeurEcran;
	this.hauteurEcran = monMmo.init.hauteurEcran;

	this.largeurTuile = monMmo.init.largeurTuile;
	this.hauteurTuile = monMmo.init.hauteurTuile;
	
	this.tilesetFG = new Tileset(monMmo.init.urlForeground, this.largeurTuile, this.hauteurTuile,function(){
		avancementChargement(ELEMENT.FG_TILESET);
	});
	
	this.needRefresh = true; //a true : le BACKGROUND est refresh, a false, non (légère optimisation)
	this.pret = false;
	this.premiereRep = true;
	this.reqEnvoyee = false;
	
	this.terrainFG = {}; //terrain
	this.joueur = null; //init dans setJoueur
	this.objets = {};
	this.personnages = {};
	
	//a la reception du foreground
	this.ioCom.repForeground(function(data){
		if (data.erreur){
			console.log('erreur repFG');
			setTimeout(function(){
				foreground.reqEnvoyee = false;
			},200);
		} else if (data.bordure){
		 	console.log('bordure');
		 	setTimeout(function(){
				foreground.reqEnvoyee = false;
			},200);
		} else {
			foreground.setCache(data);
			foreground.setGrilleFore(data);
			
			foreground.pret = true;
			foreground.reqEnvoyee = false;
		}
		
		if (foreground.premiereRep){
			avancementChargement(ELEMENT.FG_REP);
			foreground.premiereRep = false;
		}
	});
}

/*
 * set la grille de collision avec la zone reçue ASYNCHONOUS
 */
Foreground.prototype.setGrilleFore = function(dataRecu){
	var	terrainD = dataRecu.terrain,
		foreground = this;	
	
	for (var i in terrainD){
		(function(i){
			setTimeout(function(){
				for (var j in terrainD[i]){
					//(function(j){ //petite closure qui va bien
						if (terrainD[i][j][1] != null && terrainD[i][j][1] == STAT.FORE){
							if (!foreground.grilleFore[i]){
								foreground.grilleFore[i]={};	
							}
							foreground.grilleFore[i][j] = STAT.FORE;
						}
					//})(j);
				}
			},0);
		})(i);
	}
}

/*
 * Met à jours le cache du terrain client ASYNCHONOUS
 */
Foreground.prototype.setCache = function(dataRecu){
	var zonesD = dataRecu.zone,
		terrainD = dataRecu.terrain,
		foreground = this;	
	
	if (zonesD.globale){ //le serveur nous envoie une zone globale
		for(var i in terrainD){ //sans async
			(function(i){
				setTimeout(function(){
					for (var j in terrainD[i]){
						//(function(j){
							if (!foreground.terrainFG[i]){
								foreground.terrainFG[i] = {};
								foreground.terrainFG[i][j] = {};
							}
							if (!foreground.terrainFG[i][j]){
								foreground.terrainFG[i][j] = {};
							}
							
							foreground.terrainFG[i][j] = terrainD[i][j][0];
						//})(j);
					}
				},0);
			})(i);
		}
	} else { //cas des batiments
		
	}
}

/*
 * défini le joueur sur la map
 */
Foreground.prototype.setJoueur = function(perso){
	this.joueur = perso;
	
	//on récupère la carte
	this.ioCom.reqCarte(perso.idPerso, DIRECTION.STOP);
	this.reqEnvoyee = true;
}

/*
 * ajoute un personnage à l'écran
 */
Foreground.prototype.addPerso = function(perso){
	this.personnages[perso.idPerso] = perso;
}

/*
 * retire un personnage à l'écran
 */
Foreground.prototype.delPerso = function(perso){
	delete this.personnages[perso]; //on libere la mémoire du perso occupé
}

/*
 * la carte est elle prête a etre exploitée ?
 */
Foreground.prototype.ready = function(){
	return this.pret;
}

/*
 * ajoute un objet à l'écran
 */
Foreground.prototype.addObjet = function(objet){
	this.objets[objet.idObjet] = objet;
}

/*
 * retire un objet à l'écran
 */
Foreground.prototype.delObjet = function(objet){
	delete this.objets[objet]; //on libere la mémoie de l'objet occupé
}

/*
 * dessine la MAP (background uniquement géré ici, les perso, objets, etc 
 * 	sont gérés dans les fonctions spécifiques à leur classe) 
 */
Foreground.prototype.drawMap = function(){		
	if (this.pret && this.tilesetFG.pret){
		//variables de boucles
		var x = 0, 
			y = 0,
			l = this.largeurEcran,
			h = this.hauteurEcran,
			lTuile = this.largeurTuile,
			hTuile = this.hauteurTuile,
			position_ecran_x = this.joueur.position_ecran_x,
			position_ecran_y = this.joueur.position_ecran_y;
		//donnée JSON interprétées
		var ligne = null, //contient la ligne (JSON) en cours d'affichage
			cellule = null, //contient la cellule (JSON) en cours d'affichage
			numTuile = null; //numero de la tuile
	
		var persoDraw = false;
	
		//le joueur
		var joueur = this.joueur;
		
		//calcul des posisitions des autres joueurs
		for (var k in this.personnages){	
			this.personnages[k].calculDeplacement(this.grilleCollision);
			this.personnages[k].persoDraw = false;
		}
		
		
		var positionY = trunc(joueur.y), //position Y du joueur (permet de récupérer les tuiles)
			positionX = trunc(joueur.x), //position X du joueur
			//positions
			decallageX = frac(joueur.x), //décallage X lors d'une animation (position du joueur) (pour effet de translation fluide)
			decallageY = frac(joueur.y); //décallage Y lors d'une animation (position du joueur)
		
		this.ctx_objets.clearRect ( 0 , 0 , l*lTuile ,h*hTuile );
			
		
		/*if(this.grilleFore[positionX] && this.grilleFore[positionX][positionY] && this.grilleFore[positionX][positionY-1]){
			joueur.drawPerso(this.ctx_objets);	
			persoDraw = true;
		}	*/
		//il faut tester en faite tt les cases au dessus du perso suivant la hauteur de la sprit du perso
		if(this.grilleFore[positionX] && this.grilleFore[positionX][positionY-1]){
			joueur.drawPerso(this.ctx_objets);	
			persoDraw = true;
		}
		
		for (var k in this.personnages){	
			var positionYperso = trunc(this.personnages[k].y), //position Y du perso
				positionXperso = trunc(this.personnages[k].x); //position X du perso
			
			if(this.grilleFore[positionXperso] && this.grilleFore[positionXperso][positionYperso]){
				this.personnages[k].drawPerso(this.ctx_objets, joueur.x, joueur.y);
				this.personnages[k].persoDraw = true;
			}
		}
		
				
		if (/*this.needRefresh*/ 1 || joueur.enDeplacementClavier || joueur.enDeplacementSouris){
			while(x<l+1){
				y=0;
				if ((ligne = this.terrainFG[x + positionX - position_ecran_x])){
					while(y<h+1){
						if (((cellule = ligne[y + positionY - position_ecran_y])) != null){
							if (!persoDraw && x == position_ecran_x && y == position_ecran_y){ //si la tuile du milieu de l'écran à fore à 1
								if(this.grilleFore[positionX] && this.grilleFore[positionX][positionY]){
									joueur.drawPerso(this.ctx_objets);	
									persoDraw = true;
								}
								this.tilesetFG.drawTile(this.ctx_objets, cellule,(x-decallageX)*lTuile,(y-decallageY)*hTuile);	
							} else {
								this.tilesetFG.drawTile(this.ctx_objets, cellule,(x-decallageX)*lTuile,(y-decallageY)*hTuile);
							}
						}
						y++;
					}
				}
				x++;
			}
			this.needRefresh = false;
		}
		
		//affichage des objets dynamiques
		for (var k in this.objets){	
			objetTemp = this.objets[k];
			objetTemp.drawObjet(this.ctx_objets, joueur.x, joueur.y);
		}
		
		//affichage des autres personnages
		for (var k in this.personnages){	
			if(!this.personnages[k].persoDraw){
				this.personnages[k].drawPerso(this.ctx_objets, joueur.x, joueur.y);
			}
		}
		
		//affichage du joueur
		if (!persoDraw){
			joueur.drawPerso(this.ctx_objets);
		}
	}
}

/*
 * detecte si l'objet est deja connu
 */
Foreground.prototype.objetConnu = function(id){
	if (this.objets[id] != null){
		return true;
	} else {
		return false;
	}
}

/*
 * detecte si le personnage est deja connu
 */
Foreground.prototype.persoConnu = function(id){
	if (this.personnages[id] != null){
		return true;
	} else {
		return false;
	}
}


