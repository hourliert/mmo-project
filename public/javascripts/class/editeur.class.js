/*
 * CLASSE DE l'editeur !
 */
function Editeur(monMmo){
	var monEditeur = this;
	
	this.editeurActif = false;
		
	this.mmo = monMmo;
	
	this.ioCom = monMmo.ioCom;
	
	this.ctx_editeur = monMmo.ctx_editeur; //on stocke localement les contextes des canvas
	this.ctx_palette = monMmo.ctx_palette;
	this.ctx_tuileSelect = monMmo.ctx_tuileSelect;
	
	this.idPerso = monMmo.init.idPerso; //id perso juste pou vérifier côté serveur que pas d'entourloupe ! :p
	
	this.largeurTuile = monMmo.init.largeurTuile;
	this.hauteurTuile = monMmo.init.hauteurTuile;
	
	//tileset du BG et du FG
	this.tileset = new Tileset(monMmo.init.urlTuiles, this.largeurTuile, this.hauteurTuile, function(){
		avancementChargement(ELEMENT.EDITEUR_BG_TS);
	});
	this.tilesetFG = new Tileset(monMmo.init.urlForeground, this.largeurTuile, this.hauteurTuile, function(){
		avancementChargement(ELEMENT.EDITEUR_FG_TS);
	});
	
	this.xTuile = 0; //init position dans canvas
	this.yTuile = 0;
	this.xInitTuile = 0;
	this.yInitTuile = 0;
	this.xTuilePalette = 0;
	this.yTuilePalette = 0;
	this.xInitTuilePalette = 0;
	this.yInitTuilePalette = 0;
	
	this.modeGround = GROUND.BACKGROUND; //modes selectionné par l'user
	this.modeCollision = COLLISION.PAS_COLLISION;
	this.modeCamera = CAMERA.MOVE;
	
	this.reqEnvoyee = false; //req envoyé demandé FG et BG
	this.reqEnvoyeeFG = false;
	
	this.terrain = {}; //objet contenant le BG
	this.terrainFG = {}; //objet contenant le FG
	this.toSauv = {}; //recente modif du BG
	this.toSauvFG = {}; //recente modif du FG
	
	this.actionsPrec = []; //pile des actions précédentes (pour le CTRL Z)

 	//DOM UI local
	this.UIcoord = document.getElementById('info-map');
	this.UItoSauv = document.getElementById('toSauv');
	this.messageSauvDB = '';

	//image de la palette du BG
	this.image = new Image();
	this.image.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");
		monEditeur.largeurPalette = this.width;
		monEditeur.hauteurPalette = this.height;
		monEditeur.nbTuilesLarg = monEditeur.largeurPalette / monEditeur.largeurTuile;
		monEditeur.nbTuilesHaut = monEditeur.hauteurPalette / monEditeur.hauteurTuile;
		
		monEditeur.drawPalette();
		
		avancementChargement(ELEMENT.EDITEUR_BG_IMG);
	}
	this.image.src =  monMmo.init.urlTuiles;
	
	//image palette du FG
	this.imageFG = new Image();
	this.imageFG.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");
		monEditeur.largeurPaletteFG = this.width;
		monEditeur.hauteurPaletteFG = this.height;
		monEditeur.nbTuilesLargFG = monEditeur.largeurPaletteFG / monEditeur.largeurTuile;
		monEditeur.nbTuilesHautFG = monEditeur.hauteurPaletteFG / monEditeur.hauteurTuile;
		
		avancementChargement(ELEMENT.EDITEUR_FG_IMG);
	}
	this.imageFG.src =  monMmo.init.urlForeground;
	
	//récupération de la carte BG
	this.ioCom.repCarteEditeur(function(data){
		if (data.erreur){
			console.log('erreur repCarte');
			setTimeout(function(){
				monEditeur.reqEnvoyee = false;
			},200);
		} else if (data.bordure){
		 	console.log('bordure');
		 	setTimeout(function(){
				monEditeur.reqEnvoyee = false;
			},200);
		} else {
			monEditeur.setCache(data);
			monEditeur.drawMap();
			
			monEditeur.reqEnvoyee = false;
		}
	});
		
	//récupération de la carte FG
	this.ioCom.repFGEditeur(function(data){
		if (data.erreur){
			console.log('erreur repCarteFG');
			setTimeout(function(){
				monEditeur.reqEnvoyeeFG = false;
			},200);
		} else if (data.bordure){
		 	console.log('bordure');
		 	setTimeout(function(){
				monEditeur.reqEnvoyeeFG = false;
			},200);
		} else {
			monEditeur.setCacheFG(data);
			monEditeur.drawMap();
			
			monEditeur.reqEnvoyeeFG = false;
		}
	});

	//on récupère la carte
	this.ioCom.reqCarteEditeur(this.idPerso, DIRECTION.STOP); 
	
	//réponse du serveur suite a une sauvegarde
	this.ioCom.repSauvMapDB(function(data){
		if (data.erreur){
			monEditeur.messageSauvDB = '<br />Erreur lors de la sauvegarde en DB';
		} else if (data.ok){
			monEditeur.messageSauvDB = '<br />Enregistré en DB à ' + new Date().toGMTString();
		}
		monEditeur.majUI();
	});
	
	//sauvegarde auto ttes les 10 secondes
	setInterval(function(){
		monEditeur.ioCom.reqSauvMapDB(monEditeur.idPerso, monEditeur.toSauv, monEditeur.toSauvFG);
		monEditeur.toSauv = {};
		monEditeur.toSauvFG = {};
		monEditeur.majUI();
	},10000);
	
	this.initUI();
	this.initEvent();
}

/*
 * Met à jour le cache du terrain client ASYNCHONOUS
 */
Editeur.prototype.setCache = function(dataRecu){
	var zonesD = dataRecu.zone,
		terrainD = dataRecu.terrain,
		monEditeur = this;	
	
	if (zonesD.globale){ //le serveur nous envoie une zone globale
		for(var i in terrainD){ //sans async
			(function(i){
				setTimeout(function(){
					for (var j in terrainD[i]){
						//(function(j){
							if (!monEditeur.terrain[i]){
								monEditeur.terrain[i] = {};
								monEditeur.terrain[i][j] = {};
							}
							if (!monEditeur.terrain[i][j]){
								monEditeur.terrain[i][j] = {};
							}
							
							monEditeur.terrain[i][j] = terrainD[i][j];
						//})(j);
					}
				},0);
			})(i);
		}
	} else { //cas des batiments
		
	}
}

/*
 * Met à jour le cache du terrain client ASYNCHONOUS FG
 */
Editeur.prototype.setCacheFG = function(dataRecu){
	var zonesD = dataRecu.zone,
		terrainD = dataRecu.terrain,
		monEditeur = this;	
	
	if (zonesD.globale){ //le serveur nous envoie une zone globale
		for(var i in terrainD){ //sans async
			(function(i){
				setTimeout(function(){
					for (var j in terrainD[i]){
						//(function(j){
							if (!monEditeur.terrainFG[i]){
								monEditeur.terrainFG[i] = {};
								monEditeur.terrainFG[i][j] = {};
							}
							if (!monEditeur.terrainFG[i][j]){
								monEditeur.terrainFG[i][j] = {};
							}
							
							monEditeur.terrainFG[i][j] = terrainD[i][j];
						//})(j);
					}
				},0);
			})(i);
		}
	} else { //cas des batiments
		
	}
}

/*
 * init de L'UI concernant l'éditeur
 */
Editeur.prototype.initUI = function(){
	var monEditeur = this;
	var mmo = this.mmo;
	
	$(function(){
		var bouton_editeur = $('#bouton-editeur-carte'), //bouton du NAV gauche : EDITEUR
			class_ecran = $('.zone-ecran'),
			class_dialog = $('.boite-dialogue'),
			editeur = $('#editeur-map'), //DIV EDITEUR
			modeCamera = $('#mode-camera'), //RADIO DU MODE CAMERA
			modeGround = $('#mode-edit'), //RADIO DU MODE GROUND
			modeCollision = $('#mode-collision'), //RADIO DU MODE COLLISION
			sauvMapDb = $('#sauvMapDB'), //bouton pour sauv en DB la carte
			palette_field = $('#palette-field'), //DIV PALETTE
			collision_field = $('#collision-field'), //DIV COLLISION
			jump = $('#jump'),// bouton de déplacement de la map
			annuleAction = $('#annuleAction'); 
			
		/*
		 * NAV
		 * bouton du menu (jeu, editeur, inventaire, etc)
		 */
		bouton_editeur.on('click',function(){
			mmo.joueur.jeuActif = false;
			monEditeur.editeurActif = true;
			class_dialog.fadeOut();
			class_ecran.fadeOut();
			editeur.fadeIn();
		});
		
		/*
		 * EDITEUR
		 */
		/*
		 * boutons radio : mode de camera et mode de saisie (back ou fore ground)
		 */
		modeCamera.change(function(){
			var mode = $('input[name=camera]:checked').val();
			if (mode == 'set'){
				monEditeur.modeCamera = CAMERA.SET;
			} else {
				monEditeur.modeCamera = CAMERA.MOVE;
			}	
		});
		modeGround.change(function(){
			var mode = $('input[name=ground]:checked').val();
			if (mode == 'foreground'){
				monEditeur.modeGround = GROUND.FOREGROUND;
				
				collision_field.fadeOut('fast',function(){
					palette_field.fadeIn('fast');
				});
			} else if(mode == 'background'){
				monEditeur.modeGround = GROUND.BACKGROUND;
				
				collision_field.fadeOut('fast',function(){
					palette_field.fadeIn('fast');
				});
				
			} else if(mode == 'collision'){
				monEditeur.modeGround = GROUND.COLLISION;
				
				palette_field.fadeOut('fast',function(){
					collision_field.fadeIn('fast');
				});
				
			}
			monEditeur.changeModeGround();
			monEditeur.drawMap();
		});
		modeCollision.change(function(){
			var mode = $('input[name=collision]:checked').val();
			if (mode == 1){//collision
				mmo.editeur.modeCollision = COLLISION.COLLISION;
			} else if (mode == 0){
				mmo.editeur.modeCollision = COLLISION.PAS_COLLISION;
			} else if (mode == 2){
				mmo.editeur.modeCollision = COLLISION.FORE;
			}
		});
		
		/*
		 * bouton edition map
		 */
		sauvMapDb.on('click',function(){
			monEditeur.ioCom.reqSauvMapDB(monEditeur.idPerso, monEditeur.toSauv, monEditeur.toSauvFG);
			monEditeur.toSauv = {};
			monEditeur.toSauvFG = {};
			monEditeur.majUI();
		});
		
		/*
		 * bouton jump
		 */
		jump.on('click',function(){
			var posX = parseInt($('#posX').val());
			var posY = parseInt($('#posY').val());
			
			monEditeur.changePos(posX, posY);
			return false;
		});
		
		/*
		 * bontoun annuleAction
		 */
		annuleAction.on('click',function(){
			monEditeur.annuleAction();
		});
	});
}

/*
 * init les event de l'éditeur
 */
Editeur.prototype.initEvent = function(){
	var monEditeur = this;
	var monMmo = this.mmo;
	
	var firstClic = true;
	var firstClicPalette = true;
	var clic = false;
	var clicPalette = false;
	
	/*
	 * EDITEUR
	 */
	monMmo.canvas_editeur.addEventListener('mousedown',function(e){
		if (firstClic){
			monMmo.top_canvas = getOffset(monMmo.canvas_editeur).top,
			monMmo.left_canvas = getOffset(monMmo.canvas_editeur).left;
			firstClic = false;
		}
		
		if (monEditeur.modeCamera == CAMERA.MOVE && e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas)/monEditeur.hauteurTuile);
			
			monEditeur.initDeplacement(toX, toY, CANVAS.EDITEUR);
			clic = true;
		} else if (monEditeur.modeCamera == CAMERA.SET && e.which == 1){
			clic = true;
		}
	})
	//clic relaché editeur
	document.addEventListener('mouseup',function(e){
		if (monEditeur.modeCamera == CAMERA.MOVE && clic && e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas)/monEditeur.largeurTuile); //tuile sur laquelle la souris est relachée
			var toY = Math.floor((e.clientY - monMmo.top_canvas)/monEditeur.hauteurTuile);
						
			monEditeur.finDeplacement(toX, toY, CANVAS.EDITEUR);
			clic = false;
		} else if (monEditeur.modeCamera == CAMERA.SET && clic && e.which == 1){
			clic = false;
		}
	})
	//deplacement editeur
	document.addEventListener('mousemove',function(e){							
		if(monEditeur.modeCamera == CAMERA.MOVE && clic){ //le clic souris est maintenu
			var toX = Math.floor((e.clientX - monMmo.left_canvas)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas)/monEditeur.hauteurTuile);
							
			monEditeur.deplacement(toX,toY, CANVAS.EDITEUR);
			monEditeur.initDeplacement(toX, toY, CANVAS.EDITEUR);
		} else if (monEditeur.modeCamera == CAMERA.SET && clic){
			var toX = Math.floor((e.clientX - monMmo.left_canvas)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas)/monEditeur.hauteurTuile);
			
			monEditeur.remplaceTuile(toX, toY);
		}
	})
	//clic editeur
	monMmo.canvas_editeur.addEventListener('click',function(e){
		if (firstClic){
			monMmo.top_canvas = getOffset(monMmo.canvas_editeur).top,
			monMmo.left_canvas = getOffset(monMmo.canvas_editeur).left;
			firstClic = false;
		}
		
		if (monEditeur.modeCamera == CAMERA.SET && e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas)/monEditeur.hauteurTuile);
			
			monEditeur.remplaceTuile(toX, toY);
		}
	})
	
	/*
	 * PALETTE EDITEUR
	 */
	//clic enfoncé palette
	monMmo.canvas_palette.addEventListener('mousedown',function(e){
		if (firstClicPalette){
			monMmo.top_canvas_palette = getOffset(monMmo.canvas_palette).top,
			monMmo.left_canvas_palette = getOffset(monMmo.canvas_palette).left;
			
			firstClicPalette = false;
		}
		if (e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas_palette)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas_palette)/monEditeur.hauteurTuile);
			
			monEditeur.initDeplacement(toX, toY, CANVAS.PALETTE);
			clicPalette = true;
		}
	})
	//clic relaché palette
	document.addEventListener('mouseup',function(e){
		if (clicPalette && e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas_palette)/monEditeur.largeurTuile); //tuile sur laquelle la souris est relachée
			var toY = Math.floor((e.clientY - monMmo.top_canvas_palette)/monEditeur.hauteurTuile);
			
			monEditeur.finDeplacement(toX, toY, CANVAS.PALETTE);
			clicPalette = false;
		}
	})
	//deplacement palette
	document.addEventListener('mousemove',function(e){							
		if(clicPalette){ //le clic souris est maintenu
			var toX = Math.floor((e.clientX - monMmo.left_canvas_palette)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas_palette)/monEditeur.hauteurTuile);
					
			monEditeur.deplacement(toX,toY, CANVAS.PALETTE);
			monEditeur.initDeplacement(toX, toY, CANVAS.PALETTE);
		}
	})
	//clic palette
	monMmo.canvas_palette.addEventListener('click',function(e){
		if (firstClicPalette){
			monMmo.top_canvas_palette = getOffset(monMmo.canvas_palette).top,
			monMmo.left_canvas_palette = getOffset(monMmo.canvas_palette).left;
			firstClicPalette = false;
		}
		if (e.which == 1){ //clic gauche
			var toX = Math.floor((e.clientX - monMmo.left_canvas_palette)/monEditeur.largeurTuile);
			var toY = Math.floor((e.clientY - monMmo.top_canvas_palette)/monEditeur.hauteurTuile);
			
			monEditeur.selectionneTuile(toX, toY);
		}
	})
	
	//CLAVIER
	document.addEventListener('keydown',function(e){
		if (monEditeur.editeurActif){	
			if(e.which == 38){ //haut
				monEditeur.yTuile -=1;		
			}
			if(e.which == 40){ //bas
				monEditeur.yTuile +=1;
			}
			if(e.which == 37){ //gauche
				monEditeur.xTuile -=1;
			}
			if(e.which == 39){ //droite	
				monEditeur.xTuile +=1;
			}
			monEditeur.drawMap();
		}	
	},false);
}

/*
 * changement de mode (background / foreground)
 * on force le refresh
 */
Editeur.prototype.changeModeGround = function(){
	this.drawPalette();
	this.drawMap();
}

/*
 * change de position avec jump !
 */
Editeur.prototype.changePos = function(x, y){
	if (!isNaN(x) && !isNaN(y)){
		this.xTuile = x;
		this.yTuile = y;
	
		this.mapACompletee();
		this.drawMap();
	}
}

/*
 * annule la dernière action
 */
Editeur.prototype.annuleAction = function(){
	var action = this.actionsPrec[this.actionsPrec.length -1];
	this.actionsPrec.pop();
	
	if (action){
		if (action.tuilePrec == null){
			action.tuilePrec = 0; //choix par defaut
		}
		if (action.ground == GROUND.BACKGROUND){
			this.terrain[action.x][action.y][0] = action.tuilePrec;
			
			if (!this.toSauv[action.x]){
				this.toSauv[action.x] = {};
			}
			if(!this.toSauv[action.x][action.y]){
				this.toSauv[action.x][action.y] = {};
			}
			this.toSauv[action.x][action.y][0] = action.tuilePrec;
			
		} else if(action.ground == GROUND.FOREGROUND){
			this.terrainFG[action.x][action.y][0] = action.tuilePrec;
			
			if (!this.toSauvFG[action.x]){
				this.toSauvFG[action.x] = {};
			}
			if(!this.toSauvFG[action.x][action.y]){
				this.toSauvFG[action.x][action.y] = {};
			}
			this.toSauvFG[action.x][action.y][0] = action.tuilePrec;
			console.log(this.toSauvFG[action.x][action.y][0]);
		} else if (action.ground == GROUND.COLLISION){
			this.terrain[action.x][action.y][1] = action.tuilePrec;
			
			if (!this.toSauv[action.x]){
				this.toSauv[action.x] = {};
			}
			if(!this.toSauv[action.x][action.y]){
				this.toSauv[action.x][action.y] = {};
			}
			this.toSauv[action.x][action.y][1] = action.tuilePrec;
		}
		this.drawMap();
		this.majUI();
	}
}

/*
 * on recup les coordonnées de la tuile sur laquelle la souris est enfoncée
 */
Editeur.prototype.initDeplacement = function(x, y, canvas){
	if (canvas == CANVAS.EDITEUR){
		this.xInitTuile = x; //on sauvegarde la position de la souris initiale
		this.yInitTuile = y;
		
		this.drawMap(this.ctx_editeur);
	} else if (canvas == CANVAS.PALETTE){
		this.xInitTuilePalette = x; //on sauvegarde la position de la souris initiale
		this.yInitTuilePalette = y;
	
		this.drawPalette(this.ctx_palette);
	}
}

/*
 * on met a jours la position en calcul la différence entre fin - debut coordonnées tuiles
 */
Editeur.prototype.finDeplacement = function(toX, toY, canvas){
	if (canvas == CANVAS.EDITEUR){
		var distX = Math.abs(this.xInitTuile - toX); //distance par rapport à l'enfoncement initial
		var distY = Math.abs(this.yInitTuile - toY);
	
		var signX = (toX < this.xInitTuile) ? 1 : -1,
			signY = (toY < this.yInitTuile) ? 1 : -1;	
		
		this.xTuile += signX*distX; //sauvegarde de la nouvelle position de la carte
		this.yTuile += signY*distY;
		
		this.drawMap();
		
	} else if (canvas == CANVAS.PALETTE){
		var distX = Math.abs(this.xInitTuilePalette - toX); //distance par rapport à l'enfoncement initial
		var distY = Math.abs(this.yInitTuilePalette - toY);
		
		var signX = (toX < this.xInitTuilePalette) ? -1 : 1,
			signY = (toY < this.yInitTuilePalette) ? -1 : 1;	
			
		var x = distX*signX,
			y = distY*signY;
		
		
		if( (this.xTuilePalette + x) <= 0 && (this.xTuilePalette + x) >= -(this.nbTuilesLarg-10)){
			this.xTuilePalette += x; //sauvegarde de la nouvelle position de la carte
		}
		if( (this.yTuilePalette + y) <= 0 && (this.yTuilePalette + y) >= -(this.nbTuilesHaut-5)){
			this.yTuilePalette += y; //sauvegarde de la nouvelle position de la carte
		}
		
		this.drawPalette();
	}
}

/*
 * deplacement intermediaire
 */
Editeur.prototype.deplacement = function(toX, toY, canvas){
	if (canvas == CANVAS.EDITEUR){
		var distX = Math.abs(this.xInitTuile - toX); //distance par rapport à l'enfoncement initial
		var distY = Math.abs(this.yInitTuile - toY);
		
		var signX = (toX < this.xInitTuile) ? 1 : -1,
			signY = (toY < this.yInitTuile) ? 1 : -1;	
		
		this.xTuile += signX*distX; //sauvegarde de la nouvelle position de la carte
		this.yTuile += signY*distY;
		
		this.mapACompletee();
		
	} else if (canvas == CANVAS.PALETTE){
		var distX = Math.abs(this.xInitTuilePalette - toX); //distance par rapport à l'enfoncement initial
		var distY = Math.abs(this.yInitTuilePalette - toY);
		
		var signX = (toX < this.xInitTuilePalette) ? -1 : 1,
			signY = (toY < this.yInitTuilePalette) ? -1 : 1;	
			
		var x = distX*signX,
			y = distY*signY;
		
		if( (this.xTuilePalette + x) <= 0 && (this.xTuilePalette + x) >= -(this.nbTuilesLarg-10)){
			this.xTuilePalette += x; //sauvegarde de la nouvelle position de la carte
		}
		if( (this.yTuilePalette + y) <= 0 && (this.yTuilePalette + y) >= -(this.nbTuilesHaut-5)){
			this.yTuilePalette += y; //sauvegarde de la nouvelle position de la carte
		}
	}
}

/*
 * selectionne une tuile
 */
Editeur.prototype.selectionneTuile = function(x,y){
	var ctx = this.ctx_tuileSelect;
	
	var selectX = Math.abs(this.xTuilePalette - x);
	var selectY = Math.abs(this.yTuilePalette - y);
	
	this.numeroTuile = selectX + (selectY*this.nbTuilesLarg);

	ctx.clearRect(0,0,this.largeurTuile,this.hauteurTuile);	
	
	if (this.modeGround == GROUND.BACKGROUND){
		ctx.drawImage(
			this.image,
			selectX*this.largeurTuile, selectY*this.hauteurTuile,
			this.largeurTuile, this.hauteurTuile,
			0, 0,
			this.largeurTuile, this.hauteurTuile
		);
	} else if (this.modeGround == GROUND.FOREGROUND){
		ctx.drawImage(
			this.imageFG,
			selectX*this.largeurTuile, selectY*this.hauteurTuile,
			this.largeurTuile, this.hauteurTuile,
			0, 0,
			this.largeurTuile, this.hauteurTuile
		);	
	}
}

Editeur.prototype.remplaceTuile = function(x,y){
	var selectX = this.xTuile + x;
	var selectY = this.yTuile + y;
	
	if (this.modeGround == GROUND.BACKGROUND){ //on edite le background
		if (this.numeroTuile != null){
			//ce qui sera affiché
			if(!this.terrain[selectX]){
				this.terrain[selectX] = {};
			}
			if(!this.terrain[selectX][selectY]){
				this.terrain[selectX][selectY] = {};
			}
			var trouve = false;
			for(var i in this.actionsPrec){
				if (this.actionsPrec[i].x == selectX && this.actionsPrec[i].y == selectY && this.actionsPrec[i].ground == GROUND.BACKGROUND){
					trouve = true;
				}
			}
			if(!trouve){
				this.actionsPrec.push({
					'ground' : GROUND.BACKGROUND, 
					'x' : selectX, 
					'y' : selectY, 
					'tuilePrec' : this.terrain[selectX][selectY][0], 
					'tuile' : this.numeroTuile
				});
			}

			this.terrain[selectX][selectY][0] = this.numeroTuile;
			
			//ce qui sera sauveaardé
			if (!this.toSauv[selectX]){
				this.toSauv[selectX] = {};
			}
			if(!this.toSauv[selectX][selectY]){
				this.toSauv[selectX][selectY] = {};
			}
			this.toSauv[selectX][selectY][0] = this.numeroTuile;
		}
	} else if (this.modeGround == GROUND.COLLISION){ //on edite les collisions
		if (this.modeCollision == COLLISION.FORE){ //on edite le bleu (fore)
			if (!this.terrainFG[selectX]){
				this.terrainFG[selectX] = {};
			}
			if(!this.terrainFG[selectX][selectY]){
				this.terrainFG[selectX][selectY] = {};
				this.terrainFG[selectX][selectY][0] = 0;
			}
			var trouve = false;
			for(var i in this.actionsPrec){
				if (this.actionsPrec[i].x == selectX && this.actionsPrec[i].y == selectY && this.actionsPrec[i].ground == GROUND.COLLISION){
					trouve = true;
				}
			}
			if(!trouve){
				this.actionsPrec.push({
					'ground' : GROUND.COLLISION, 
					'x' : selectX, 
					'y' : selectY, 
					'tuilePrec' : this.terrainFG[selectX][selectY][1], 
					'tuile' : STAT.FORE
				});
			}
			
			this.terrainFG[selectX][selectY][1] = STAT.FORE;
			
			//ce qui sera sauveaardé
			if (!this.toSauvFG[selectX]){
				this.toSauvFG[selectX] = {};
			}
			if(!this.toSauvFG[selectX][selectY]){
				this.toSauvFG[selectX][selectY] = {};
			}
			this.toSauvFG[selectX][selectY][1] = STAT.FORE;
		} else {
			if (!this.terrain[selectX]){
				this.terrain[selectX] = {};
			}
			if(!this.terrain[selectX][selectY]){
				this.terrain[selectX][selectY] = {};
				this.terrain[selectX][selectY][0] = 0;
			}
			var trouve = false;
			for(var i in this.actionsPrec){
				if (this.actionsPrec[i].x == selectX && this.actionsPrec[i].y == selectY && this.actionsPrec[i].ground == GROUND.COLLISION){
					trouve = true;
				}
			}
			if(!trouve){
				this.actionsPrec.push({
					'ground' : GROUND.COLLISION, 
					'x' : selectX, 
					'y' : selectY, 
					'tuilePrec' : this.terrain[selectX][selectY][1], 
					'tuile' : this.modeCollision
				});
			}
			
			this.terrain[selectX][selectY][1] = this.modeCollision;
			
			//ce qui sera sauveaardé
			if (!this.toSauv[selectX]){
				this.toSauv[selectX] = {};
			}
			if(!this.toSauv[selectX][selectY]){
				this.toSauv[selectX][selectY] = {};
			}
			this.toSauv[selectX][selectY][1] = this.modeCollision;
			
			if (this.modeCollision == COLLISION.PAS_COLLISION){ //correction de fore
				if (this.terrainFG[selectX] && this.terrainFG[selectX][selectY] && this.terrainFG[selectX][selectY][1]){
					this.terrainFG[selectX][selectY][1] = STAT.BEHIND;
					
					if (!this.toSauvFG[selectX]){
						this.toSauvFG[selectX] = {};
					}
					if(!this.toSauvFG[selectX][selectY]){
						this.toSauvFG[selectX][selectY] = {};
					}
					this.toSauvFG[selectX][selectY][1] = STAT.BEHIND;
				}
			}
		}
		
	} else if (this.modeGround == GROUND.FOREGROUND){
		if (this.numeroTuile != null){
			//ce qui sera affiché
			if (!this.terrainFG[selectX]){
				this.terrainFG[selectX] = {};
			}
			if(!this.terrainFG[selectX][selectY]){
				this.terrainFG[selectX][selectY] = {};
			}
			var trouve = false;
			for(var i in this.actionsPrec){
				if (this.actionsPrec[i].x == selectX && this.actionsPrec[i].y == selectY && this.actionsPrec[i].ground == GROUND.FOREGROUND){
					trouve = true;
				}
			}
			if(!trouve){
				this.actionsPrec.push({
					'ground' : GROUND.FOREGROUND, 
					'x' : selectX, 
					'y' : selectY, 
					'tuilePrec' : this.terrainFG[selectX][selectY][0], 
					'tuile' : this.numeroTuile
				});
			}
			
			this.terrainFG[selectX][selectY][0] = this.numeroTuile;
			
			//ce qui sera sauveaardé
			if (!this.toSauvFG[selectX]){
				this.toSauvFG[selectX] = {};
			}
			if(!this.toSauvFG[selectX][selectY]){
				this.toSauvFG[selectX][selectY] = {};
			}
			this.toSauvFG[selectX][selectY][0] = this.numeroTuile;
		}	
	}

	this.drawMap();
	this.majUI();
}

/*
 * dessine la palette
 */
Editeur.prototype.drawPalette = function(){
	var ctx = this.ctx_palette;
	
	ctx.clearRect(0,0,10*this.largeurTuile,5*this.hauteurTuile);
	
	if (this.modeGround == GROUND.BACKGROUND){
		ctx.drawImage(
			this.image,
			0, 0,
			this.largeurPalette, this.hauteurPalette,
			this.xTuilePalette*this.largeurTuile, this.yTuilePalette*this.hauteurTuile,
			this.largeurPalette, this.hauteurPalette
		);
	} else if (this.modeGround == GROUND.FOREGROUND){
		ctx.drawImage(
			this.imageFG,
			0, 0,
			this.largeurPalette, this.hauteurPalette,
			this.xTuilePalette*this.largeurTuile, this.yTuilePalette*this.hauteurTuile,
			this.largeurPalette, this.hauteurPalette
		);
	}
}

/*
 * affichage de la zone editeur
 */
Editeur.prototype.drawMap = function(){
	var monEditeur = this;
	
	var x = 0, 
		y = 0,
		l = 20,
		h = 17,
		lTuile = this.largeurTuile,
		hTuile = this.hauteurTuile,
		ctx = this.ctx_editeur;
		
	//donnée JSON interprétées
	var ligne = null, //contient la ligne (JSON) en cours d'affichage
		cellule = null, //contient la cellule (JSON) en cours d'affichage
		numTuile = null, //numero de la tuile
		collision = null;
		
	ctx.clearRect(0,0,l*lTuile, h*hTuile);
	while(x<l+1){
		y=0;
		if ((ligne = this.terrain[x + this.xTuile])){
			while(y<h+1){
				if ((cellule = ligne[y + this.yTuile]) && ((numTuile = cellule[0]) != null)){
					this.tileset.drawTile(ctx, numTuile,x*lTuile,y*hTuile);
					
					if (this.modeGround == GROUND.COLLISION){ //en gestion des collisions
						if ((collision = cellule[1]) != null){
							this.tileset.drawTileCollision(ctx, x*lTuile,y*hTuile, collision);	
						}
					}
					
				}				
				y++;
			}
		}
		x++;
	}
	
	x = 0; 
	y = 0;
	ligne = null; //contient la ligne (JSON) en cours d'affichage
	cellule = null; //contient la cellule (JSON) en cours d'affichage
	numTuile = null; //numero de la tuile
	if (this.modeGround == GROUND.FOREGROUND || this.modeGround == GROUND.COLLISION){
		while(x<l+1){
			y=0;
			if ((ligne = this.terrainFG[x + this.xTuile])){
				while(y<h+1){
					if ((cellule = ligne[y + this.yTuile]) && ((numTuile = cellule[0]) != null)){
						this.tilesetFG.drawTile(ctx, numTuile,x*lTuile,y*hTuile);
						
						if (this.modeGround == GROUND.COLLISION){ //en gestion des collisions
							if ((collision = cellule[1]) == STAT.FORE){
								this.tileset.drawTileCollision(ctx, x*lTuile,y*hTuile, COLLISION.FORE);	
							}
						}
					}				
					y++;
				}
			}
			x++;
		}
	}

	this.majUI();
}

/*
 * verifie si la map locale a besoin d'être rafraichie
 */
Editeur.prototype.mapACompletee = function(){
	var monEditeur = this;
	var marge = 30;
	var positionX = this.xTuile;
	var positionY = this.yTuile;

	
	if (!monEditeur.reqEnvoyee){
		if ((monEditeur.terrain[positionX - marge] == null)|| 
			(monEditeur.terrain[positionX + marge]== null)||
			(monEditeur.terrain[positionX][positionY - marge] == null)|| 
			(monEditeur.terrain[positionX][positionY + marge] == null)){			
 
			this.ioCom.reqCarteEditeur(this.idPerso, DIRECTION.STOP);
			monEditeur.reqEnvoyee = true;
		}
	}
}

Editeur.prototype.majUI = function(){
	this.UIcoord.innerHTML = 'Position top_left carte <br />' + this.xTuile + ' x ' + this.yTuile + ' y ';
	
	if (isEmpty(this.toSauv) && isEmpty(this.toSauvFG)){
		this.UItoSauv.style.color ='green';
		this.UItoSauv.innerHTML ='Toutes les modifications ont été enregistrées';
		this.UItoSauv.innerHTML += this.messageSauvDB;
		this.messageSauvDB = '';
	} else {
		this.UItoSauv.style.color ='red';
		this.UItoSauv.innerHTML ="Des modifications n'ont pas été enregistrées !";
	}
}
