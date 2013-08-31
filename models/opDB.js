/*
 * model avec opération sur la DB
 */

var mysql = require('mysql');
var async = require('async');
var crypto = require('crypto');
	
var connexion = null;

exports.initConnexion = function(db){
	connexion = mysql.createConnection({
		host     : 'localhost',
		user     : 'thomas',
		password : '0209mille991',
		database : db
	});
	
	//connexion à la DB
	connexion.connect(function(err){
		if (err) throw err;
		console.log('Connected to the MySQL database ' + db);
	}); 	
}

/*
 * recupere la liste des personnages associés à un compte
 */
exports.listePerso = function(login, pass, callback){
	var query = 'SELECT * FROM mmo_comptes WHERE login=' + connexion.escape(login) + ' AND password=' + connexion.escape(pass);
	
	connexion.query(query, function(err, rows, fields){ //dès que la requête est terminée, on la traite
		if (err) throw err; //erreur
		if (rows.length){ //le compte existe en DB
			var idCompte = rows[0].idCompte;
			var query_perso = 'SELECT * FROM mmo_personnages WHERE idCompte=' + idCompte;
			connexion.query(query_perso, function(err2, rows2, fields2) { //dès que la requête est terminée, on la traite
				if(err2) throw err2;
				if(rows2.length){ //les personnages du compte sont trouvé
					//on appel le callback
					callback(idCompte, rows2, rows[0].editeur);
				} else {
					callback(idCompte, -1, 0);
				}
			});
		} else {
			callback(-1, -1);
		}
	});
}

/*
 * recupere la liste de tous les parametres en DB utile pour l'init et appel le callback
 */

exports.recupParamInit = function(callback){
	var tab_queries = ['SELECT nom, valeur FROM mmo_parametres'];
	var retourCB = [];
	
	async.each(tab_queries, function(query, next){
		connexion.query(query, function(err, rows, fields){
			if (err) throw err;
			if (rows.length){
				for (var i in rows){
					retourCB.push(rows[i]);
				}
			} else {
				retourCB = -1;
			}		
			next();
		})
	}, function(err){
		if (err) throw err;
		callback(retourCB);
	});
}

/*
 * recup l'id de la zone du joueur
 */
exports.recupIdZone = function(x, y, callback){
	var sql = 'SELECT idZone FROM mmo_carte WHERE x=' + connexion.escape(x) + ' AND y=' + connexion.escape(y);

	connexion.query(sql, function(err, rows, fields){
		if (rows.length){
			callback(rows[0].idZone);
		} else {
			callback(-1);
		}
	});
}

/*
 * recup les info d'une zone
 */
exports.recupInfoZone = function(idZone, callback){
	var sql = 'SELECT * FROM mmo_zones WHERE idZone=' + idZone;

	connexion.query(sql, function(err, rows, fields){
		if (rows.length){
			callback(rows[0]);
		} else {
			callback(-1);
		}
	});
}

/*
 * recupere la portion de map et appel le callback
 */
exports.recupMap = function(idZone, callback){
	var sql = 'SELECT * FROM mmo_carte WHERE idZone=' + idZone;
		
	connexion.query(sql, function(err, rows, fields){
		if (rows.length){
			callback(rows);
		} else {
			callback(-1);
		}
	});
}

/*
 * recupere la portion du FG et appel le callback
 */
exports.recupFG = function(idZone, callback){
	var sql = 'SELECT * FROM mmo_foreground WHERE idZone=' + idZone;
		
	connexion.query(sql, function(err, rows, fields){
		if (rows.length){
			callback(rows);
		} else {
			callback(-1);
		}
	});
}

/*
 * met a jours la position du joueur en Db
 */
exports.updatePosition = function(posX, posY, direction, idPerso){
	var sql = "UPDATE mmo_personnages SET x=" + connexion.escape(posX) + ',y=' + connexion.escape(posY)+ ', direction=' + connexion.escape(direction)
	 + ' WHERE idPerso=' + idPerso;

	connexion.query(sql,function(err, rows, fields){
	});
}

/*
 * retourne la liste des joueurs dans la zone correspondant aux conditions
 */

exports.listeJoueursAutour = function(posX, posY, marge, idPerso, callback){
	var conditionX =  connexion.escape(posX - marge) + ' < x AND x < ' + connexion.escape(posX + marge),
		conditionY = connexion.escape(posY - marge) + ' < y AND y < ' + connexion.escape(posY + marge),
		conditionSql = conditionX + ' AND ' + conditionY,
		sql = 'SELECT idPerso,x,y,vitesse,direction,urlSprit,nbAnimation,hauteurSprit,largeurSprit,connecte,nom FROM mmo_personnages WHERE connecte=1 AND idPerso!=' 
		+ connexion.escape(idPerso) + ' AND ' + conditionSql;
		
	connexion.query(sql,function(err, rows, fields){
		if (err) throw err;
		if(rows.length){
			callback(rows);
		} else{
			callback(-1);
		}
	});
}

/*
 * update le status connecte du joueur
 */
exports.updateDeconnecte = function(idPerso){
	var sql = 'UPDATE mmo_personnages SET connecte=0 WHERE idPerso=' + connexion.escape(idPerso);
	
	connexion.query(sql,function(err, rows, fields){
	});
}

/*
 * update le status connecte du joueur
 */
exports.updateConnecte = function(idPerso){
	var sql = 'UPDATE mmo_personnages SET connecte=1 WHERE idPerso=' + connexion.escape(idPerso);
	
	connexion.query(sql,function(err, rows, fields){
	});
}

/*
 * retourne la liste des objets dans la zone correspondant aux conditions
 */

exports.listeObjetsAutour = function(posX, posY, marge, idPerso, callback){
	var conditionX =  connexion.escape(posX - marge) + ' < x AND x < ' + connexion.escape(posX + marge),
		conditionY = connexion.escape(posY - marge) + ' < y AND y < ' + connexion.escape(posY + marge),
		conditionSql = conditionX + ' AND ' + conditionY,
		sql = 'SELECT * FROM mmo_objetsdyn WHERE ' + conditionSql;
		
	connexion.query(sql,function(err, rows, fields){
		if (err) throw err;
		if(rows.length){
			callback(rows);
		} else{
			callback(-1);
		}
	});
}

/*
 * sauvegarde l'objet suivant en DB
 */
exports.sauvMapDB = function(terrain, callback){
	var queries = [];
	var query = "";
	var tile = false;
	
	for (var i in terrain){
		for (var j in terrain[i]){
			query = 'INSERT INTO mmo_carte (x,y,tile,collision,idZone) VALUES (' + connexion.escape(i) +',' + connexion.escape(j) + ',';
			if (terrain[i][j][0] != null){
				query += connexion.escape(terrain[i][j][0]) + ',';
			} else {
				query += 'default' + ',';
			}
			if (terrain[i][j][1] != null){
				query += connexion.escape(terrain[i][j][1]) + ',';	
			} else {
				query += 'default' + ',';
			}
			query += '1)\n'; //zone
			query += 'ON DUPLICATE KEY UPDATE '
			if (terrain[i][j][0] != null){
				query += 'tile=' + connexion.escape(terrain[i][j][0]);
				tile = true;
			}
			if (terrain[i][j][1] != null){
				if (tile){
					query += ',';
				}
				query += 'collision =' + connexion.escape(terrain[i][j][1]);	
				tile = false;
			} 
			queries.push(query);
		}
	}
	
	async.each(queries, function(query, next){
		connexion.query(query, function(err, rows, fields){
			if (err) throw err;	
			next();
		})
	}, function(err){
		if (err) throw err;
		callback();
	});
}

/*
 * sauvegarde l'objet suivant en DB
 */
exports.sauvFGDB = function(terrain, callback){
	var queries = [];
	var query = "";
	var tile = false;
	
	for (var i in terrain){
		for (var j in terrain[i]){
			query = 'INSERT INTO mmo_foreground (x,y,tile,idZone,fore) VALUES (' + connexion.escape(i) +',' + connexion.escape(j) + ',';
			if (terrain[i][j][0] != null){
				query += connexion.escape(terrain[i][j][0]) + ',';
			} else {
				query += 'default' + ',';
			}
			query += '1,'; //zone
			if (terrain[i][j][1] != null){ //fore
				query += connexion.escape(terrain[i][j][1]) + ')\n';
			} else {
				query += 'default)\n';
			}
			query += 'ON DUPLICATE KEY UPDATE '
			if (terrain[i][j][0] != null){
				query += 'tile=' + connexion.escape(terrain[i][j][0]);
				tile = true;
			}
			if (terrain[i][j][1] != null){
				if (tile){
					query += ',';
				}
				query += 'fore=' + connexion.escape(terrain[i][j][1]);	
				tile = false;
			} 
			queries.push(query);
		}
	}
	
	async.each(queries, function(query, next){
		connexion.query(query, function(err, rows, fields){
			if (err) throw err;	
			next();
		})
	}, function(err){
		if (err) throw err;
		callback();
	});
}

/*
 * sauvegarde les parametres recu en DB
 */
exports.sauvParamDB = function(idPerso, param){
	var query = "UPDATE mmo_personnages SET ";
	for (var i in param){
		query += i + "=" + connexion.escape(param[i]) + ",";
	}
	query = query.substring(0, query.length -1);
	query += " WHERE idPerso=" + idPerso;

	connexion.query(query,function(err,rows,fields){
		if (err) throw err;
	})
}

//cherche login en DB
exports.checkLogin = function(login, callback){
	var query = 'SELECT idCompte FROM mmo_comptes WHERE login=' + connexion.escape(login);
	
	connexion.query(query, function(err, rows, fields){
		if (err) throw err;	
		if (rows.length){
			callback(false);
		} else {
			callback(true);
		}
	});
}

//cherche email en DB
exports.checkEmail = function(email, callback){
	var query = 'SELECT idCompte FROM mmo_comptes WHERE email=' + connexion.escape(email);
	
	connexion.query(query, function(err, rows, fields){
		if (err) throw err;	
		if (rows.length){
			callback(false);
		} else {
			callback(true);
		}
	});
}

//cherche email en DB
exports.checkNom = function(nom, callback){
	var query = 'SELECT idPerso FROM mmo_personnages WHERE nom=' + connexion.escape(nom);
	
	connexion.query(query, function(err, rows, fields){
		if (err) throw err;	
		if (rows.length){
			callback(false);
		} else {
			callback(true);
		}
	});
}

/*
 * ajoute un compte ne BDD
 */
exports.ajouteCompte = function(login, email, password, callback){
	var shasum = crypto.createHash('sha1');
	shasum.update(password);
	var passSHA1 = shasum.digest('hex');
	
	var query = 'INSERT INTO mmo_comptes SET login=' + connexion.escape(login) + ', email=' + connexion.escape(email) + ',password=' + connexion.escape(passSHA1);
	
	connexion.query(query, function(err, rows, fields){
		if (err) throw err;	
		callback();
	});
}

/*
 * ajoute un perso en BDD
 */
exports.ajoutePerso = function(nom, urlSprit, nbAnimation, largeurSprit, hauteurSprit, idCompte, callback){	
	var query = 'INSERT INTO mmo_personnages SET nom=' + connexion.escape(nom) + ', urlSprit=' + connexion.escape(urlSprit) + ',nbAnimation=' + connexion.escape(nbAnimation) + 
	', largeurSprit=' + connexion.escape(largeurSprit) + ', hauteurSprit=' + connexion.escape(hauteurSprit) + ', idCompte=' + connexion.escape(idCompte);
	
	connexion.query(query, function(err, rows, fields){
		if (err) throw err;	
		callback(rows.insertId);
	});
}

/*
 * ajoute un message en BDD
 */
exports.ajouteMessageDB = function(nom, idPerso, message, callback){
	var query = 'INSERT INTO mmo_tchat SET nom=' + connexion.escape(nom) + ', idPerso=' + idPerso + ', timestamp=NOW()' + ', message=' + connexion.escape(message);

	connexion.query(query, function(err, rows, fields){
		if (err) throw err;			
		callback();
	});
}
