'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const generate = require('nanoid/generate');
const dateFormat = require('dateformat');

var stagesSchema = new Schema({
    title:{
        type: String,
        required: 'Kindly enter the title of the stage'
    },
    description: {
        type:String,
        required: 'Kindly enter the description of the stage'
    },
    price: {
        type: Number,
        required: 'Kindly enter the price of the stage',
        min: 0
    }
}, { strict: false });

var tripSchema = new Schema({
    ticker: {
        type: String,
        unique: true,
        //This validation does not run after middleware pre-save
        validate: {
            validator: function(v) {
                return /\d{6}-[A-Z]{4}/.test(v);
            },
            message: 'ticker is not valid!, Pattern("\d(6)-[A-Z](4)")'
        }
    },
    title: {
        type: String,
        required: 'Kindly enter the title of the trip'
    },
    description: {
        type: String,
        required: 'Kindly enter the description of the trip'
    },
    price: {
        type: Number,
        min: 0
    },
    requeriments:{
        type:[String],
        required: 'Kindle enter some requeriments for the trip'
    },
    startDate:{
        type: Date,
        validate: function(startDate) {
            return startDate < this.endDate;
        },
        message: 'startDate can\'t be greater than endDate'
    },
    endDate:{
        type: Date
    },
    pictures: [{
        data: Buffer,
        contentType: String
    }],
    isPublished:{
        type: Boolean,
        default: false
    },
    reasonCancel: {
        type: String,
        validate: {
            validator: function() {
                return this.startDate > new Date();
            },
            message: 'Can\'t cancel a started trip'
        }
    },
    stages: {
        type:[stagesSchema],
        required: 'Kindle enter one stage of the trip'
    },
    manager:{
        type: Schema.Types.ObjectId,
        required: 'Kindle enter a manager of the trip'
    }
});

// Execute before each trip.save() call
tripSchema.pre('save', function(callback) {
    var new_trip = this;
    var day=dateFormat(new Date(), "yymmdd");
  
    var generated_ticker = [day, generate('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4)].join('-')
    new_trip.ticker = generated_ticker;
    callback();
});

tripSchema.index({ ticker: 'text', title: 'text', description: 'text' });

exports.tripSchema = tripSchema;

exports.tripModel = mongoose.model('Trips', tripSchema);