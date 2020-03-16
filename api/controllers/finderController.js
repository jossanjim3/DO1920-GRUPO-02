'use strict';
/*---------------FINDER----------------------*/
var mongoose = require('mongoose'),
    Finder = require('../models/finderModel');

var fetch = require('node-fetch');

const authController = require('./authController');

var maxNumberTrips = 10;
var maxTimeAResultIsStored = 3600;

const validateExplorer = authController.verifyUser(['EXPLORER']);


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
    Finder.FinderModel.remove({_id: req.params.id}, function(err, finder){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(finder);
        }
    })
}

exports.finder_of_actor = function(req, res){
    Finder.FinderModel.find({actor: req.params.explorer}, function(err, finder){
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(finder);
        }
    });
}

exports.update_finder = function(req, res) {
    Finder.FinderModel.findOne({explorer: req.params.actorId}, function(err, finder){
        if(err)
            res.status(500).send(err);

        else{
            var urlForFinder = extractUrl(req.body);
            console.log(urlForFinder);
            fetch(urlForFinder,{
                method: 'GET',
            }).then(response => {
                return response.json();
            }).then(trips =>{
                var trips_results_finder = trips.slice(0, maxNumberTrips)
                    .map((trip)=>transformToFinderTripSchema(trip));

                if(finder === null){
                    console.log("Create");
                    var newFinder = new Finder.FinderModel(req.body);
                    newFinder.explorer = req.params.actorId;
                    newFinder.results = trips_results_finder;
                    newFinder.save(function(err, finder){
                        if(err){
                            res.status(500).send(err);
                        }
                        else{
                            res.status(201).send(finder);
                        }
                    });
                }
                else {
                    console.log("Update");
                    finder.results = trips_results_finder;
                    Finder.FinderModel.updateOne({explorer: req.params.actorId}, finder, {new: true}, function(err, finderToUpdate){
                        if(err){
                            res.status(500).send(err);
                        }
                        res.status(201).json(finderToUpdate);
                    });
                }  
            });
        }
    });       
}

exports.set_max_results = function(req, res){
    var promise = new Promise(function(resolve, reject){
        if(req.params.number > 0 && req.params.number < 100) {
            maxNumberTrips = req.params.number;
            resolve({message: "Operacion successful. Max number of results available per search updated."});
        }
        else
            reject({message: "Operation not allowed. The number must be one between 1 and 100."});
    });
    promise.then((message)=>{
        res.status(200).send(message);
    })
    .catch((err) => {
        res.status(500).send(err);
    });
}

exports.set_time_results_saved = function(req, res){
    var promise = new Promise(function(resolve, reject){
        if(req.params.time > 0 && req.params.time < 24) {
            maxTimeAResultIsStored = req.params.time * 3600;
            resolve({message: "Operacion successful. Max time the search is stored updated."});
        }
        else
            reject({message: "Operation not allowed. The number of hours must be between 1 and 24."});
    });
    promise.then((message)=>{
        res.status(200).send(message);
    })
    .catch((err) => {
        res.status(500).send(err);
    });
}