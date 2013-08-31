/*
 * classe Map (gestion de l'affichage de la map)
 * par défaut map de 20 tuiles x 15 tuiles (de 32 pixels^2)
 */

function Map(monMmo){
	var maCarte = this;
	
	this.mmo = monMmo;

	this.ioCom = monMmo.ioCom;
	
	this.ctx_background = monMmo.ctx_background; //stockage local des canvas
	
	this.grilleCollision = monMmo.grilleCollision;
	this.zones = monMmo.zones; //zones

	this.largeurTuile = monMmo.init.largeurTuile;
	this.hauteurTuile = monMmo.init.hauteurTuile;
	this.largeurEcran = monMmo.init.largeurEcran;
	this.hauteurEcran = monMmo.init.hauteurEcran;

	
	this.tileset = new Tileset(monMmo.init.urlTuiles, this.largeurTuile, this.hauteurTuile,function(){
		avancementChargement(ELEMENT.MAP_TILESET);
	});
	
	this.pret = false;
	this.needRefresh = true; //a true : le BACKGROUND est refresh, à false, non (légère optimisation)
	this.premiereRep = true;
	
	this.terrain = {}; //terrain
	this.joueur = null; //init dans setJoueur
	this.personnages = {};
	
	//a la reception de la carte
	this.ioCom.repCarte(function(data){
		if (data.erreur){
			console.log('erreur repCarte');
		} else if (data.bordure){
		 	console.log('bordure');
		} else {
			maCarte.setCache(data);
			maCarte.setZone(data);
			maCarte.setGrilleCollision(data);
			
			maCarte.pret = true; //prete a etre exploitée
			maCarte.reqEnvoyee = false;
		}
		
		if (maCarte.premiereRep){
			avancementChargement(ELEMENT.MAP_REP);
			maCarte.premiereRep = false;
		}
	});
}

/*
 * Met à jours le cache du terrain client ASYNCHONOUS
 */
Map.prototype.setCache = function(dataRecu){
	var zonesD = dataRecu.zone,
		terrainD = dataRecu.terrain,
		maCarte = this;	
	
	if (zonesD.globale){ //le serveur nous envoie une zone globale
		for(var i in terrainD){ //sans async
			(function(i){
				setTimeout(function(){
					for (var j in terrainD[i]){
						//(function(j){
							if (!maCarte.terrain[i]){
								maCarte.terrain[i] = {};
								maCarte.terrain[i][j] = {};
							}
							if (!maCarte.terrain[i][j]){
								maCarte.terrain[i][j] = {};
							}
							
							maCarte.terrain[i][j] = terrainD[i][j][0];
						//})(j);
					}
				},0);
			})(i);
		}
	} else { //cas des batiments
		
	}
};

/*
 * ajoute une zone au cache des zones
 */
Map.prototype.setZone = function(dataRecu){
	var zonesD = dataRecu.zone,
		maCarte = this;	
	
	if (!maCarte.zones[zonesD.idZone]){
		maCarte.zones[zonesD.idZone] = {};
	}
	maCarte.zones[zonesD.idZone] = zonesD;	
};

/*
 * set la grille de collision avec la zone reçue ASYNCHONOUS
 */
Map.prototype.setGrilleCollision = function(dataRecu){
	var	terrainD = dataRecu.terrain,
		maCarte = this;	
	
	for (var i in terrainD){
		(function(i){
			setTimeout(function(){
				for (var j in terrainD[i]){
					//(function(j){ //petite closure qui va bien
						if (terrainD[i][j][1] != null && terrainD[i][j][1] == COLLISION.COLLISION){
							if (!maCarte.grilleCollision[i]){
								maCarte.grilleCollision[i]={};	
							}
							maCarte.grilleCollision[i][j] = COLLISION.COLLISION;
						}
					//})(j);
				}
			},0);
		})(i);
	}
};

/*
 * défini le joueur sur la map
 */
Map.prototype.setJoueur = function(perso){
	this.joueur = perso;
};

/*
 * la carte est elle prête a etre exploitée ?
 */
Map.prototype.ready = function(){
	return this.pret;
};

/*
 * dessine la MAP seuelement le BG
 * les perso, et objet dyn sont ensuite affiché, le FG est affiché séparement dans forerground.class.js
 */
Map.prototype.drawMap = function(){		
	if (this.pret && this.tileset.pret){
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
			cellule = null; //contient la cellule (JSON) en cours d'affichage
	
		//le joueur
		var joueur = this.joueur;
				
		joueur.calculDeplacement(this.grilleCollision); //calcul des décallage, bordure a afficher, etc
		
		var positionY = trunc(joueur.y), //position Y du joueur (permet de récupérer les tuiles)
			positionX = trunc(joueur.x), //position X du joueur
			//positions
			decallageX = frac(joueur.x), //décallage X lors d'une animation (position du joueur) (pour effet de translation fluide)
			decallageY = frac(joueur.y); //décallage Y lors d'une animation (position du joueur)
				
		if (/*this.needRefresh*/ 1 || joueur.enDeplacementClavier || joueur.enDeplacementSouris){
			while(x<l+1){
				y=0;
				if ((ligne = this.terrain[x + positionX - position_ecran_x])){
					while(y<h+1){
						if (((cellule = ligne[y + positionY - position_ecran_y]) != null)){
							this.tileset.drawTile(this.ctx_background, cellule,(x-decallageX)*lTuile,(y-decallageY)*hTuile);	
						}
						y++;
					}
				}
				x++;
			}
			this.needRefresh = false;
			/*
			 * besoin de requete au serveur pour refresh la map locale
			 */
			this.mapACompletee(positionX,positionY);
		}
	}
};

/*
 * verifie si la map locale a besoin d'être rafraichie
 */
Map.prototype.mapACompletee = function(positionX, positionY){
	var maCarte = this;
	var joueur = maCarte.joueur;
	var marge = 30;
	
	if (!maCarte.reqEnvoyee){
		if ((maCarte.terrain[positionX - marge] == null && joueur.direction == DIRECTION.GAUCHE)|| 
			(maCarte.terrain[positionX + marge]== null && joueur.direction == DIRECTION.DROITE)||
			(maCarte.terrain[positionX] != null && maCarte.terrain[positionX][positionY - marge] == null && joueur.direction == DIRECTION.HAUT)|| 
			(maCarte.terrain[positionX] != null && maCarte.terrain[positionX][positionY + marge] == null && joueur.direction == DIRECTION.BAS)){			
 
			this.ioCom.reqCarte(joueur.idPerso, joueur.direction);
			maCarte.reqEnvoyee = true;
		}
	}
};







