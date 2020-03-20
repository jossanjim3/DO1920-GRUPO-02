var async = require("async");
var mongoose = require('mongoose'),
  DataWareHouse = mongoose.model('DataWareHouse'),
  Trips =  mongoose.model('Trips'),
  Applications = mongoose.model('Applications'),
  Finders = mongoose.model('Finders'),
  Actors = mongoose.model('Actors'),
  Cube = require('../models/cubeModel');

var Table = require('olap-cube').model.Table

exports.list_all_indicators = function(req, res) {
  console.log('Requesting indicators');
  
  DataWareHouse.find().sort("-computationMoment").exec(function(err, indicators) {
    if (err){
      res.send(err);
    }
    else{
      res.json(indicators);
    }
  });
};

exports.last_indicator = function(req, res) {
  
  DataWareHouse.find().sort("-computationMoment").limit(1).exec(function(err, indicators) {
    if (err){
      res.send(err);
    }
    else{
      res.json(indicators);
    }
  });
};

getInformationCube = function(callback){
  Applications.aggregate([
    { $lookup:{
        'from': Trips.collection.name,
        'localField': 'trip',
        'foreignField': '_id',
        'as': 'trip'
      }
    },
    { $lookup: {
        'from': Actors.collection.name,
        'localField': 'explorer',
        'foreignField': '_id',
        'as': 'explorer'
      }
    },
    {
      $match : {"status" : "ACCEPTED"}
    },
    {
      $group: {
        _id: {explorer: "$explorer", year: {$year: "$createdAt"}, month: {$month: "$createdAt"}},
        totalSpent: {$sum: "$trip.price"}
      }
    }
  ], function(err, res){
    callback(err, res);
  });
}

function creatingCube(datos){
  var pointsCalculated = [];
  var dataCalculated = [];
  datos.map(dato => {
    pointsCalculated.push([dato._id.explorer, dato._id.year, dato._id.month]);
    dataCalculated.push([dato.totalSpent]);
  });

  const table = new Table({
    dimensions: ['explorer', 'year', 'month'],
    fields: ['totalSpent'],
    points: pointsCalculated,
    data: dataCalculated
  });

  return table;
}

var CronJob = require('cron').CronJob;
var CronTime = require('cron').CronTime;

//'0 0 * * * *' una hora
//'*/30 * * * * *' cada 30 segundos
//'*/10 * * * * *' cada 10 segundos
//'* * * * * *' cada segundo
var rebuildPeriod = '*/10 * * * * *';  //El que se usará por defecto
var computeDataWareHouseJob;
var cubeComputation;

exports.rebuildPeriod = function(req, res) {
  console.log('Updating rebuild period. Request: period:'+req.query.rebuildPeriod);
  rebuildPeriod = req.query.rebuildPeriod;
  computeDataWareHouseJob.setTime(new CronTime(rebuildPeriod));
  computeDataWareHouseJob.start();
  cubeComputation.setTime(new CronTime(rebuildPeriod));
  cubeComputation.start();

  res.json(req.query.rebuildPeriod);
};

function createDataWareHouseJob(){
      computeDataWareHouseJob = new CronJob(rebuildPeriod,  function() {
      
      var new_dataWareHouse = new DataWareHouse();
      console.log('Cron job submitted. Rebuild period: '+rebuildPeriod);
      async.parallel([
        computeTripsPerManager,
        computeApplicationsPerTrip,
        computePriceTrip,
        computeRatioApplications,
        computeAveragePriceRangeExplorers,
        computeTop10Keywords
      ], function (err, results) {
        if (err){
          console.log("Error computing datawarehouse: "+err);
        }
        else{
          //console.log("Resultados obtenidos por las agregaciones: "+JSON.stringify(results));
          new_dataWareHouse.TripsPerManager = results[0];
          new_dataWareHouse.ApplicationsPerTrip = results[1];
          new_dataWareHouse.PriceTrip = results[2];
          new_dataWareHouse.ratioApplications = results[3];
          new_dataWareHouse.averagePriceRangeExplorers = results[4];
          new_dataWareHouse.Top10keywords = results[5];
          new_dataWareHouse.rebuildPeriod = rebuildPeriod;
    
          new_dataWareHouse.save(function(err, datawarehouse) {
            if (err){
              console.log("Error saving datawarehouse: "+err);
            }
            else{
              console.log("new DataWareHouse succesfully saved. Date: "+new Date());
            }
          });
        }
      });
    }, null, true, 'Europe/Madrid');
    var new_cube = new Cube();
    cubeComputation = new CronJob(rebuildPeriod,  function() { //'0 0 0 */1 * *' Correct period. Once every midnight 00:00 AM.
      async.parallel([
        getInformationCube
      ], function (err, result) {
        if (err){
          console.log("Error computing datawarehouse: "+err);
        }
        else{
          new_cube.cube = creatingCube(result[0]);
          new_cube.points = new_cube.cube.points;
          new_cube.data = new_cube.cube.data;
          // TODO: Quitar el id del cubo, que parece cambiar y no se deja cambiar. new_cube._id
          Cube.updateOne({idCubo: 1}, new_cube, {upsert: true}, function(err, cube){
          /*Cube.deleteOne({id: 1}, function(req, res){
            if(err){
              console.log("Error removing cube: " + err);
            }
            else{
              new_cube.save(new_cube, function(err, cube){  
                */if (err){
                  console.log("Error saving cube: " + err);
                }
                else{
                  console.log("new Cube succesfully saved. Date: " + new Date());
                }
              /*});
            }*/
          });
          //
        }
      });
    }, null, true, 'Europe/Madrid');
}

createDataWareHouseJob();

exports.getCube = function(req, res){
  Cube.find({}, function(err, cube){
    if(err){
      res.status(500).send(err);
    }
    else{
      res.status(200).send(cube);
    }
  });
}

exports.getCubeWithInterval = function(req, res){
  
}


module.exports.createDataWareHouseJob = createDataWareHouseJob;


function computeTripsPerManager(callback){
  Trips.aggregate([
    {$group: {_id:"$manager", TripsPerManager:{$sum:1}}},
    {$group: { _id:0,
        average: {$avg:"$TripsPerManager"},
        min: {$min:"$TripsPerManager"},
        max: {$max:"$TripsPerManager"},
        stdev : {$stdDevSamp : "$TripsPerManager"}
        }}
  ], function(err, res){
    callback(err, res)
  });
}

function computeApplicationsPerTrip(callback){
  Applications.aggregate([
    { 
        $group : { 
            _id : "$manager", 
            contador : { 
                $sum : 1.0
            }
        }
    }, 
    { 
        $group : { 
            _id : 0.0, 
            average : { 
                $avg : "$contador"
            }, 
            min : { 
                $min : "$contador"
            }, 
            max : { 
                $max : "$contador"
            }, 
            stdev : { 
                $stdDevSamp : "$contador"
            }
        }
    }
  ],function(err,res){
    callback(err,res)
  });
}

function computePriceTrip(callback){
  Trips.aggregate([
    { 
        "$group" : { 
            "_id" : { 
                "manager" : "$manager"
            }, 
            "COUNT(*)" : { 
                "$sum" : { "$toInt": "1" }
            }, 
            "MIN(price)" : { 
                "$min" : "$price"
            }, 
            "MAX(price)" : { 
                "$max" : "$price"
            }, 
            "AVG(price)" : { 
                "$avg" : "$price"
            }, 
            "STDEV(price)" : { 
                "$stdDevSamp" : "$price"
            }
        }
    }, 
    { 
        "$project" : { 
            "manager" : "$_id.manager", 
            "count" : "$COUNT(*)", 
            "min" : "$MIN(price)", 
            "max" : "$MAX(price)", 
            "avg" : "$AVG(price)", 
            "stdev" : "$STDEV(price)"
        }
    }
], function(err,res){
  callback(err,res);
})
}

function computeRatioApplications(callback){
  Applications.aggregate([
    {$facet:{
          totalByStatusPending: [
            {$match : {"status" : "PENDING"}}, // 'PENDING','REJECTED','DUE','ACCEPTED','CANCELLED'
            {$group : {_id:null, totalStatus:{$sum:1}}}
          ],
          totalByStatusRejected: [
            {$match : {"status" : "REJECTED"}}, // 'PENDING','REJECTED','DUE','ACCEPTED','CANCELLED'
            {$group : {_id:null, totalStatus:{$sum:1}}}
          ],
          totalByStatusDue: [
            {$match : {"status" : "DUE"}}, // 'PENDING','REJECTED','DUE','ACCEPTED','CANCELLED'
            {$group : {_id:null, totalStatus:{$sum:1}}}
          ],
          totalByStatusAccepted: [
            {$match : {"status" : "ACCEPTED"}}, // 'PENDING','REJECTED','DUE','ACCEPTED','CANCELLED'
            {$group : {_id:null, totalStatus:{$sum:1}}}
          ],
          totalByStatusCancelled: [
            {$match : {"status" : "CANCELLED"}}, // 'PENDING','REJECTED','DUE','ACCEPTED','CANCELLED'
            {$group : {_id:null, totalStatus:{$sum:1}}}
          ],
          total:         [{$group : {_id:null, totalApplication:{$sum:1}}}]

          }
    },
          
    {$project: {_id:0,                            
              total : {$arrayElemAt: ["$total.totalApplication", 0 ]},
              totalByStatusPending : {$arrayElemAt: ["$totalByStatusPending.totalStatus", 0 ]},
              totalByStatusRejected : {$arrayElemAt: ["$totalByStatusRejected.totalStatus", 0 ]},
              totalByStatusDue : {$arrayElemAt: ["$totalByStatusDue.totalStatus", 0 ]},
              totalByStatusAccepted : {$arrayElemAt: ["$totalByStatusAccepted.totalStatus", 0 ]},
              totalByStatusCancelled : {$arrayElemAt: ["$totalByStatusCancelled.totalStatus", 0 ]},
              ratioApplicationsPending: { $divide: [
                  {$arrayElemAt: ["$totalByStatusPending.totalStatus", 0 ]}, 
                  {$arrayElemAt: ["$total.totalApplication", 0 ]} 
                ]
              },
              ratioApplicationsRejected: { $divide: [
                  {$arrayElemAt: ["$totalByStatusRejected.totalStatus", 0 ]}, 
                  {$arrayElemAt: ["$total.totalApplication", 0 ]} 
                ]
              },
              ratioApplicationsDue: { $divide: [
                  {$arrayElemAt: ["$totalByStatusDue.totalStatus", 0 ]}, 
                  {$arrayElemAt: ["$total.totalApplication", 0 ]} 
                ]
              },
              ratioApplicationsAccepted: { $divide: [
                  {$arrayElemAt: ["$totalByStatusAccepted.totalStatus", 0 ]}, 
                  {$arrayElemAt: ["$total.totalApplication", 0 ]} 
                ]
              },
              ratioApplicationsCancelled: { $divide: [
                  {$arrayElemAt: ["$totalByStatusCancelled.totalStatus", 0 ]}, 
                  {$arrayElemAt: ["$total.totalApplication", 0 ]} 
                ]
              }
            }

    }   
  ], function(err,res){
    callback(err,res);
  })
}

function computeAveragePriceRangeExplorers(callback){
  Finders.aggregate([
    { 
        "$group" : { 
            "_id" : { 

            }, 
            "AVG(minPrice)" : { 
                "$avg" : "$minPrice"
            }, 
            "AVG(maxPrice)" : { 
                "$avg" : "$maxPrice"
            }
        }
    }, 
    { 
        "$project" : { 
            "avgMinPrice" : "$AVG(minPrice)", 
            "avgMaxPrice" : "$AVG(maxPrice)", 
            "_id" : { "$toInt": "0" }
        }
    }
], function(err,res){
  callback(err,res);
});
}

function computeTop10Keywords(callback){
  Finders.aggregate([
    { 
        "$group" : { 
            "_id" : { 
                "keyword" : "$keyword"
            }, 
            "COUNT(*)" : { 
                "$sum" : 1
            }
        }
    }, 
    { 
        "$project" : { 
            "_id": 0,
            "keyword" : "$_id.keyword", 
            "count" : "$COUNT(*)"
}
    }, 
    { 
        "$sort" : { 
            "count" : -1
        }
    }, 
    { 
        "$limit" : 10
    }
], function(err,res){
  callback(err,res);
});
}