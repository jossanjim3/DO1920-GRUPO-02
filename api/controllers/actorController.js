'use strict';
var logger = require('../../logger');

/*---------------ACTOR----------------------*/
var mongoose = require('mongoose'),
bcrypt = require('bcrypt'),
Actor = mongoose.model('Actors');
var admin = require('firebase-admin');
var authController = require('./authController');

exports.create_an_actor = function(req,res){
    var new_actor = new Actor(req.body);

    //checks that the user can register as explorer, manager or sponsor, it is not allowed to create actors as administrators
    if(new_actor.role.includes('ADMINISTRATOR')){
        res.status(422).send("No se puede crear un administrador")
    }else{
        new_actor.save(function(err, actor) {
            if (err){

                res.status(500).send(err);
            }
            else{
                res.json(actor);
                res.status(200);
            }
        });
    }
};

exports.read_an_actor=function(req,res){
    
    Actor.findById(req.params.actorId, function(err,actor){

        if(actor === null){
            res.status(404).send("No existe ese actor");
   
        }else if(err){

            res.status(500).send(err);

        }else{
            res.json(actor);
            res.status(200);
        }
    })
}

exports.delete_an_actor = function(req, res) {
    Actor.deleteOne({_id: req.params.actorId}, function(err, actor) {
        if (err){
            res.status(500).send(err);
        }
        else{
            res.json({ message: 'The actor was successfully deleted' });
            res.status(204)
            
        }
    });
};


exports.update_an_actor = function(req,res){

    var actor_body=req.body;
    var promise_hash = new Promise((resolve,reject)=>{
        if(actor_body.password!=undefined){
            bcrypt.genSalt(5, function(err, salt) {
                if (err) reject(err);
            
                bcrypt.hash(actor_body.password, salt, function(err, hash) {
                  if (err) reject(err);
                  actor_body.password = hash;
                  resolve(actor_body)
                });
              });
         }else{
             resolve(actor_body)
         }
    })
    
    promise_hash.then((actor_body)=>{
        Actor.findOneAndUpdate({_id: req.params.actorId}, actor_body, {new: true}, function(err, actor) {
            if (err){
              if(err.name=='ValidationError') {
                  res.status(422).send(err);
              }
              else{
    
                 res.status(500).send(err);
              }
              
            }
            else{
                res.status(200).json(actor);
            }
          });
    }).catch(function(err){
        res.status(err).send(err);
    })

};

exports.modify_actor_validation = function(req, res) {
    
    if (req.body.validated==true){
        logger.info("Validating an actor with id: "+req.params.actorId)
    }else{
        logger.info("Invalidating an actor with id: "+req.params.actorId)
    }

    Actor.findOneAndUpdate({_id: req.params.actorId},  { $set: {"validated":req.body.validated }}, {new: true}, function(err, actor) {
        if (err){
        res.status(500).send(err);
        }
        else{
        res.json(actor);
        res.status(200);
        }
    });
    
};


exports.updateFinder = function(req, res) {
    if(!req.params.role.contains('EXPLORER')){
        res.status(422).json({message: 'The actor must be an explorer.'})
    }
    else{
        var newFinder = req.body;
        newFinder.timestamp = new Date();
    }
}



//Authenticated version V2:

exports.login_an_actor = async function(req, res) {
    logger.info('starting login an actor');
    var emailParam = req.query.email;
    var password = req.query.password;
    Actor.findOne({ email: emailParam }, function (err, actor) {
        if (err) { res.send(err); 
    }
  
        // No actor found with that email as username
        else if (!actor) {
          res.status(401); //an access token isn’t provided, or is invalid
          res.json({message: 'forbidden',error: err});
        }
        
        //if the actor is not validated, he/she can not do any operation
        else if (actor.validated == false) {
          res.status(403); //an access token is valid, but requires more privileges: to be validated
          res.json({message: 'forbidden',error: err});
          logger.info('The actor is not validated');
        }else{
          // Make sure the password is correct
          //logger.info('En actor Controller pass: '+password);
          actor.verifyPassword(password, async function(err, isMatch) {
            if (err) {
              res.send(err);
            }
  
            // Password did not match
            else if (!isMatch) {
              //res.send(err);
              res.status(401); //an access token isn’t provided, or is invalid
              res.json({message: 'forbidden',error: err});
            }
            else {
                try{
                  var customToken = await admin.auth().createCustomToken(actor.email);
                } catch (error){
                  logger.info("Error creating custom token:", error);
                }
                actor.customToken = customToken;
                logger.info('Login Success... sending JSON with custom token');
                res.json(actor);
            }
        });
      }
    });
  };

exports.create_an_actor_authenticated = function(req,res){
    var new_actor = new Actor(req.body);

    //checks that the user can register as explorer, manager (only an admin can create it) or sponsor
    if(new_actor.role.includes('ADMINISTRATOR')){
        res.status(422).send("It is not possible to create an administrator")
    }else if (new_actor.role.includes('MANAGER')){

        var idToken = req.headers['idtoken']
        id=authController.getUserId(idToken);

        Actor.findById(id, function(err,actor2){

            if(actor2.role.includes('ADMINISTRATOR')){
        
                    new_actor.save(function(err, actor) {

                                            if (err){

                                                    res.status(500).send(err);
                                            }
                                            else{
                                                    res.status(200).json(actor);
                                                    
                                            }
                    });
                                                                 
            }else{
                    res.status(403).send("The user is not authorized");
            }
        });

    }else{
        new_actor.save(function(err, actor) {
            if (err){

                res.status(500).send(err);
            }
            else{
                res.json(actor);
                res.status(200);
            }
        });
    }
};


exports.update_an_actor_authenticated =  async function(req,res){
    

          var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken'] to find the actor id
          var authenticatedUserId = await authController.getUserId(idToken);

            //Check that the user is the proper actor and if not: res.status(403); "an access token is valid, but requires more privileges"
            if (authenticatedUserId == req.params.actorId){//if the actor is trying to modify himself:

                    var actor_body=req.body;
                    var promise_hash = new Promise((resolve,reject)=>{
                        if(actor_body.password!==undefined && actor_body.password!==''){
                            bcrypt.genSalt(5, function(err, salt) {
                                if (err) reject(err);
                            
                                bcrypt.hash(actor_body.password, salt, function(err, hash) {
                                if (err) reject(err);
                                actor_body.password = hash;
                                resolve(actor_body)
                                });
                            });
                        }else{
                            delete actor_body.password;
                            resolve(actor_body)
                        }
                    })
                    
                    promise_hash.then((actor_body,err)=>{
                        if(err){
                            res.status(500).send(err);
                        } else {
                            
                            Actor.findOneAndUpdate({_id: req.params.actorId}, actor_body, {new: true}, function(err, actor) {
                                if (err){
                                    
                                    res.status(500).send(err);
                                }
                                
                                else{
                                    res.send(actor);
                                    res.status(200);
                                   
                                }
                            });
                        }
                        
                    }).catch(function(err){
                        res.status(err).send(err);
                    })
            } else{
              res.status(403).send('The Actor is trying to update an Actor that is not himself!');
            }    
    
};
