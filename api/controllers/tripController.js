'use strict';

var logger = require('../../logger');

var mongoose = require('mongoose'),
Trip = mongoose.model('Trips')


exports.list_all_trips = function(req,res){
    Trip.find({},function(err, trips){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(trips);
        }
    });
}

exports.list_all_trips_of_manager = function(req,res){
    var manager_id = req.params.managerId;
    Trip.find({manager:manager_id},function(err,trips){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(trips);
        }
    });
}

exports.list_all_trips_of_manager_validation =async function(req,res){
    var manager_id = req.params.managerId;
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);
    if(manager_id!== authenticatedUserId){
        res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
    } else { 
        Trip.find({manager:manager_id},function(err,trips){
            if(err){
                res.status(500).send(err);
            } else {
                res.json(trips);
            }
        });
    }
}

exports.search_trips = function(req,res){
    var query = {};
    var error = false;
    if (req.query.keyword) {
      query.$text = {$search: req.query.keyword};
    }

    if(req.query.minPrice && req.query.maxPrice){
        if(parseInt(req.query.minPrice) > parseInt(req.query.maxPrice)){
            //Error
            error=true;
            res.status(422).send({"name":"ValidationError", "message": "Mininum price is greater than maximum price"});
        } else {
            query.price = {$gte: req.query.minPrice, $lte: req.query.maxPrice};
        }
    } else {
        if(req.query.minPrice){
            query.price = {$gte: req.query.minPrice};
        }
        if(req.query.maxPrice){
            query.price = {$lte: req.query.maxPrice};
        }
    }


    if(new Date(req.query.minDate) > new Date(req.query.maxDate)){
        error=true;
        res.status(422).send({"name":"ValidationError", "message": "Mininum Date is greater than maximum Date"});
    }

    if(req.query.minDate){
        query.startDate = {$gte: req.query.minDate};
    }
    if(req.query.maxDate){
        query.endDate = {$lte: req.query.maxDate};
    }

    
  
    var skip=0;
    if(req.query.startFrom){
      skip = parseInt(req.query.startFrom);
    }
    var limit=0;
    if(req.query.pageSize){
      limit=parseInt(req.query.pageSize);
    }
  
    var sort="";
    if(req.query.reverse=="true"){
      sort="-";
    }
    if(req.query.sortedBy){
      sort+=req.query.sortedBy;
    }
    //logger.info("Query: "+query.toString()+" Skip:" + skip+" Limit:" + limit+" Sort:" + sort);
    //logger.info(query);
    if(!error){
        Trip.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(function(err, trips){
      //logger.info('Start searching trips');
      if (err){
        res.send(err);
      }
      else{
        res.json(trips);
      }
      //logger.info('End searching trips');
    });
    }
}

exports.create_an_trip = function(req,res){
    var new_trip = new Trip(req.body);
    new_trip.save(function(err, trip){
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        } else {
            res.json(trip)
        }
    });
}

exports.create_an_trip_validation =async function(req,res){
    var new_trip = new Trip(req.body);
    //Check if manager of the trip is the same of the manager that do the operation 
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);

    if(new_trip.manager!==authenticatedUserId){
        res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
    } else {
        new_trip.save(function(err, trip){
            if(err){
                if(err.name=='ValidationError'){
                    res.status(422).send(err);
                }
                else{
                    res.status(500).send(err);
                }
            } else {
                res.json(trip)
            }
        });
    }
}

exports.update_an_trip_ticker = function(req,res){
    Trip.findOneAndUpdate({ticker:req.params.ticker}, req.body, {new:true} ,function(err, trip){
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        } else {
            res.json(trip)
        }
    })
}

exports.update_an_trip_ticker_validation = async function(req,res){
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);
    Trip.findOne({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            if(trip.manager!==authenticatedUserId){
                res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
            } else {
                Trip.findOneAndUpdate({ticker:req.params.ticker}, req.body, {new:true} ,function(err, trip){
                    if(err){
                        if(err.name=='ValidationError'){
                            res.status(422).send(err);
                        }
                        else{
                            res.status(500).send(err);
                        }
                    } else {
                        res.json(trip)
                    }
                })
            }
        }
    })
}

exports.read_an_trip_ticker = function(req,res){
    Trip.findOne({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(trip)
        }
    })
}

exports.read_an_trip_id = function(req,res){
    Trip.findOne({_id:req.params.id}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(trip)
        }
    })
}

exports.delete_an_trip_ticker = function(req,res){
    Trip.remove({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            res.json(trip)
        }
    })
}

exports.delete_an_trip_ticker_validation =async function(req,res){
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);
    Trip.findOne({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            if(trip.manager!==authenticatedUserId){
                res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
            } else {
                Trip.remove({ticker:req.params.ticker}, function(err, trip){
                    if(err){
                        res.status(500).send(err);
                    } else {
                        res.json(trip)
                    }
                })
            }
        }
    })
}

exports.publish_an_trip = function(req,res){
    Trip.findOneAndUpdate({ticker:req.params.ticker}, {isPublished:true}, {new:true} ,function(err, trip){
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        } else {
            res.json(trip)
        }
    })
}

exports.publish_an_trip_validation =async function(req,res){
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);
    Trip.findOne({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            if(trip.manager!==authenticatedUserId){
                res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
            } else {
                Trip.findOneAndUpdate({ticker:req.params.ticker}, {isPublished:true}, {new:true} ,function(err, trip){
                    if(err){
                        if(err.name=='ValidationError'){
                            res.status(422).send(err);
                        }
                        else{
                            res.status(500).send(err);
                        }
                    } else {
                        res.json(trip)
                    }
                })
            }
        }
    })
}

exports.cancel_an_trip = function(req,res){
    Trip.findOneAndUpdate({ticker:req.params.ticker}, {reasonCancel:req.body.reasonCancel}, {new:true} ,function(err, trip){
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        } else {
            res.json(trip)
        }
    })
}

exports.cancel_an_trip_validation =async function(req,res){
    var idToken = req.headers['idtoken'];//WE NEED the FireBase custom token in the req.header['idToken']... it is created by FireBase!!
    var authenticatedUserId = await authController.getUserId(idToken);
    Trip.findOne({ticker:req.params.ticker}, function(err, trip){
        if(err){
            res.status(500).send(err);
        } else {
            if(trip.manager!==authenticatedUserId){
                res.send(400).send({"name":"ValidationError", "message": "Manager id and User id is not the same"});
            } else {
                Trip.findOneAndUpdate({ticker:req.params.ticker}, {reasonCancel:req.body.reasonCancel}, {new:true} ,function(err, trip){
                    if(err){
                        if(err.name=='ValidationError'){
                            res.status(422).send(err);
                        }
                        else{
                            res.status(500).send(err);
                        }
                    } else {
                        res.json(trip)
                    }
                })
            }
        }
    })
}