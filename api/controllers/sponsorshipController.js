'use strict';
/*---------------SPONSORSHIP----------------------*/

var mongoose = require('mongoose'),
    Sponsorship = require('../models/sponsorshipModel');

exports.list_all_sponsorships = function(req, res){
    Sponsorship.find({},function(err, sponsorships){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(sponsorships);
        }
    });
}

exports.create_a_sponsorship = function(req, res){
    var new_sponsorship = new Sponsorship(req.body);

    new_sponsorship.save(function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).json(sponsorship);
        }
    });
};

exports.find_a_sponsorship = function(req, res){
    Sponsorship.findById(req.params.sponsorshipId, function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        }
        else{
            if(res === null)
                res.status(404).send({message: 'Sponsorship not found.'});
            
            else
                res.status(200).send(sponsorship);
        }
    });
}

exports.update_a_sponsorship = function(req, res){
    Sponsorship.findOneAndUpdate({_id: req.params.sponsorshipId}, req.body, {new: true}, function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json({message: "Sponsorship Updated"});
        }
    });
}

exports.delete_a_sponsorship = function(req, res){
    Sponsorship.deleteOne({_id: req.params.sponsorshipId}, function(err, sponsorship) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json({message: "Sponsorship Deleted"});
        }
    });
}

exports.list_sponsorships_sponsor = function(req, res){
    Sponsorship.find({sponsor: req.params.sponsorId}, function(err, sponsorships) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(sponsorships);
        }
    });
}

exports.find_sponsorships_trip = function(req, res){ 
    var query = {tripSponsorships: {$elemMatch: {$or: [{trip: req.params.tripId, paid: true}]}}};
    Sponsorship.find(query, function(err, sponsorships) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(sponsorships);
        }
    });
}

exports.pay_sponsorships_trip = function(req, res){
    var sponsorshipId = req.params.sponsorshipId;
    var tripId = req.params.tripId;

    Sponsorship.findOne({_id: sponsorshipId}, function(err, sponsorship){
        if(err){
            res.sendStatus(500);
        }
        else{
            if(sponsorship === null)
                res.status(404).json({message: 'Sponsorship not found.'});

            else{
                var sponsorshipReceived = sponsorship;
                var tripToChange = sponsorshipReceived.tripSponsorships.filter((obj) => {
                    return obj.trip == tripId;
                });
                if(tripToChange.length < 1)
                    res.status(404).json({message: 'Trip not found in this sponsorship.'});

                else{
                    var indexOfChange = sponsorshipReceived.tripSponsorships.indexOf(tripToChange[0]);
                    if(sponsorshipReceived.tripSponsorships[indexOfChange].paid == true){
                        res.status(422).json({message: 'Sponsorship already paid.'});
                    }
                    else{
                        sponsorshipReceived.tripSponsorships[indexOfChange].paid = true;
                        Sponsorship.updateOne({_id: sponsorshipId}, sponsorshipReceived, function(err, sponsorship){
                            if(err){
                                res.status(500);
                            }
                            else{
                                res.status(200).json({message: "Sponsorship paid."});
                            }
                        });
                    }
                }
            }
        }
    });
}

exports.cancel_sponsorships_trip = function(req, res){
    var sponsorshipId = req.params.sponsorshipId;
    var tripId = req.params.tripId;

    Sponsorship.findOne({_id: sponsorshipId}, function(err, sponsorship){
        if(err){
            res.sendStatus(500);
        }
        else{
            if(sponsorship === null)
                res.status(404).json({message: 'Sponsorship not found.'});

            else{
                var sponsorshipReceived = sponsorship;
                var tripToChange = sponsorshipReceived.tripSponsorships.filter((obj) => {
                    return obj.trip == tripId;
                });
                if(tripToChange.length < 1)
                    res.status(404).json({message: 'Trip not found in this sponsorship.'});

                else{
                    var indexOfChange = sponsorshipReceived.tripSponsorships.indexOf(tripToChange[0]);
                    if(sponsorshipReceived.tripSponsorships[indexOfChange].paid == false){
                        res.status(422).json({message: 'Sponsorship not paid.'});
                    }
                    else{
                        sponsorshipReceived.tripSponsorships[indexOfChange].paid = false;
                        Sponsorship.updateOne({_id: sponsorshipId}, sponsorshipReceived, function(err, sponsorship){
                            if(err){
                                res.status(500);
                            }
                            else{
                                res.status(200).json({message: "Sponsorship paid."});
                            }
                        });
                    }
                }
            }
        }
    });
}

/*------------------------API V2---------------------------------*/

exports.list_all_sponsorships = function(req, res){
    Sponsorship.find({},function(err, sponsorships){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(sponsorships);
        }
    });
}

exports.create_a_sponsorship_auth = function(req, res){
    var idToken = req.headers['idtoken']; //WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var userId = authController.getUserId(idToken);
    var new_sponsorship = new Sponsorship(req.body);
    new_sponsorship.sponsor = userId;
    new_sponsorship.save(function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).json(sponsorship);
        }
    });
}

exports.find_a_sponsorship = function(req, res){
    Sponsorship.findById(req.params.sponsorshipId, function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        }
        else{
            if(res === null){
                res.status(404).send({message: 'Sponsorship not found.'});
            }
            else{
                res.status(200).send(sponsorship);
            }
        }
    });
}

exports.update_a_sponsorship = function(req, res){
    Sponsorship.findOneAndUpdate({_id: req.params.sponsorshipId}, req.body, {new: true}, function(err, sponsorship){
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json({message: "Sponsorship Updated"});
        }
    });
}

exports.delete_a_sponsorship = function(req, res){
    Sponsorship.deleteOne({_id: req.params.sponsorshipId}, function(err, sponsorship) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json({message: "Sponsorship Deleted"});
        }
    });
}

exports.list_sponsorships_sponsor_auth = function(req, res){
    Sponsorship.find({sponsor: req.params.sponsorId}, function(err, sponsorships) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(sponsorships);
        }
    });
}

exports.find_sponsorships_trip_auth = function(req, res){ 
    var query = {tripSponsorships: {$elemMatch: {$or: [{trip: req.params.tripId, paid: true}]}}};
    Sponsorship.find(query, function(err, sponsorships) {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).json(sponsorships);
        }
    });
}

exports.pay_sponsorships_trip_auth = function(req, res){
    var sponsorshipId = req.params.sponsorshipId;
    var tripId = req.params.tripId;

    Sponsorship.findOne({_id: sponsorshipId}, function(err, sponsorship){
        if(err){
            res.sendStatus(500);
        }
        else{
            if(sponsorship === null)
                res.status(404).json({message: 'Sponsorship not found.'});

            else{
                var sponsorshipReceived = sponsorship;
                var tripToChange = sponsorshipReceived.tripSponsorships.filter((obj) => {
                    return obj.trip == tripId;
                });
                if(tripToChange.length < 1)
                    res.status(404).json({message: 'Trip not found in this sponsorship.'});

                else{
                    var indexOfChange = sponsorshipReceived.tripSponsorships.indexOf(tripToChange[0]);
                    if(sponsorshipReceived.tripSponsorships[indexOfChange].paid == true){
                        res.status(422).json({message: 'Sponsorship already paid.'});
                    }
                    else{
                        sponsorshipReceived.tripSponsorships[indexOfChange].paid = true;
                        Sponsorship.updateOne({_id: sponsorshipId}, sponsorshipReceived, function(err, sponsorship){
                            if(err){
                                res.status(500);
                            }
                            else{
                                res.status(200).json({message: "Sponsorship paid."});
                            }
                        });
                    }
                }
            }
        }
    });
}

exports.cancel_sponsorships_trip_auth = function(req, res){
    var sponsorshipId = req.params.sponsorshipId;
    var tripId = req.params.tripId;

    Sponsorship.findOne({_id: sponsorshipId}, function(err, sponsorship){
        if(err){
            res.sendStatus(500);
        }
        else{
            if(sponsorship === null)
                res.status(404).json({message: 'Sponsorship not found.'});

            else{
                var sponsorshipReceived = sponsorship;
                var tripToChange = sponsorshipReceived.tripSponsorships.filter((obj) => {
                    return obj.trip == tripId;
                });
                if(tripToChange.length < 1)
                    res.status(404).json({message: 'Trip not found in this sponsorship.'});

                else{
                    var indexOfChange = sponsorshipReceived.tripSponsorships.indexOf(tripToChange[0]);
                    if(sponsorshipReceived.tripSponsorships[indexOfChange].paid == false){
                        res.status(422).json({message: 'Sponsorship not paid.'});
                    }
                    else{
                        sponsorshipReceived.tripSponsorships[indexOfChange].paid = false;
                        Sponsorship.updateOne({_id: sponsorshipId}, sponsorshipReceived, function(err, sponsorship){
                            if(err){
                                res.status(500);
                            }
                            else{
                                res.status(200).json({message: "Sponsorship paid."});
                            }
                        });
                    }
                }
            }
        }
    });
}