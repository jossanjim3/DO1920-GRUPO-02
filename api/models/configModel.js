'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var config_schema = new Schema({
    configNumber: {
        type: Number,
        unique: true,
        default: 1
    },
    max_number_hours_finder_stored:{
        type: Number,
        validate: {
            validator: function(hours) {
                return hours > 0 && hours < 24;
            },
            message: 'The hour introduced is not valid. It must be between 1 and 24.'
        },
        default: 1
    },
    max_number_trips_results:{
        type: Number,
        validate: {
            validator: function(trips) {
                return trips > 0 && trips < 100;
            },
            message: 'The number of results introduced is not valid. It must be between 1 and 100.'
        },
        default: 10
    },
    flat_rate_sponsorships:{
        type: Number,
        validate: {
            validator: function(v) {
                return v >= 0;
            },
            message: 'The flat rate introduced is not valid. It must be higher or equal to 0.'
        }
    }
}, {strict: true});

module.exports = mongoose.model('Config', config_schema);