/*
 * classe principale du MMO, elle init 
 * tous les éléments du DOM (canvas)
 * la couche réseau
 * tous les objets permettant le fonctionnement du mmo
 */
function Mmo(){
	var monMmo = this;
	
	this.ioCom = new IOcommunication(); //init couche réseau
	this.ioCom.ouvreSocket(); //ouverture socket avec serveur
	
	this.init = {};
	
	this.droitEditeur = 0;
	
	this.grilleCollision = {}; //graphe de collision
	this.grilleFore = {}; //graphe de collision
	
	this.zones = {}; //graphe de collision
	
	//a la reception de la reponse d'init
	this.ioCom.repInitEngine(function(data){
		if (data.erreur){
			console.log('erreur repInitEngine');
		} else {	
			monMmo.init.x = parseInt(data.x); //position du joueur
			monMmo.init.y = parseInt(data.y);
			monMmo.init.urlSprit = data.urlSprit; //url du sprit du joueur
			monMmo.init.largeurSprit = parseInt(data.largeurSprit); //largeur du sprit du joueur
			monMmo.init.hauteurSprit = parseInt(data.hauteurSprit); //hauteur
			monMmo.init.direction = parseInt(data.direction); //direction
			monMmo.init.vitesse = parseInt(data.vitesse); //vitesse
			monMmo.init.nbAnimation = parseInt(data.nbAnimation); //nombre d'animation contenu dans la sprit
			monMmo.init.idPerso = data.idPerso; //id du perso en DB
			monMmo.init.position_ecran_x = parseInt(data.position_ecran_x); //position du personnage à l'écran (par rapport à la surface affichée)
			monMmo.init.position_ecran_y = parseInt(data.position_ecran_y);
			monMmo.init.largeurTuile = parseInt(data.largeurTuile); //largeur d'une tuile de la map
			monMmo.init.hauteurTuile = parseInt(data.hauteurTuile);
			
			monMmo.init.urlForeground = data.urlForeground; //url du tileSet(background uniquement)
			monMmo.init.urlTuiles = data.urlTuiles; //url du tileSet(background uniquement)
			monMmo.init.largeurTuile = parseInt(data.largeurTuile); //largeur d'une tuile de la map
			monMmo.init.hauteurTuile = parseInt(data.hauteurTuile); // hauteur ""
			monMmo.init.largeurEcran = parseInt(data.largeurEcran); //largeur ecrane en nombre de tuile
			monMmo.init.hauteurEcran = parseInt(data.hauteurEcran); //largeu ""
			
			monMmo.droitEditeur = data.droitEditeur;
			
			avancementChargement(ELEMENT.RECUP_INIT, data.droitEditeur);
			
			monMmo.initMmo();
		}
	});
	
	//on envoi la demande d'init
	this.ioCom.reqInitEngine();
};

/*
 * après récéption des paramètres d'init, on init le jeu
 */
Mmo.prototype.initMmo = function(){
	var monMmo = this;
	var ioCom = monMmo.ioCom;
	
	var largeurTuile = this.init.largeurTuile,
		hauteurTuile = this.init.hauteurTuile,
		largeurEcran = this.init.largeurEcran,
		hauteurEcran = this.init.hauteurEcran,
		position_ecran_x = this.init.position_ecran_x,
		position_ecran_y = this.init.position_ecran_y;
		
	//on affecte à la boite de paramètres les valeurs connues en DB
	document.getElementById('largeurEcran').value = largeurEcran;
	document.getElementById('hauteurEcran').value = hauteurEcran;
	document.getElementById('position_ecran_x').value = position_ecran_x;
	document.getElementById('position_ecran_y').value = position_ecran_y;
	
	/*
	 * init canvas
	 */
	var canvas_background = document.getElementById('background'), //canvas du background
		canvas_joueurs = document.getElementById('joueurs'), //canvas du joueur (au dessus avec z-index)
		canvas_objets = document.getElementById('objets');
		
	this.canvas_background = canvas_background;
	this.canvas_joueurs = canvas_joueurs;
	this.canvas_objets = canvas_objets;
		
	this.ctx_background = canvas_background.getContext("2d");
	//this.ctx_joueurs = canvas_joueurs.getContext("2d");
	this.ctx_objets = canvas_objets.getContext("2d");
		
	//taille des canvas
	canvas_background.width = largeurEcran*largeurTuile;
	canvas_background.height = hauteurEcran*hauteurTuile;
	//canvas_joueurs.width = largeurEcran*largeurTuile;
	//canvas_joueurs.height = hauteurEcran*hauteurTuile;
	canvas_objets.width = largeurEcran*largeurTuile;
	canvas_objets.height = hauteurEcran*hauteurTuile;

	
	//recup left top canvas
	this.top_canvas = null,
	this.left_canvas = null;
	this.left_canvas_palette = null;
	this.top_canvas_palette = null;
	
	if (this.droitEditeur){
		var canvas_editeur = document.getElementById('editeur'), //canvas du editeur
			canvas_palette = document.getElementById('palette'), //canvas du palette
			canvas_tuileSelect = document.getElementById('tuileSelect'); //canvas du palette
			
		this.canvas_editeur = canvas_editeur;
		this.canvas_palette = canvas_palette;
		this.canvas_tuileSelect = canvas_tuileSelect;
			
		this.ctx_editeur = canvas_editeur.getContext("2d");
		this.ctx_palette = canvas_palette.getContext("2d");
		this.ctx_tuileSelect = canvas_tuileSelect.getContext("2d");
			
		canvas_editeur.width = 20*largeurTuile;
		canvas_editeur.height = 17*hauteurTuile;
		canvas_palette.width = 10*largeurTuile;
		canvas_palette.height = 5*hauteurTuile;
		canvas_tuileSelect.width = largeurTuile;
		canvas_tuileSelect.height = hauteurTuile;
		
		/*monMmo.top_canvas_palette = getOffset(canvas_palette).top,
		monMmo.left_canvas_palette = getOffset(canvas_palette).left;*/
	}
		
	avancementChargement(ELEMENT.INIT);
	
	//JEU
	this.maCarte = new Map(monMmo); //background + gestion perso
	this.foreGround = new Foreground(monMmo); //foreground + gestion objet dyn
	this.joueur = new Joueur(monMmo); //joueur	
	
	var maCarte = this.maCarte;
	var foreGround = this.foreGround;
	var joueur = this.joueur;

	//TCHAT
	this.tchat = new Tchat(ioCom);

	//EDITEUR
	if (this.droitEditeur){
		this.editeur = new Editeur(monMmo); //editeur
		var monEditeur = this.editeur;
	}
	
	maCarte.setJoueur(joueur);
	foreGround.setJoueur(joueur);
	
	/*
	 * sockets listenner
	 */
	 //reception de la liste des joueurs aux alentours
	ioCom.repJoueursAutour(function(data){
		if (!data.erreur){
			var perso = null;
			for (var i in data){ //i est l'indice du perso en DB
				perso = data[i];
				perso.position_ecran_x = position_ecran_x; //on ajoute au data reçu ces info nécessaires pour le dessin du personnage
				perso.position_ecran_y = position_ecran_y; //position du perso relative à la surface affichée
				perso.largeurTuile = largeurTuile; //largeur des tuiles affichées
				perso.hauteurTuile = hauteurTuile;
				
				if (!foreGround.persoConnu(i)){ //le perso n'est pas connu
					var monPerso = new Personnages(perso);
					foreGround.addPerso(monPerso);
				} else { //le perso est connu : on met a jours le temps où on l'a vu pour la derniere fois
					foreGround.personnages[i].dernierTempsConnu = new Date().getTime();
					foreGround.personnages[i].connecte = true;
				}
			}
		}
		
		for (var i in foreGround.personnages){ //on check tous les perso et on regarde s'il ne sont pas connu depuis plus de 5000ms
			if (new Date().getTime() - foreGround.personnages[i].dernierTempsConnu > 50000){
				delete foreGround.personnages[i];
			} else if (new Date().getTime() - foreGround.personnages[i].dernierTempsConnu > 5000){
				foreGround.personnages[i].connecte = false;
			}
		}
		
	});
	
	//recepetion de la liste des objets autour
	ioCom.repObjetsAutour(function(data){
		if (!data.erreur){
			var objet = null;
			for (var i in data){ //i est l'indice du perso en DB
				objet = data[i];
				objet.position_ecran_x = position_ecran_x; //on ajoute au data reçu ces info nécessaires pour le dessin du personnage
				objet.position_ecran_y = position_ecran_y;
				objet.largeurTuile = largeurTuile;
				objet.hauteurTuile = hauteurTuile;
				
				if (!foreGround.objetConnu(i)){ //le perso n'est pas connu
					var monObjet = new Objets(objet, monMmo.grilleCollision);
					foreGround.addObjet(monObjet);
				} else { //le perso est connu : on met a jours le temps où on l'a vu pour la derniere fois
					foreGround.objets[i].dernierTempsConnu = new Date().getTime();
				}
			}
		}
	});
	
	//event on reception ACK op joueur
	ioCom.repAckOP(function(data){
		//console.log(data);
		if (data.erreur || data.collision){
			joueur.AckImpossible();
		}
	});
	
	//reception d'une opération concennant un joueur : met à jours les personnages avec cette information
	ioCom.repOpJoueur(function(data){
		if(foreGround.personnages[data.idPerso]){
			foreGround.personnages[data.idPerso].OPJoueur(data);
		}
	});
	
	//reception d'un heartbeat concernant un perso : on met a jours le personnages avec cette information
	ioCom.repHeartBeat(function(data){
		if (data.idPerso == joueur.idPerso){
			joueur.heartBeatJoueur(data);
		} else {
			if(foreGround.personnages[data.idPerso]){
				foreGround.personnages[data.idPerso].majHeartBeat(data);
			}
		}
	});
	
	//gestion de la latence 
	var tabPing = [];
	var divLatence = document.getElementById('latence');
	
	ioCom.repPong(function(data){ //latence
		var sumLatence = 0;
		var cpt = 0;
		var idPing = data.idPing;
		var latence = 0;
		for (var i in tabPing){ 
			if (tabPing[i].idPing == idPing){ //on recherche dans notre tableau de ping l'id correspondant
				tabPing[i].latence = new Date().getTime() - tabPing[i].tsEnvoi;
				latence = tabPing[i].latence;
			}
		}
		
		for (var j in tabPing){
			if (tabPing[j].latence){
				sumLatence += tabPing[j].latence;
				cpt++;
			}
		}
		monMmo.latence = sumLatence / cpt;
		monMmo.latence.toFixed(3);
		
		if (Math.abs(monMmo.latence - latence) > 300){ //si trop grand écart, on vide le tableau
			monMmo.latence = latence;
			tabPing = [];
		}
		
		joueur.majLatence(mmo.latence);
		for (var k in foreGround.personnages){
			foreGround.personnages[k].majLatence(mmo.latence);
		}
		
		ioCom.repPingPong(idPing);	
		
		divLatence.innerText = 'Latence moyenne : ' + (monMmo.latence | 0) + ' ms';
	
		if (tabPing.length > 10){
			tabPing.shift();
		}
	});
	
	var idPing = 0;
	setInterval(function(){
		monMmo.ioCom.reqPing(idPing); //on envoi un ping avec un certain id
		tabPing.push({idPing : idPing, tsEnvoi : new Date().getTime()}); //on push dans le tableau le temps d'envoi + l'id
		
		idPing++;
	},1000);
	
	//lancement de la boucle principale du progamme
	this.bouclePrincipale();
};

Mmo.prototype.bouclePrincipale = function(){
	var monMmo = this;
	var maCarte = monMmo.maCarte;
	var foreGround = monMmo.foreGround;
	var joueur = monMmo.joueur;
	var monEditeur = monMmo.editeur;
	var ioCom = monMmo.ioCom;
		
	var largeurTuile = monMmo.init.largeurTuile,
		hauteurTuile = monMmo.init.hauteurTuile,
		largeurEcran = monMmo.init.largeurEcran,
		hauteurEcran = monMmo.init.hauteurEcran,
		position_ecran_x = monMmo.init.position_ecran_x,
		position_ecran_y = monMmo.init.position_ecran_y;

	
	/*
	 * fonction de rafraichissement de la carte
	 */
	function refreshMap(time){ //fonction locale de refresh de la carte
		if (maCarte.ready()){
			maCarte.drawMap(); //Pre-rendering (ACTUELLEMENT DESACTIVE car moins performant)
			foreGround.drawMap();
		}
	}

	/*
	 * Lancement de la boucle d'affichage
	 */
	setInterval(function(){
		window.requestAnimFrame(refreshMap);
	},1000/FPS); //afin de réguler les FPS 
	
	
	/*
	 * récupération des objets et joueurs autour ttes les 10 secondes (à améliorer)
	 */
	setInterval(function(){		
		ioCom.reqJoueursAutour(joueur.idPerso, trunc(joueur.x), trunc(joueur.y));
		//ioCom.reqObjetsAutour(joueur.idPerso, trunc(joueur.x), trunc(joueur.y));
	},10000); 
	ioCom.reqJoueursAutour(joueur.idPerso, trunc(joueur.x), trunc(joueur.y));
	//ioCom.reqObjetsAutour(joueur.idPerso, trunc(joueur.x), trunc(joueur.y));	
};

//lancement constructeur de l'objet
var mmo = new Mmo();

/*
 * JS de la page (en attente du chargement du DOM)
 */
$(function(){
	var bouton_jeu = $('#bouton-jeu'), //bouton du NAV gauche : JEU
		bouton_param = $('#bouton-parametre'),
		jeu = $('#zone-jeu'), //DIV JEU
		parametre = $('#zone-parametre'),
		class_ecran = $('.zone-ecran'),
		class_dialog = $('.boite-dialogue'),
		valideParam = $('#submit-parametre');
		
	var bouton_tchat = $('#message-submit');
		
	/*
	 * NAV
	 * bouton du menu (jeu, editeur, inventaire, etc)
	 */
	bouton_jeu.on('click',function(){
		mmo.joueur.jeuActif = true;
		mmo.editeur.editeurActif = false;
		class_dialog.fadeOut();
		class_ecran.fadeOut();
		jeu.fadeIn();
	});	
	bouton_param.on('click',function(){
		parametre.fadeIn();
	});
	
	/*
	 * ZONE PARAMETRE
	 */
	//au click sur le bouton valider de la fenetre paramètre
	valideParam.on('click',function(){
		var largeurEcran = $('#largeurEcran').val(), //entre 20 et 60
			hauteurEcran = $('#hauteurEcran').val(), //entre 15 et 30
			position_ecran_x = $('#position_ecran_x').val(),
			position_ecran_y = $('#position_ecran_y').val(),
			probleme = document.getElementById('probleme-parametre');
			
		if (!(largeurEcran > 60 || largeurEcran < 20)){ //largeur valide
			if (!(hauteurEcran > 30 || hauteurEcran < 15)){ //hauteur valide
				if (!(position_ecran_x > largeurEcran -1 || position_ecran_x < 0)){ //position ecran x valide
					if (!(position_ecran_y > hauteurEcran - 1 || position_ecran_y < 0)){ //position ecran y valide
						// OK on informe le serveur des nouveaux paramètres			
						mmo.ioCom.reqSauvParam(mmo.init.idPerso, largeurEcran,hauteurEcran, position_ecran_x, position_ecran_y);
						probleme.innerText = '';
						parametre.fadeOut();
					} else { //position y invalide
						probleme.innerText = 'Position Y invalide';
					}
				} else { //position x invalide
					probleme.innerText = 'Position X invalide';
				}
			} else { //hauteur invalide
				probleme.innerText = 'Hauteur Invalide';
			}
		} else { //largeur invalide
			probleme.innerText = 'Largeur Invalide';
		}
			
		return false;
	});
	
	/*
	 * TCHAT
	 */
	bouton_tchat.on('click',function(){
		var message = $('#message-tchat');
		
		if (message != ''){
			mmo.tchat.envoiMessage(message.val());
			message.val('');
		}
		
		return false;
	});
});
























