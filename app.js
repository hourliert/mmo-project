/**
 * Module dependencies.
 */
var express = require('express'),
	http = require('http'),
	path = require('path'),
	socketio = require('socket.io'),
	sessionsocketsio = require('session.socket.io');
		
var cookieParser = express.cookieParser('uizherh54tj'),
	sessionStore = new express.session.MemoryStore(); //stockage 
    
var app = express(),
	server = http.createServer(app); 

/*
 * Paramètres serveur :
 */
app.configure('dev',function(){
	app.set('db', 'dmmo');
});
app.configure('prod',function(){
	//app.set('db', 'mmo');
	app.set('db', 'dmmo');
});
//app.set('port', process.env.PORT); //port du server
app.set('port', 8080); //port du server
app.set('views', __dirname + '/views'); // chemin des views (pour ejs)
app.set('view engine', 'ejs');	//ejs 

/*
 * connexion à la DB
 */
require('./models/opDB').initConnexion(app.get('db'));

/*
 * middleware
 */
app.use(express.favicon()); //facivon du site (défaut : exress)
app.use(express.logger()); //active log (console)
app.use(express.bodyParser()); //parse le corps de la requête (JSON, URLdecode multipart (file))
app.use(express.methodOverride()); //authorise l'utilisation de .put et .del'
app.use(cookieParser);
app.use(express.session({store : sessionStore}));
app.use(app.router); //permet de monter les routes
app.use(express.static(path.join(__dirname, 'public'))); //définie l'emplacement des ressources dispo aux users (monter avec app.router)

// development only
app.configure('dev',function(){
	app.use(express.errorHandler());
});

//cache du serveur : globaleOS
var globaleOS = {};
globaleOS.terrain = {}; //cache du terrain
globaleOS.terrainFG = {}; //cache du terrain foreground
globaleOS.grilleCollision = {}; //grille de collision

//socket io
var io = socketio.listen(server),
	sessionSockets = new sessionsocketsio(io, sessionStore, cookieParser); //socket io : ecoute sur le server

/*
 * configure socket.io
 */
io.set('log level', 2);
io.set('browser client minification', true);

/*
 * sockets
 */
/*
 * a chaque nouvelle connexion, socket et session sont propres au client connecté
 * on vérifie en plus que l'idPerso envoyé lors des reuqêtes client et correct et correspond bien
 * avec sont id de compte sauvegardé en session
 */
sessionSockets.on('connection', function (err,socket,session) {		
	var globale = {}; //info globale en rapport avec le client connecté via le socket
	
	if (typeof session === 'undefined' || typeof session.idCompte === 'undefined' || typeof session.idPerso === 'undefined'){ //en cas de non detection de session, on ferme immédiatement le socket ouvert
		socket.disconnect('session');
	} else {
		//on recupere les infos de la session (pendant le handshake) et on les stocke de manière globale + les parametres GLOBAUX identiques pour chaque client
		globale.idCompte = session.idCompte; 
		globale.idPerso = session.idPerso;
		globale.droitEditeur = session.droitEditeur;
		
		globale.hauteurEcran = session.hauteurEcran;
		globale.largeurEcran = session.largeurEcran;
		globale.position_ecran_x = session.position_ecran_x;
		globale.position_ecran_y = session.position_ecran_y;
		
		for (var i in session.persos[globale.idPerso]){
			globale[i] = session.persos[globale.idPerso][i];
		}
		globale.minX = globaleOS.minX;
		globale.maxX = globaleOS.maxX;
		globale.minY = globaleOS.minY;
		globale.maxY = globaleOS.maxY;
		globale.globaleOS = globaleOS;
		
		globale.idHB = 0; //id de l'heartbeat envoyé
		globale.idOP = -1;
		
		/*
		 * requete Ping Pong
		 */
		var tabPing = [];
		
		socket.on('reqPing', function(data){
			var idPing = data.idPing;
			socket.emit('repPong', {'idPing' : idPing});
			tabPing.push({idPing : idPing, tsEnvoi : new Date().getTime()});
		});
		socket.on('repPingPong',function(data){
			var idPing = data.idPing;
			var sumLatence = 0;
			var cpt = 0;
			
			for (var i in tabPing){ 
				if (tabPing[i].idPing == idPing){ //on recherche dans notre tableau de ping l'id correspondant
					tabPing[i].latence = new Date().getTime() - tabPing[i].tsEnvoi;
				}
			}
			
			for (var j in tabPing){
				if (tabPing[j].latence){
					sumLatence += tabPing[j].latence;
					cpt++;
				}
			}
			globale.latence = sumLatence / cpt;
			globale.latence.toFixed(3);
			
			if (tabPing.length > 10){
				tabPing.shift();
			}
		});	
		
		//initiailisation du jeu
		socket.on('reqInitEngine', function(pInit){
			require('./controllers/init').coPerso(globale); //on indique en DB que le perso est connecté
			require('./routes/init').valideInit(socket, globale, pInit); //on recup les info le concernant pou les lui envoyer
		});
		
		//demande de la carte par le client
		socket.on('reqCarte',function(pCarte){
			require('./routes/map').valideMap(socket, globale, pCarte);
		});
		
		//demande de la carte de l'éditeur par le client
		socket.on('reqCarteEditeur',function(pCarte){
			require('./routes/map').valideMapEditeur(socket, globale, pCarte);
		});
		
		//demande du client pour sauvegarder la map de l'éditeur
		socket.on('reqSauvMapDB',function(pCarte){
			require('./routes/map').sauvMapDB(socket, globale, pCarte);
		});
		
		//action du joueur (opération de mouvement)
		socket.on('reqOpJoueur',function(pOPJoueur){
			require('./routes/joueur').traiteOpCode(socket, globale, pOPJoueur);		
		});
		
		//demande de la liste des joueurs autour du joueur
		socket.on('reqJoueursAutour',function(pPerso){
			require('./routes/personnages').valideJoueurAutour(socket, globale, pPerso);	
		});
		
		//demande de la liste des objets dynamiques autour du joueur
		socket.on('reqObjetsAutour',function(pPerso){
			require('./routes/objets').valideObjetAutour(socket, globale, pPerso);	
		});
		
		//demande du client pour sauvegarder ses paramètres
		socket.on('reqSauvParam',function(pParam){
			require('./routes/ui').sauvParam(socket, globale, pParam);
		});
		
		//reception messagedu tchat d'un client 
		socket.on('reqEnvoiMsgTchat',function(message){
			require('./routes/ui').addMessageTchat(socket, globale, message);
		});
		
		//deconnexion du joueur, on indique en DB que le joueur est deconnecté
		socket.on('disconnect', function(){
			require('./controllers/init').decoPerso(globale);
			session.destroy();
		});
	}
});


/*
 * ROUTES DYN
 */

//cross domain
app.all('/', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://cnode.fr");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

//index
app.get('/',function(req, res){
	res.render('index', {login : null, password : null, creationPerso : null});
});

//page d'inscription'
app.get('/inscription',function(req, res){
	res.render('inscription');
});

//page d'un nouveau perso'
app.get('/nouveauPerso',function(req, res){
	res.render('creationPerso');
});

//page à propos
app.get('/apropos',function(req, res){
	res.render('apropos');
});

//connexion au jeu (verif pass en DB hashé)
app.post('/',function(req,res){
	require('./routes/site').recupPerso(req, res);
});

//connexion au jeu (verif pass en DB hashé)
app.post('/jeu',function(req,res){
	require('./routes/site').connexionIG(req, res);
});

//validation de l'inscription
app.post('/valideInscription',function(req,res){
	require('./routes/site').inscriptionCompte(req, res);
});

//validation de la création d'un personnage
app.post('/validePerso',function(req,res){
	require('./routes/site').creationPerso(req, res);
});

//test si le login demandé est disponnible
app.post('/loginDispo',function(req,res){
	require('./routes/site').loginDispo(req, res);
});

//test si le email demandé est disponnible
app.post('/emailDispo',function(req,res){
	require('./routes/site').emailDispo(req, res);
});

//test si le nom demandé est disponnible
app.post('/nomDispo',function(req,res){
	require('./routes/site').nomDispo(req, res);
});

/*
 * lancement du serveur
 */
server.listen(app.get('port'), function(){
  console.log('Node.js MMO server listening on port ' + app.get('port'));
});
