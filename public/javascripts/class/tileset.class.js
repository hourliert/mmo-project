/*
 * Classe de gestion des tileset
 * 
 */
function Tileset(url, largeurTuile, hauteurTuile, callback){
	this.pret = false;
	this.largeurTuile = largeurTuile;
	this.hauteurTuile = hauteurTuile;
	this.image = new Image();
	this.image.myClass = this;
	
	this.image.onload = function() {
		if(!this.complete) 
			throw new Error("Erreur de chargement du tileset nommé \"" + url + "\".");
		
		// Largeur du tileset en tiles
		this.myClass.nbTuileLarg = this.width / largeurTuile;
		this.myClass.nbTuileHaut = this.height / hauteurTuile;
		this.myClass.pret = true;
		
		if(callback != null){
			callback();
		}
	}
	this.image.src =  url;
}

/*
 * dessine 1 tuile numéro en xDest, yDest su le canvas de contexte contexte 
 * les numeros des tuiles sur un tileset commencent à 0 et s'incrémente de 1 horizontallement
 */
Tileset.prototype.drawTile = function(contexte, numero, xDestination, yDestination) {
	
	if (!this.pret){
		return false;
	}
	
	var largeurTuile = this.largeurTuile;
	var hauteurTuile = this.hauteurTuile;
	
	var xSourceEnTiles = numero % this.nbTuileLarg;
	var ySourceEnTiles = Math.floor(numero / this.nbTuileLarg);
	
	var xSource = xSourceEnTiles * 32;
	var ySource = ySourceEnTiles * 32;
	
	contexte.drawImage( // API HTML5 JAVASCRIPT (+ optimisé que JQuery)
		this.image,
		xSource, ySource,
		largeurTuile, hauteurTuile,
		xDestination, yDestination,
		largeurTuile, hauteurTuile
	);
}

/*
 * dessine en transparence un rectangle vert ou rouge indiquant si le joueur doit rencontrer une collision avec cette case
 */
Tileset.prototype.drawTileCollision = function(contexte, xDestination, yDestination, collision) {
	if (!this.pret){
		return false;
	}
	
	var largeurTuile = this.largeurTuile;
	var hauteurTuile = this.hauteurTuile;
	
	if (collision != null){ //cet argument n'est pas vide
		if (collision == COLLISION.COLLISION){ //on ne peut pas marcher (donc rouge)
			contexte.fillStyle = 'rgba(127,0,0,0.7)';
			contexte.fillRect(xDestination,yDestination,largeurTuile,hauteurTuile);
		} else if(collision == COLLISION.PAS_COLLISION){ //on peut marcher (donc vert)
			contexte.fillStyle = 'rgba(0,127,0,0.7)';
			contexte.fillRect(xDestination,yDestination,largeurTuile,hauteurTuile);
		} else if(collision == COLLISION.FORE){ //on peut marcher (donc vert)
			contexte.fillStyle = 'rgba(0,0,127,0.7)';
			contexte.fillRect(xDestination,yDestination,largeurTuile,hauteurTuile);
		}
	}
	
}

