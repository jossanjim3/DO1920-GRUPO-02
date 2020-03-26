'use strict';

var logger = require('../../logger');

/*---------------FINDER----------------------*/
var mongoose = require('mongoose'),
    Finder = require('../models/finderModel'),
    Actor = require('../models/actorModel');

var fetch = require('node-fetch');

const authController = require('./authController');

const configModel = require('../models/configModel');


var maxNumberTrips = 10;
var maxTimeAResultIsStored = 1;

/*---------------Funciones auxiliares----------------------*/
function extractUrl(body){
    var url = "http://localhost:" + (process.env.PORT || 8080) + "/v1/trips/search";
    var firstAttr = true;
    var jsonBody = Object.keys(body);
    var jsonBodyFiltered = jsonBody.filter((element) => jsonBody[element] !== null);
    var attr;

    for (attr of jsonBodyFiltered){
        if(firstAttr){
            url += "?";
        }
        else if(!firstAttr){
            url += "&";
        }
        url += attr + "=" + body[attr];
        firstAttr = false;
    }

    return url;
}

function transformToFinderTripSchema(trip){
    var tripForFinder = new Finder.TripsSchemaFinder();
    var attr;

    var attributesToCopy = Object.keys(Finder.TripsSchemaFinder.schema.paths).filter((element) => 
        String(element) != "__v" || String(element) != "_id"
    );

    for(attr of attributesToCopy){
        tripForFinder[attr] = trip[attr];
    }

    return tripForFinder;
}

const attrToCheck = ["keyword", "minDate", "maxDate", "minPrice", "maxPrice"];

var timestampUnderLimit = function(finder){
    return new Promise((resolve,reject)=>{
        configModel.findOne({}, (err, config) => {
            var currentTime = new Date();
            logger.info(finder.timestamp);
            var timeToCompare = new Date(finder.timestamp);
    
            maxTimeAResultIsStored = config.max_number_hours_finder_stored;
            timeToCompare = timeToCompare.setHours(timeToCompare.getHours() + maxTimeAResultIsStored);
            logger.info("Comparacion: " + timeToCompare + " y " + currentTime.getTime());
    
            resolve(timeToCompare > currentTime.getTime());
        });
    });

}

var checkEquality = function(finder, body){
    return function(attr){
        if(body[attr] === undefined && finder[attr] === null){
            return true;
        }
        else{
            if(attr === "minDate" || attr === "maxDate"){
                logger.info("Comparacion fechas: " + new Date(finder[attr]) + " y " + new Date(body[attr]));
                return ((new Date(finder[attr])).getTime() === (new Date(body[attr])).getTime());
            }
            else{
                logger.info("Comparacion atributos: " + finder[attr] + " y " + body[attr]);
                return finder[attr] === body[attr];
            }
        }
    }
}


/*-----------------Metodos para V1------------------------*/
exports.all_finders = function(req, res){
    Finder.FinderModel.find({}, function(err, finders){
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(finders);
        }
    });
}

exports.remove_finder = function(req, res){
    Finder.FinderModel.remove({explorer: req.params.actorId}, function(err, finder){
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).json({message: "Finder eliminado."});
        }
    })
}

exports.finder_of_actor = function(req, res){
    Finder.FinderModel.findOne({explorer: req.params.actorId}, function(err, finder){
        if(err){
            res.status(500).send(err);
        }
        else{
            if(finder !== null){
                timestampUnderLimit(finder).then((timestampCheck,err) => {
                    logger.info(finder);
                    logger.info(finder !== null)
                    if(timestampCheck) {
                        logger.info("Llego a devolver");
                        res.status(200).json(finder);
                    }
                    else{
                        logger.info("No se encuentra resultado");
                        res.status(200).json([]);
                    }
                });
            }
        }
    });
}

exports.update_finder = function(req, res) {
    var url = "http://localhost:" + (process.env.PORT || 8080) + "/v1/finders/explorers/" + req.params.actorId;
    fetch(url,{
        method: 'GET',
    }).then(response => {
        return response.json();
    }).then(finder => {
        var equalityBetweenFinderAndBody = checkEquality(finder, req.body);
        logger.info("Tercera comparacion: " + attrToCheck.every(equalityBetweenFinderAndBody))
        if(attrToCheck.every(equalityBetweenFinderAndBody)){
            timestampUnderLimit(finder).then((timestampCheck,err) => {
                if(timestampCheck && 
                attrToCheck.every(equalityBetweenFinderAndBody)){
                    logger.info("Devolviendo finder almacenado.");
                    res.status(200).json(finder);
                }
            });
        }
        else{
            var urlForFinder = extractUrl(req.body);
            fetch(urlForFinder,{
                method: 'GET',
            }).then(response => {
                return response.json();
            }).then(trips =>{
                if(trips.hasOwnProperty("name")){
                    res.status(400).send(trips);
                }
                else{
                    configModel.findOne({}, (err, config) => {
                        maxNumberTrips = config.max_number_trips_results;
                        var trips_results_finder = trips.slice(0, maxNumberTrips)
                            .map((trip)=>transformToFinderTripSchema(trip));

                        var newFinder = new Finder.FinderModel(req.body);
                        newFinder.explorer = req.params.actorId;
                        newFinder.results = trips_results_finder;
                        Finder.FinderModel.deleteOne({explorer: req.params.actorId}, function(err, finder){
                            if(err){
                                res.status(500).send(err);
                            }
                            else{
                                newFinder.save(function(err, finder){
                                    if(err){
                                        res.status(500).send(err);
                                    }
                                    else{
                                        res.status(201).send(finder);
                                    }
                                });
                            }
                        });
                    });
                }
            });
        }
    });
}


/*-----------------Metodos para V2------------------------*/

/*exports.all_finders = function(req, res){
    Finder.FinderModel.find({}, function(err, finders){
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(finders);
        }
    });
}*/

exports.remove_finder_auth = function(req, res){
    var idToken = req.headers['idtoken']; //WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var userId = authController.getUserId(idToken);
    Actor.findOne({_id: userId}, async function(err, actor){
        if(err){
            res.status(500).send(err);
        }
        else{
            logger.info('actor: '+actor); 
            Finder.FinderModel.remove({_id: req.params.id}, function(err, finder){
                if(err){
                    res.status(500).send(err);
                } else {
                    res.json({message:"Finder removed"});
                }
            });
        }
    });
}

exports.finder_of_actor_auth = function(req, res){
    var idToken = req.headers['idtoken']; //WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var userId = authController.getUserId(idToken);
    Actor.findOne({_id: userId}, async function(err, actor){
        if(err){
            res.status(500).send(err);
        }
        else{
            logger.info('actor: '+actor); 
            Finder.FinderModel.findOne({explorer: req.params.actorId}, function(err, finder){
                if(err){
                    res.status(500).send(err);
                }
                else{
                    timestampUnderLimit(finder).then((timestampCheck,err) => {
                        if(finder !== null && timestampCheck) {
                            logger.info("Llego a devolver");
                            res.status(200).json(finder);
                        }
                        else{
                            logger.info("No se encuentra resultado");
                            res.status(200).json([]);
                        }
                    });
                }
            });
        }
    });
}

exports.update_finder_auth = function(req, res) {
    var idToken = req.headers['idtoken']; //WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var userId = authController.getUserId(idToken);
    Actor.findOne({_id: userId}, async function(err, actor){
        if(err){
            res.status(500).send(err);
        }
        else{
            logger.info('actor: '+actor); 
            if (userId == req.params.actorId){
                var url = "http://localhost:" + (process.env.PORT || 8080) + "/v1/finders/explorers/" + req.params.actorId;
                fetch(url,{
                    method: 'GET',
                }).then(response => {
                    logger.info("Primer then");
                    if(response.json.hasOwnProperty('message')){
                        logger.info("Json es nulo");
                        return null;
                    }
                    else{
                        logger.info("Devuelvo json");
                        return response.json();
                    }     
                }).then(finder => {
                    var equalityBetweenFinderAndBody = checkEquality(finder, req.body);
                    logger.info("Tercera comparacion: " + attrToCheck.every(equalityBetweenFinderAndBody))
                    timestampUnderLimit(finder).then((timestampCheck,err) => {
                        if(timestampCheck && 
                        attrToCheck.every(equalityBetweenFinderAndBody)){
                        logger.info("Devolviendo finder almacenado.");
                        res.status(200).json(finder);
                    }
                    else{
                        var urlForFinder = extractUrl(req.body);
                        fetch(urlForFinder,{
                            method: 'GET',
                        }).then(response => {
                            return response.json();
                        }).then(trips =>{
                            if(trips.hasOwnProperty("name")){
                                res.status(400).send(trips);
                            }
                            else{
                                configModel.findOne({}, (err, config) => {
                                    maxNumberTrips = config.max_number_trips_results;
                                    var trips_results_finder = trips.slice(0, maxNumberTrips)
                                        .map((trip)=>transformToFinderTripSchema(trip));

                                    var newFinder = new Finder.FinderModel(req.body);
                                    newFinder.explorer = req.params.actorId;
                                    newFinder.results = trips_results_finder;
                                    Finder.FinderModel.deleteOne({explorer: req.params.actorId}, function(err, finder){
                                        if(err){
                                            res.status(500).send(err);
                                        }
                                        else{
                                            newFinder.save(function(err, finder){
                                                if(err){
                                                    res.status(500).send(err);
                                                }
                                                else{
                                                    res.status(201).send(finder);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
                });
            }
            else{
                res.status(403).json({message: "The authenticated user is trying to modify a finder that does not belong to him."})
            }
        }
    }); 
}
