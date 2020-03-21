var mongoose = require('mongoose'),
    Config = require('../models/configModel');

exports.getConfig = function(req, res){
    Config.find({configNumber: 1}, (err, config)=>{
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).send(config);
        }
    });
}

exports.updateConfig = function(req, res){
    Config.updateOne({configNumber: 1}, {$set: req.body}, {upsert:true, runValidators:true}, (err, config)=>{
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        }
        else{
            res.status(200).send(config);
        }
    });
}

exports.updateConfig_auth = function(req, res){
    Config.updateOne({configNumber: 1}, {$set: req.body}, {upsert:true, runValidators:true}, (err, config)=>{
        if(err){
            if(err.name=='ValidationError'){
                res.status(422).send(err);
            }
            else{
                res.status(500).send(err);
            }
        }
        else{
            res.status(200).send(config);
        }
    });
}