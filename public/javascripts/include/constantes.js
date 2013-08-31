/*
 * VARIABLES GLOBALES
 */
var FPS = 60;

var DIRECTION = {
	'STOP' : -1,
	'HAUT' : 3,
	'BAS' : 0,
	'GAUCHE' : 1,
	'DROITE' : 2
};

var OPCODE = {
	'MOVE_HAUT' : 3,
	'MOVE_BAS' : 0,
	'MOVE_GAUCHE' : 1,
	'MOVE_DROITE' : 2,
	'STOP' : -1,
	'MOVE_TO' : 4
}

var CANVAS = {
	'EDITEUR' : 0,
	'PALETTE' : 1
}

var CAMERA = {
	'MOVE' : 0,
	'SET' : 1
}

var GROUND = {
	'BACKGROUND' : 0,
	'FOREGROUND' : 1,
	'COLLISION' : 2
}

var COLLISION = {
	'COLLISION' : 1,
	'PAS_COLLISION' : 0,
	'FORE' : 2
}

var STAT = {
	'BEHIND' : 0,
	'FORE' : 1
}

var ELEMENT = {
	'RECUP_INIT' : 0,
	'INIT' : 1,
	'MAP_TILESET' : 2,
	'MAP_REP' : 6,
	'FG_TILESET' : 3,
	'FG_REP' : 7,
	'JOUEUR' : 4,
	'EDITEUR_BG_TS' : 5,
	'EDITEUR_FG_TS' : 8,
	'EDITEUR_BG_IMG' : 9,
	'EDITEUR_FG_IMG' : 10
}

/*
 * etit polyfill pour la gestion de window.requestAnimationFrame
 */
window.requestAnimFrame = (function(){ 
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};
})();

/*
 * fonctions globales utiles
 */
function trunc(n){
	return Math.floor(n);
}

function frac(n) {
    return n - trunc(n);
}

function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

function avancementChargement(elem, droitEditeur){
	var progressText = document.getElementById('progressText');
	var progressBarre = document.getElementById('progressBarre');
	
	switch (elem){
		case ELEMENT.RECUP_INIT :
			progressBarre.value += 5;
			progressText.innerText = "Récupération d'informations";
			if (droitEditeur == null || droitEditeur == 0){
				progressBarre.value += 4*9;
			}
			break;
		case ELEMENT.INIT :
			progressBarre.value += 10;
			progressText.innerText = "Initialisation du jeu";
			break;
		case ELEMENT.MAP_TILESET :
			progressBarre.value += 10;
			progressText.innerText = "Initialisation de la carte";
			break;
		case ELEMENT.MAP_REP :
			progressBarre.value += 10;
			progressText.innerText = "Initialisation de la carte";
			break;
		case ELEMENT.FG_TILESET :
			progressBarre.value += 10;
			progressText.innerText = "Initialisation du décor";
			break;
		case ELEMENT.FG_REP :
			progressBarre.value += 10;
			progressText.innerText = "Initialisation du décor";
			break;
		case ELEMENT.JOUEUR :
			progressBarre.value += 9;
			progressText.innerText = "Initialisation des joueurs";
			break;
		case ELEMENT.EDITEUR_BG_TS :
			progressBarre.value += 9;
			progressText.innerText = "Initialisation du background de l'éditeur";
			break;
		case ELEMENT.EDITEUR_FG_TS :
			progressBarre.value += 9;
			progressText.innerText = "Initialisation du foreground de l'éditeur";
			break;
		case ELEMENT.EDITEUR_BG_IMG :
			progressBarre.value += 9;
			progressText.innerText = "Initialisation du background de l'éditeur";
			break;
		case ELEMENT.EDITEUR_FG_IMG :
			progressBarre.value += 9;
			progressText.innerText = "Initialisation du foreground de l'éditeur";
			break;
	}
	
	if(progressBarre.value == 100){
		var chargement = $('#chargement-mmo');
		var mmo = $('#mmo');
		
		chargement.fadeOut('slow',function(){
			mmo.fadeIn('fast');
		});
	}
}


