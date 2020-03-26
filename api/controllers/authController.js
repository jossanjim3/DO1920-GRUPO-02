'use strict';

var logger = require('../../logger');

/*---------------ACTOR Auth----------------------*/
var mongoose = require('mongoose'),
Actor = mongoose.model('Actors');
var admin = require('firebase-admin');

exports.getUserId = async function(idToken) {

    logger.info('idToken: '+idToken);
    var id = null;
  
    var actorFromFB = await admin.auth().verifyIdToken(idToken);
     
        var uid = actorFromFB.uid;
        var auth_time = actorFromFB.auth_time;
        var exp =  actorFromFB.exp;
        logger.info('idToken verificado para el uid: '+uid);
        logger.info('auth_time: '+auth_time);
        logger.info('exp: '+exp);
  
        var mongoActor = await Actor.findOne({ email: uid });
         if (!mongoActor) { return null; }
  
          else {
              logger.info('The actor exists in our DB');
              logger.info('actor: '+mongoActor);
              id = mongoActor._id;
              return id;
          }

  }

exports.getUser = async function(idToken) {

    logger.info('idToken: '+idToken);
    var id = null;
  
    var actorFromFB = await admin.auth().verifyIdToken(idToken);
     
        var uid = actorFromFB.uid;
        var auth_time = actorFromFB.auth_time;
        var exp =  actorFromFB.exp;
        logger.info('idToken verificado para el uid: '+uid);
        logger.info('auth_time: '+auth_time);
        logger.info('exp: '+exp);
  
        var mongoActor = await Actor.findOne({ email: uid });
         if (!mongoActor) { return null; }
  
          else {
              logger.info('The actor exists in our DB');
              logger.info('actor: '+mongoActor);
              id = mongoActor._id;
              return mongoActor;
          }
  }  


exports.verifyUser = function(requiredRoles) {
  return function(req, res, callback) {
    logger.info('starting verifying idToken');
    logger.info('requiredRoles: '+requiredRoles);
    var idToken = req.headers['idtoken'];
    logger.info('idToken: '+idToken);

    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {

        var uid = decodedToken.uid;
        var auth_time = decodedToken.auth_time;
        var exp =  decodedToken.exp;
        logger.info('idToken verificado para el uid: '+uid);
        logger.info('auth_time: '+auth_time);
        logger.info('exp: '+exp);

        Actor.findOne({ email: uid }, function (err, actor) {
          if (err) { res.send(err); }

          // No actor found with that email as username
          else if (!actor) {
              res.status(401); //an access token isn’t provided, or is invalid
              res.json({message: 'No actor found with the provided email as username' ,error: err});
            }

          else {
              logger.info('The actor exists in our DB');
              logger.info('actor: '+actor);

              var isAuth = false;
              for (var i = 0; i < requiredRoles.length; i++) {
                for (var j = 0; j < actor.role.length; j++) {
                   if (requiredRoles[i] == actor.role[j]) {
                      if (actor.validated == true){ //the actor is validated
                        isAuth = true;
                      }else{ //an access token is valid, but the user is not validated;
                        res.status(403);
                        res.json({message: 'The actor is not validated',error: err});
                      }; 
                   }
                }
              }
            if (isAuth) return callback(null, actor);
            else {
              res.status(403); //an access token is valid, but requires more privileges
              res.json({message: 'The actor has not the required roles',error: err});
              }
            }
        });
      }).catch(function(err) {
        // Handle error
        logger.info ("Error en autenticación: "+err);
        res.status(403); //an access token is valid, but requires more privileges
        res.json({message: 'The actor has not the required roles',error: err});
      });
  }
}
