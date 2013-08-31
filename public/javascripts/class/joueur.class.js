/*
 * classe gérant gérant le joueur != des personnages (qui ne sont que des objets avec animation)
 */

function Joueur(monMmo){
	var monJoueur = this;
	
	this.jeuActif = true;
	
	this.mmo = monMmo;
	
	this.ioCom = monMmo.ioCom;
	
	this.idPerso = monMmo.init.idPerso; //ID en DB du perso
	
	this.largeurSprit = monMmo.init.largeurSprit; //largeur d'une image d'un perso (inutile pour le moment)
	this.hauteurSprit = monMmo.init.hauteurSprit; //hauteur d'une image d'un perso
	
	this.largeurTuile = monMmo.init.largeurTuile; //largeur d'une tuile'
	this.hauteurTuile = monMmo.init.hauteurTuile; //hauteur ""
	
	//position
	this.x = monMmo.init.x; //position du joueur x
	this.y = monMmo.init.y; //position du joueur y
	
	this.position_ecran_x = monMmo.init.position_ecran_x;
	this.position_ecran_y = monMmo.init.position_ecran_y;
	this.direction = monMmo.init.direction; //direction par défaut (à la connexion)
		
	this.pret = false; //la sprit est chargée
		
	//déplacements
	this.enDeplacementClavier = false; //(indique si le joueur se déplace (clavier ou souris))
	this.enDeplacementSouris = false; //indique si le joueur se déplace à la souris
	this.deplacementPossible = true;
	
	this.frameEnCoursSprit = 0;
	this.nbAnimation = monMmo.init.nbAnimation; //nombre d'une animation sur une plance de sprite
	this.latence = 0;
	
	this.idHB = -1;
	this.tsClient = 0;
	this.tsClientIdeal = 0;
	this.ecartLatence = 0;
	this.idOP = 0;
	
	
	
	this.vitesse = monMmo.init.vitesse/1000; //pixel par seconde
	this.temps = 0; //timing entre chaque appel de drawSomeThing
	this.destX = 0; //destination x, y en cas de déplacement souris
	this.destY = 0;

	//sprit
	this.image = new Image();
	this.image.myClass = this;
	this.image.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");
		
		this.myClass.largeurUneAnim = this.width / this.myClass.nbAnimation; //animation
		this.myClass.hauteurUneDir = this.height / 4; //direction
		this.myClass.pret = true;
		
		avancementChargement(ELEMENT.JOUEUR);
	}
	
	this.image.src =  monMmo.init.urlSprit;
	
	this.initEvent();
}

/*
 * init des events concernant le joueur
 */
Joueur.prototype.initEvent = function(){
	var joueur = this;	
	var go = false; //evite la répétition d'event clavier'
	
	//CLAVIER
	document.addEventListener('keydown',function(e){
		if (!go && joueur.jeuActif){		
			if(e.which == 38){ //haut
				joueur.annonceDeplacement(DIRECTION.HAUT); //on annonce le déplacement, la fonction d'affichage se charge de tout
				go = true;		
			}
			if(e.which == 40){ //bas
				joueur.annonceDeplacement(DIRECTION.BAS);
				go = true;
			}
			if(e.which == 37){ //gauche
				joueur.annonceDeplacement(DIRECTION.GAUCHE);
				go = true;
			}
			if(e.which == 39){ //droite	
				joueur.annonceDeplacement(DIRECTION.DROITE);
				go = true;
			}
		}
	},false);
	
	document.addEventListener('keyup',function(e){
		if ((e.which == 39 || e.which == 40 || e.which == 37 || e.which == 38) && joueur.jeuActif){
	    	joueur.finDeplacement();
	    	go = false;
		}
	},false);
	
	//SOURIS
	var firstClic = true;
	
	mmo.canvas_objets.addEventListener('click',function(e){
		if (firstClic){
			mmo.top_canvas = getOffset(mmo.canvas_background).top,
			mmo.left_canvas = getOffset(mmo.canvas_background).left;
			firstClic = false;
		}
		
		var destX = joueur.x  + ((((e.clientX - joueur.mmo.left_canvas) / joueur.largeurTuile)) - joueur.position_ecran_x);
		var destY = joueur.y + ((((e.clientY - joueur.mmo.top_canvas) / joueur.hauteurTuile)) - joueur.position_ecran_y);
		
		destX.toFixed(3);
		destY.toFixed(3);
		
		joueur.deplacementVers(destX,destY);
	},false);
};

/*
 * gestion de la reception d'un hearbeat par le serveur
 */
Joueur.prototype.heartBeatJoueur = function(data){	
	if (data.idHB > this.idHB) { //l'id de l'HB recu est supérieur au dernier HB : on effectue les opérations (sinon on ignore)
		this.idHB = data.idHB;
		if (this.tsClient == 0){
			this.tsClient = new Date().getTime();
			this.tsClientIdeal = this.tsClient;
			this.ecartLatence = this.latence/2*this.vitesse;
		}
		if (this.enDeplacementClavier || this.enDeplacementSouris || data.HBfinal){ //si à l'arrêt et qu'on ne reçoit pas la finale, on ignore
			//console.log('locale ' + this.x +' ' + this.y);
			//console.log('recu ' + data.x + ' ' + data.y);
						
			if (data.HBfinal){ //dernier HB
				var distX = Math.abs(this.x - data.x),
					distY = Math.abs(this.y - data.y);
				
				//console.log('distance ' + distX + ' ' + distY);	
				if (distX > 1){
					//console.log('resync X of ' + distX);
					this.x = data.x;
				}
				if (distY > 1){
					//console.log('resync Y of ' + distY);
					this.y = data.y;
				}
				this.tsClient = 0;
				this.tsClientIdeal = 0;
				this.ecartLatence = 0;
			} else { //HB classique
				var now = new Date().getTime();
				var ecart = Math.abs(this.tsClientIdeal - now);
				var signEcart = (now < this.tsClientIdeal) ? -1 : 1;
				
				//console.log(signEcart*ecart);
			
				var interX = data.x;
				var interY = data.y;
				
				switch (data.direction){
					case DIRECTION.HAUT :
						interY -= this.ecartLatence + signEcart*ecart* this.vitesse;
						break;
					case DIRECTION.BAS :
						interY += this.ecartLatence + signEcart*ecart* this.vitesse;
						break;
					case DIRECTION.GAUCHE :
						interX -= this.ecartLatence + signEcart*ecart* this.vitesse;
						break;
					case DIRECTION.DROITE :
						interX += this.ecartLatence + signEcart*ecart* this.vitesse;
						break;
				}
				
				//console.log('interpolation '+  interX + ' ' + interY);

				var distX = Math.abs(this.x - interX);
				var distY = Math.abs(this.y - interY);
				
				if (distX > 1){
					//console.log('resync X of ' + distX);
					this.x = data.x;
				}
				if (distY > 1){
					//console.log('resync Y of ' + distY);
					this.y = data.y;
				}
				
				this.tsClient = new Date().getTime();
				this.tsClientIdeal = this.tsClient + 500;
			}
		} else {
			console.log('HB ignore not final');
		}
	} else {
		console.log('HB ignore');
	}
}

Joueur.prototype.AckImpossible = function(){
	this.deplacementPossible = false;
}

Joueur.prototype.majLatence = function(latence){
	this.latence = latence;
}

/*
 * termine tout type de déplacements
 */
Joueur.prototype.finDeplacement = function(){
	if (this.enDeplacementClavier || this.enDeplacementSouris){
		this.ioCom.reqOpJoueur(this.idOP, OPCODE.STOP, this.idPerso);
		this.idOP++;
		
		this.enDeplacementClavier = false;
		this.enDeplacementSouris = false;	
	}
}

/*
 * signale que le joueur veut se déplacer CLAVIER (l'objet MAP glisse alors pour simuler le déplacement)
 * on supprime alors le déplacement automatique (clique)
 */
Joueur.prototype.annonceDeplacement = function(direction){	
	//console.log('DEBUT DEPLACEMENT');
	var OpJoueur = {};
	OpJoueur.x = this.x;
	OpJoueur.y = this.y;
	OpJoueur.vitesse = this.vitesse;

	switch (direction){
		case DIRECTION.HAUT :
			this.ioCom.reqOpJoueur(this.idOP,OPCODE.MOVE_HAUT, this.idPerso, OpJoueur);
			break;
		case DIRECTION.BAS :
			this.ioCom.reqOpJoueur(this.idOP,OPCODE.MOVE_BAS, this.idPerso, OpJoueur);
			break;
		case DIRECTION.GAUCHE :
			this.ioCom.reqOpJoueur(this.idOP, OPCODE.MOVE_GAUCHE, this.idPerso, OpJoueur);
			break;
		case DIRECTION.DROITE :
			this.ioCom.reqOpJoueur(this.idOP, OPCODE.MOVE_DROITE, this.idPerso, OpJoueur);
			break;
	}
	this.idOP++;
	
	
	this.temps = new Date().getTime(); //temps de début de déplacement
	this.direction = direction;	//direction du nouveau déplacement
	
	this.test = new Date().getTime();
	
	this.enDeplacementSouris = false;
	this.enDeplacementClavier = true; //le joueur se déplace maintenant
	this.deplacementPossible = true;
}

Joueur.prototype.deplacementVers = function(x, y){
	var OpJoueur = {};
	OpJoueur.x = this.x;
	OpJoueur.y = this.y;
	OpJoueur.vitesse = this.vitesse;
	OpJoueur.destX = x;
	OpJoueur.destY = y;
		
	this.ioCom.reqOpJoueur(this.idOP, OPCODE.MOVE_TO, this.idPerso, OpJoueur);
	this.idOP++;

	this.destX = x;
	this.destY = y;

	this.temps = new Date().getTime(); //temps de début de déplacement
	
	var precision = 0.15;
	
	if (this.x +precision< this.destX){
		this.direction = DIRECTION.DROITE;
	} else if (this.x -precision > this.destX){
		this.direction = DIRECTION.GAUCHE;
	} else {
		if (this.y +precision< this.destY){
			this.direction = DIRECTION.BAS;
		} else if (this.y -precision> this.destY){
			this.direction = DIRECTION.HAUT;
		}
	}
	
	this.enDeplacementClavier = false;
	this.enDeplacementSouris = true; //le joueur se déplace maintenant	
	this.deplacementPossible = true;
	
}

/*
 * indique si le déplacement est possible (collision) ou non
 */
Joueur.prototype.detecteCollision = function(grilleCollision){
	var posX = trunc(this.x);
	var posY = trunc(this.y);
	
	var direction = this.direction;
	
	switch (direction){
		case DIRECTION.GAUCHE : 
			posX = trunc(this.x - (this.largeurSprit/(2*this.largeurTuile)));
			posY = trunc(this.y);
			break;
		case DIRECTION.DROITE :
			posX = trunc(this.x + (this.largeurSprit/(2*this.largeurTuile)));
			posY = trunc(this.y);
			break;
		case DIRECTION.HAUT :
			posX = trunc(this.x);
			posY = trunc(this.y - (this.hauteurSprit/(2*this.hauteurSprit)));
			break;
		case DIRECTION.BAS :
			posX = trunc(this.x);
			posY = trunc(this.y + (this.hauteurSprit/(2*this.hauteurSprit)));
			break;
	}
	
	var condition = (direction == DIRECTION.GAUCHE && typeof grilleCollision[posX] !== 'undefined' && typeof grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.DROITE && typeof grilleCollision[posX] !== 'undefined' && typeof grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.HAUT && typeof grilleCollision[posX] !== 'undefined' && typeof grilleCollision[posX][posY] !== 'undefined') ||
		(direction == DIRECTION.BAS && typeof grilleCollision[posX] !== 'undefined' && typeof grilleCollision[posX][posY] !== 'undefined') ;
	
	return condition;
}

/*
 * effectue les calculs necessaires lors d'un déplacement
 */
Joueur.prototype.calculDeplacement = function(grilleCollision){	
	// gestion des collisions ici
	if (!this.detecteCollision(grilleCollision)) {
	
		if(this.deplacementPossible){ //déplacement possible (autorisé par le server)
			if(this.enDeplacementClavier){ // les calcul ne sont fait que lors des déplcement (ici clavier)!
				
				var temps = new Date().getTime(); //temps actuelle
				tempsEcoule = temps - this.temps; //écart entre le dernier appel
				
				switch (this.direction){ //mise a jours de la position du joueur avec d = v*t
					case DIRECTION.HAUT: //haut
						this.y -= tempsEcoule * this.vitesse;
						this.y.toFixed(3);
						break;
					case DIRECTION.BAS: //bas
						this.y += tempsEcoule * this.vitesse;
						this.y.toFixed(3);
						break;
					case DIRECTION.GAUCHE: //gauche
						this.x -= tempsEcoule * this.vitesse;
						this.x.toFixed(3);
						break;
					case DIRECTION.DROITE: //droite
						this.x += tempsEcoule * this.vitesse;
						this.x.toFixed(3);
						break;
				}
				
				this.temps = temps; //maj du temps du dernier appel
			}
			
			if(this.enDeplacementSouris){ //en déplacement souris
				var precision = 0.15;
				var temps = new Date().getTime(); //temps actuelle
				tempsEcoule = temps - this.temps; //écart entre le dernier appel
				
				if (this.x +precision< this.destX){
					this.direction = DIRECTION.DROITE;
					this.x += tempsEcoule * this.vitesse;
					this.x.toFixed(3);
				} else if (this.x -precision > this.destX){
					this.direction = DIRECTION.GAUCHE;
					this.x -= tempsEcoule * this.vitesse;
					this.x.toFixed(3);
				} else {
					if (this.y +precision< this.destY){
						this.direction = DIRECTION.BAS;
						this.y += tempsEcoule * this.vitesse;
						this.y.toFixed(3);
					} else if (this.y -precision> this.destY){
						this.direction = DIRECTION.HAUT;
						this.y -= tempsEcoule * this.vitesse;
						this.y.toFixed(3);
					} else {
						this.finDeplacement(); //on est arrivé
					}
				}	
				this.temps = temps; //maj du temps du dernier appel
			}
		}
		
	} else {
		if (this.enDeplacementClavier || this.enDeplacementSouris){
			this.finDeplacement();
		}
	}
}

/*
 * dessine le personnage dans le contexte passé en argument
 * pour avoir une synchro parfaite avec l'animation, on se calque sur la frame d'animation passé en argumment
 */
Joueur.prototype.drawPerso = function(contexte){
	var l = this.largeurUneAnim,
		h = this.hauteurUneDir;
		
	var sprit = 0;
	
	if ((this.enDeplacementClavier || this.enDeplacementSouris) && this.deplacementPossible){
		sprit = ((this.frameEnCoursSprit / (60/(1000*this.vitesse))) | 0 ) % this.nbAnimation;		
		this.frameEnCoursSprit++;
	}
	var xDest = (this.position_ecran_x - 1/2)*this.largeurTuile;
	var yDest = (this.position_ecran_y - 1/2)*this.hauteurTuile - this.hauteurSprit/2;
	
	contexte.drawImage( // API HTML5 JAVASCRIPT (+ optimisé que JQuery)
		this.image,
		sprit*l, this.direction*h,
		l, h,
		xDest, yDest,
		l, h
	);
}
