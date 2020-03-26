var logger = require('../../logger');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trips_schema_for_finder = new Schema({
    ticker: {
        type: String,
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
    startDate:{
        type: Date
    },
    endDate:{
        type: Date
    },
    pictures: [{
        data: Buffer,
        contentType: String
    }],
    reasonCancel: {
        type: String,
        validate: {
            validator: function() {
                return this.startDate > new Date();
            },
            message: 'Can\'t cancel a started trip'
        }
    }
});

var finderSchema = new Schema({
    explorer: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    keyword: {
        type: String,
        default: null
    },
    minDate: {
        type: Date,
        default: null
    },
    maxDate: {
        type: Date,
        default: null
    },
    minPrice: {
        type: Number,
        default: null
    },
    maxPrice: {
        type: Number,
        default: null
    },
    results: {
        type: [trips_schema_for_finder]
    },
    timestamp: {
        type: Date
    }
}, {strict: true});

finderSchema.pre('save', function(callback){
    logger.info("Middleware Save");
    var timestamp = new Date();
    var newFinder = this;
    newFinder.timestamp = timestamp;

    callback();
});

finderSchema.pre('updateOne', function(callback){
    logger.info("Middleware Update One");
    var timestamp = new Date();
    var newFinder = this;
    newFinder.timestamp = timestamp;

    callback();
});

finderSchema.index({timestamp: -1});
finderSchema.index({explorer: 1});

exports.TripsSchemaFinder = mongoose.model('TripSchemaFinder', trips_schema_for_finder);

exports.FinderModel = mongoose.model('Finders', finderSchema);