'use strict';

var logger = require('../../logger');

var mongoose = require('mongoose'),
    Audit = mongoose.model('Audits');

var authController = require('./authController');

var Actor = mongoose.model('Actors');
var Trip = mongoose.model('Trips');

//----------------------------
// /v1/audits
//----------------------------

/** 
 * list all the audits
 *
 * @section audits
 * @type get
 * @url /v1/audits
 */
exports.list_all_audits = function(req,res){
    Audit.find({},function(err, applis){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(applis);
        }
    });
};

/** 
 * create an applicaction
 *   RequiredRoles: to be an Auditor
 *
 * @section audits
 * @type post
 * @url /v1/audits
 */
exports.create_an_audit = function(req,res){
    
    var auditor = undefined;
    var trip = undefined;
    
    // check if the actor exists
    Actor.findOne({_id: req.body.auditor}, function(err, actor){
        if(err){
            //res.status(500).send(err);
            res.status(403);
            res.json("Audit cannot be created. Actor does not exist!");
        } else {
            auditor = actor;
            
            if (auditor != null){
                // Check if the actor is an Auditor  
                if (auditor.role == "AUDITOR" ) {

                    // check if the trip exists
                    Trip.findById(req.body.trip, function(err, tripp){
                        if(err){
                            //res.status(500).send(err);
                            res.status(403);
                            res.json("Audit cannot be created. Trips does not exist!");

                        } else {
                            trip = tripp;
                            
                            if (trip != null) {
                                // Check if the trip has been published and is not started or cancelled
                                //if (trip.isPublished && trip.reasonCancel == undefined && trip.startDate > new Date()){                            

                                    // create the Audit
                                    var new_audit = new Audit(req.body);

                                    new_audit.save(function(err, audit) {
                                        if (err){
                                            if(err.name=='ValidationError') {
                                                res.status(422).send(err);
                                            }
                                            else{
                                                res.status(500).send(err);
                                            }
                                        }
                                        else{
                                            res.json(audit);
                                        }
                                    });
                                /* } else if (!trip.isPublished) {
                                    res.status(403);
                                    res.json("Audit cannot be created. The trip is not published yet!");
                                } else if (trip.reasonCancel != undefined){
                                    res.status(403);
                                    res.json("Audit cannot be created. The trip has been cancelled!");
                                } else if (trip.startDate <= new Date()){
                                    res.status(403);
                                    res.json("Audit cannot be created. The trip has already started!");
                                } */
                            } else {
                                res.status(403);
                                res.json("Audit cannot be created. Trips does not exist!");
                            }                            

                        }
                    })

                } else {
                    res.status(403);
                    res.json("Audit cannot be created. The actor is not an auditor!");
                }
            } else {
                res.status(403);
                res.json("Audit cannot be created. Actor does not exist!");
            }
            
        }
    })        
};

//----------------------------
// /v1/audits/:auditId
//----------------------------

/** 
 * read an Audit 
 *   RequiredRoles: to be an Auditor or Manager
 *
 * @section audits
 * @type get
 * @url /v1/audits/:auditId
 */ 
exports.read_an_audit = function(req,res){
    Audit.findById(req.params.auditId, function(err, audit){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(audit);
        }
    })
};

/** 
 *  update an Audit status
 *   RequiredRoles: to be an Auditor or Manager
 *
 * @section audits
 * @type put
 * @url /v1/audits/:auditId
 */ 
exports.update_an_audit = function(req,res){

    Audit.findOneAndUpdate({_id:req.params.auditId}, req.body, {new:true} ,function(err, audit){
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        } else {
            res.json(audit)
        }
    })
};

/** 
 *  delete an Audit. Currently an Audit cannot be deleted!
 *   RequiredRoles: to be an Auditor or Manager
 *
 * @section audits
 * @type delete
 * @url /v1/audits/:auditId
 */ 
exports.delete_an_audit = function(req,res){
    Audit.remove({_id:req.params.auditId}, function(err, audit){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(audit)
        }
    })
};

//----------------------------
// /v1/audits/users/:userId
//----------------------------

/** 
 *  list audits that auditors have made
 *   RequiredRoles: to be an Auditor or Manager
 *
 * @section audits
 * @type get
 * @url /v1/audits/users/:userId
 */ 
exports.list_all_my_audits = function(req, res) {
    var user_id = req.params.userId;

    Audit.find({auditor : user_id}, function(err, appis) {
      if (err){
        res.status(500).send(err);
      }
      else{
        res.status(200);
        res.json(appis);
      }
    });
};

//----------------------------
// /v1/audits/trips/:tripId
//----------------------------

/** 
 *  list audits from a trip
 *   RequiredRoles: to be an Auditor or Manager
 *
 * @section audits
 * @type get
 * @url /v1/audits/trips/:tripId
 */
exports.list_all_trip_audits = function(req, res) {
    var trip_id = req.params.tripId;

    Audit.find({trip : trip_id}, function(err, appis) {
      if (err){
        res.status(500).send(err);
      }
      else{
        res.status(200);
        res.json(appis);
      }
    });
};