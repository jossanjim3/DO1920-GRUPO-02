
var async = require("async");
var mongoose = require('mongoose'),
  DataWareHouse = mongoose.model('DataWareHouse'),
  Trips =  mongoose.model('Trips'),
  Applications = mongoose.model('Applications'),
  Finders = mongoose.model('Finders')

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

var CronJob = require('cron').CronJob;
var CronTime = require('cron').CronTime;

//'0 0 * * * *' una hora
//'*/30 * * * * *' cada 30 segundos
//'*/10 * * * * *' cada 10 segundos
//'* * * * * *' cada segundo
var rebuildPeriod = '*/10 * * * * *';  //El que se usará por defecto
var computeDataWareHouseJob;

exports.rebuildPeriod = function(req, res) {
  console.log('Updating rebuild period. Request: period:'+req.query.rebuildPeriod);
  rebuildPeriod = req.query.rebuildPeriod;
  computeDataWareHouseJob.setTime(new CronTime(rebuildPeriod));
  computeDataWareHouseJob.start();

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
          console.log("Resultados obtenidos por las agregaciones: "+JSON.stringify(results));
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
                "$sum" : NumberInt(1)
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
            "_id" : NumberInt(0)
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
                "$sum" : NumberInt(1)
            }
        }
    }, 
    { 
        "$project" : { 
            "keyword" : "$_id.keyword", 
            "count" : "$COUNT(*)"
}
    }, 
    { 
        "$sort" : { 
            "COUNT(*)" : NumberInt(-1)
        }
    }, 
    { 
        "$limit" : NumberInt(10)
    }
], function(err,res){
  callback(err,res);
});
}
