/*
 * classe gérant les personnages (le joueur sera affiché à l'écran comme un personnage classique (et comme un objet))
 */

function Objets(donneesObjet, grilleCollision){	
	var monObjet = this;
	this.idObjet = donneesObjet.idObjet;
	
	this.grilleCollision = grilleCollision;
	
	//position
	this.x = donneesObjet.x; //position du personnage
	this.y = donneesObjet.y;	
	this.position_ecran_x = donneesObjet.position_ecran_x;
	this.position_ecran_y = donneesObjet.position_ecran_y;
	
	this.largeurObjet = donneesObjet.largeur;
	this.hauteurObjet = donneesObjet.hauteur;
	this.hauteurTuile = donneesObjet.hauteurTuile;
	this.largeurTuile = donneesObjet.largeurTuile;
	
	this.pret = false; //sprit chargée

	this.dernierTempsConnu = new Date().getTime();
	
	//sprit
	this.image = new Image();
	this.image.myClass = this;
	this.image.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");

		this.myClass.pret = true;
		
		//on met a jours la grille de collision
		if (donneesObjet.walkover == 0){
			var x = monObjet.x * monObjet.largeurTuile;
			var y = 0;
			while (x < monObjet.x * monObjet.largeurTuile + monObjet.largeurObjet){
				y = monObjet.y * monObjet.hauteurTuile;
				while (y > monObjet.y * monObjet.hauteurTuile - monObjet.hauteurObjet){
					monObjet.grilleCollision[x/monObjet.largeurTuile][y/monObjet.hauteurTuile] = 1;
					y -= monObjet.hauteurTuile;
				}
				x += monObjet.largeurTuile;
			}	
		}
	};
	this.image.src =  donneesObjet.urlDecor;
}


/*
 * dessine l'objet dans le contexte passé en argument
 */
Objets.prototype.drawObjet = function(contexte, xJoueur, yJoueur){
	var l = this.largeurObjet,
		h = this.hauteurObjet;

	var distX = Math.abs(xJoueur - this.x),
		distY = Math.abs(yJoueur - this.y);
		
	var signX = (this.x < xJoueur) ? -1 : 1,
		signY = (this.y < yJoueur) ? -1 : 1;
	
	//offset X Y de position par rapport au joueur
	var xDest = (signX*distX + this.position_ecran_x)*this.largeurTuile,
		yDest = (signY*distY + this.position_ecran_y)*this.hauteurTuile;
	
	if (distX <= this.position_ecran_x+5 && distY <=  this.position_ecran_y+5){ //si le personnage est hors écran, inutile de l'afficher
		contexte.drawImage( // API HTML5 JAVASCRIPT (+ optimisé que JQuery)
			this.image,
			0, 0,
			l, h,
			xDest, yDest - l,
			l, h
		);
	}
};
