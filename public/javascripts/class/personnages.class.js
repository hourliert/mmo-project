/*
 * classe gérant les personnages (le joueur sera affiché à l'écran comme un personnage classique (et comme un objet))
 */

function Personnages(donneesPersonnage){
	var monPerso = this;
	
	this.pret = false; //sprit chargée

	this.idPerso = donneesPersonnage.idPerso;
	
	this.connecte = true;

	this.dernierTempsConnu = new Date().getTime();
		
	this.largeurSprit = donneesPersonnage.largeurSprit; //largeur d'une image d'un perso (inutile pour le moment)
	this.hauteurSprit = donneesPersonnage.hauteurSprit; // ""
	
	this.hauteurTuile = donneesPersonnage.hauteurTuile; //largeur d'une tuile'
	this.largeurTuile = donneesPersonnage.largeurTuile; //hauteur d'une tuile
	
	//position
	this.x = donneesPersonnage.x; //position du personnage
	this.y = donneesPersonnage.y;
	this.position_ecran_x = donneesPersonnage.position_ecran_x;
	this.position_ecran_y = donneesPersonnage.position_ecran_y;
	this.direction = donneesPersonnage.direction; //direction par défaut
	
	//deplacement
	this.enDeplacementClavier = false; //(indique si le joueur se déplace (clavier ou souris))
	this.enDeplacementSouris = false; //(indique si le personnage se déplace)
	this.temps = 0;
	
	this.destX = 0;
	this.destY = 0;
	
	this.latence = 0;
	this.idHB = -1;
	this.tsClient = 0;
	this.tsClientIdeal = 0;
	this.ecartLatence = 0;
	this.idOP = 0;
	
	this.precision = 2.5; //marge d'erreur lors de l'affichage du perso (par rapport à la position connu du joueur sur le serveur)
	
	this.frameEnCoursSprit = 0;
	this.nbAnimation = donneesPersonnage.nbAnimation;
	
	this.vitesse = donneesPersonnage.vitesse/1000;

	//sprit
	this.image = new Image();
	this.image.myClass = this;
	this.image.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");
		
		this.myClass.largeurUneAnim = this.width / this.myClass.nbAnimation; //animation
		this.myClass.hauteurUneDir = this.height / 4; //direction
		this.myClass.pret = true;
	}
	this.image.src =  donneesPersonnage.urlSprit;
}

/*
 * heart beat recu, on met a jous la position du perso si necessaire
 */
Personnages.prototype.majHeartBeat = function(data){
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
			
				//console.log('distance ' + distX + ' ' + distY);	
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

Personnages.prototype.majLatence = function(latence){
	this.latence = latence;
}

/*
 * op joueur reçue, on met a jours le mouvement du perso
 */
Personnages.prototype.OPJoueur = function(data){
	if (data.opCode == OPCODE.STOP){
		this.finDeplacement();
	} else if (data.opCode == OPCODE.MOVE_TO){
		this.deplacementVers(data.destX, data.destY);
	} else {
		this.debutDeplacement(data.opCode);
	}
}

Personnages.prototype.finDeplacement = function(){
	this.enDeplacementClavier = false; //(indique si le personnage se déplace)
	this.enDeplacementSouris = false;
}

Personnages.prototype.debutDeplacement = function(direction){
	this.temps = new Date().getTime();
	this.direction = direction;
	
	this.enDeplacementClavier = true; 
	this.enDeplacementSouris = false;
}

Personnages.prototype.deplacementVers = function(x, y){
	this.temps = new Date().getTime(); //temps de début de déplacement

	this.destX = x;
	this.destY = y;
	
	this.enDeplacementClavier = false;
	this.enDeplacementSouris = true; //le joueur se déplace maintenant	
}

/*
 * indique si le déplacement est possible (collision) ou non
 */
Personnages.prototype.detecteCollision = function(grilleCollision){
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

Personnages.prototype.calculDeplacement = function(grilleCollision){
	if(this.connecte){
	
		if (!this.detecteCollision(grilleCollision)) {
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
						this.enDeplacementSouris = false; //on est arrivé
					}
			}	
			this.temps = temps; //maj du temps du dernier appel
		}
		}
	}
}

/*
 * dessine le personnage dans le contexte passé en argument
 */
Personnages.prototype.drawPerso = function(contexte, xJoueur, yJoueur){
	if (this.connecte){
	
		var l = this.largeurUneAnim,
			h = this.hauteurUneDir;
			
		var sprit = 0;
		
		if (this.enDeplacementClavier || this.enDeplacementSouris){
			sprit = ((this.frameEnCoursSprit / (60/(1000*this.vitesse))) | 0 ) % this.nbAnimation;		
			this.frameEnCoursSprit++;
		}
	
		var distX = Math.abs(xJoueur - this.x),
			distY = Math.abs(yJoueur - this.y);
			
		var signX = (this.x < xJoueur) ? -1 : 1,
			signY = (this.y < yJoueur) ? -1 : 1;
		
		//offset X Y de position par rapport au joueur
		var xDest = (signX*distX + this.position_ecran_x -1/2)*this.largeurTuile,
			yDest = (signY*distY + this.position_ecran_y -1/2)*this.hauteurTuile;
	
		if (distX <= this.position_ecran_x+5 && distY <=  this.position_ecran_y+5){
			contexte.drawImage( // API HTML5 JAVASCRIPT (+ optimisé que JQuery)
				this.image,
				sprit*l, this.direction*h,
				l, h,
				xDest, yDest - l,
				l, h
			);
		}
	}
}
