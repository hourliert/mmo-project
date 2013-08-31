

var controller = require('../controllers/init');

/*
 * le router s'occupe de parser l'URL et le body et d'appeler 
 * la bonne fonction du controler pour effectuer le traitement
 */
exports.valideInit = function(socket, globale, pInit){
	if (pInit.pret){ //le client est prêt a etre initialisé
		controller.envoyerInit(socket, globale);
	} else {
		socket.emit('repInitEngine', {erreur : 1});
	}
}