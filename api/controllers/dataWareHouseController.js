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



/*------------------Cubo---------------------------------*/

/**
 * Creation part
 */
var getInformationCube = function(callback){
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
        _id: {explorer: "$explorer.email", year: {$year: "$createdAt"}, month: {$month: "$createdAt"}},
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

/**
 * Query part
 */

exports.getCube = function(req, res){
  Cube.findOne({}, function(err, result){
      if(err){
        res.status(500).send(err);
      }
      else{
        res.status(200).send(result);
      }
  });
}


function getCubeData(){
  return new Promise((resolve,reject)=>{
    Cube.findOne({}, function(err, result){
      if(err){
        reject(err);
      } else {
        var table = new Table({
          dimensions: result.cube.dimensions,
          fields: result.cube.fields,
          points: result.points,
          data: result.data
        })
        resolve(table);
      } 
    });
  })
}

function getCubeDataByDates(pairMonthYear, table){
  const inPeriod = ((point) => {
    return (
      //Checking if month and year are past the actual month, or the month where we start to consider.
      (point[1] < pairMonthYear[0][0] && point[2] < pairMonthYear[0][1]) &&
      //Checking if we do not go further than 36 months, or those introduced.
      (point[1] > pairMonthYear[1][0] && point[2] > pairMonthYear[1][1])
    )
  });

  var tableFiltered = table.dice(inPeriod);
  return tableFiltered;
}

function getCubeDataByUser(userEmail, table){
  const onlyUser = ((point) => point[0][0] === userEmail);

  var tableFiltered = table.dice(onlyUser);
  return tableFiltered;
}

  /**
   * Son dos 0, porque el array se imprime en la forma [ [ [ [Object] ], 2020, 3 ] ], donde object es el actor.
   * Por ahora se imprime asi porque el actor se guarda como objeto. Si da tiempo, intentaremos guardarlo como nombre.
   */ 
function obtainingPairMonthYear(monthsBackwards){
  var today = new Date();
  var actualMonth = today.getMonth();
  var actualYear = today.getYear();

  var year = actualYear;
  var month = actualMonth - monthsBackwards;
  
  while(month < 1){
    month += 12;
    --year;
  }
  return [month, year];
}

function getStartingDateAndEndingDate(startingMonth, endingMonth){
  var pairMonthYear = []
  pairMonthYear.push(obtainingPairMonthYear(startingMonth));
  pairMonthYear.push(obtainingPairMonthYear(endingMonth));
  return pairMonthYear;
}

function getCubeDataByInterval(startingMonth, endingMonth){
  return new Promise((resolve,reject)=>{
    var pairMonthYear = getStartingDateAndEndingDate(startingMonth, endingMonth);
    var table_prom = getCubeData();
    table_prom.then((table,err)=>{
      //We are filtering the data by the period.
      table = getCubeDataByDates(pairMonthYear, table);
      
      resolve(table);
    })
  });
}

exports.getCubeDataByIntervalMonths = function(req, res){
  var promise = new Promise(function(resolve, reject){
    var cube_prom = getCubeDataByInterval(req.params.startingMonth, req.params.endingMonth);
    cube_prom.then((cube,err)=>{
      console.log(cube.rows);
      cube = getCubeDataByUser(req.params.emailUser, cube);
      console.log(cube.rows);
      if(cube !== null){
        var sol = new Table({
          dimensions: cube.dimensions,
          fields: cube.fields,
          points: cube.points,
          data: cube.data
        });
        resolve(sol);
      }
      else{
        reject("Cubo nulo");
      }
    })
  });
  promise.then((cube)=>{
    var jsonToReturn = {structure: cube, values: cube.rows}
    res.status(200).send(jsonToReturn);
  })
  .catch((err)=>{
    res.status(500).send(err);
  });
}

exports.getCubeDataByComparisonAndMonths = function(req, res){
  let amount = req.params.amount;
  let map = {
    "gte": (amountToCompare) => amountToCompare >= amount,
    "gt": (amountToCompare) => amountToCompare > amount,
    "eq": (amountToCompare) => amountToCompare == amount,
    "lte": (amountToCompare) => amountToCompare <= amount,
    "lt": (amountToCompare) => amountToCompare < amount
  }

  const summation = (sum, value) => {
    return [sum[0] + value[0]];
  }
  const initialValue = [0];

  var promise = new Promise(function(resolve, reject){
    var cube_prom = getCubeDataByInterval(req.params.startingMonth, req.params.endingMonth);
    cube_prom.then((cube,err)=>{

      if(!(req.params.condition in map)){
        reject("Comparison operator not valid. Valid ones: gte, gt, eq, lte, lt.");
      }
      else{
        comparisonOperator = req.params.condition;
        let cubeRolledUp = cube.rollup('explorer', ['totalSpent'], summation, initialValue);
        comparisonFunction = map[comparisonOperator];
        let cubeRolledUpFiltered = cubeRolledUp.rows.filter((row) => {
          return comparisonFunction(row[1]);
        });
        console.log(cubeRolledUpFiltered);
        
        if(cubeRolledUpFiltered !== null){
          sol = cubeRolledUpFiltered;
          resolve(sol);
        }
        else{
          reject("Cubo nulo");
        }
      }
    })
  });
  promise.then((cube)=>{
    var jsonToReturn = {structure: cube, values: cube.rows}
    res.status(200).send(jsonToReturn);
  })
  .catch((err)=>{
    res.status(500).send(err);
  });
}

/*function getCubeDataByIntervalYears(){

}

function getCubeDataByComparisonMoney(){

}*/
/*------------------Cubo(End)---------------------------------*/




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

    cubeComputation = new CronJob(rebuildPeriod,  function() { //'0 0 0 */1 * *' Correct period. Once every midnight 00:00 AM.
      async.parallel([
        getInformationCube
      ], function (err, result) {
        if (err){
          console.log("Error computing datawarehouse: "+err);
        }
        else{
          Cube.deleteMany({},function(err,cube){
            if(err){
              console.error("Error deleting all cubes: " + err);
            } else {
              let new_cube = new Cube();
              new_cube.cube = creatingCube(result[0]);
              new_cube.points = new_cube.cube.points;
              new_cube.data = new_cube.cube.data;
              //new_cube.data.map(dato => console.log(new_cube.data.indexOf(dato)));
              // ToDo: Quitar el id del cubo, que parece cambiar y no se deja cambiar. new_cube._id
              new_cube.save(function(err, cube){
                if(err){
                  console.log("Err on saving cube: " + err);
                }
                else{
                  console.log("Cube correctly saved");
                }
              });
            }
          });
          /*
          Cube.updateOne({idCubo: 1}, new_cube, {upsert: true}, function(err, cube){
            if (err){
              console.log("Error saving cube: " + err);
            }
            else{
              console.log("new Cube succesfully saved. Date: " + new Date());
            }
          });*/
        }
      });
    }, null, true, 'Europe/Madrid');
}

createDataWareHouseJob();
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