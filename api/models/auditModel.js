'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuditSchema = new Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    title:  {
        type: String,
        required: 'title is required'
    },
    description: {
        type: String,
        required: 'description is required'
    },
    atachment:  {
        type: String,
    },
    auditor: {
        type: Schema.Types.ObjectId,
        required: 'auditor id required'
    },
    trip: {
        type: Schema.Types.ObjectId,
        required: 'trip id required'
    },

}, {strict:false});

// Execute before each item.save() call
AuditSchema.pre('save', function(callback) {
    // do nothing at the moment
    callback();
});

module.exports = mongoose.model('Audits', AuditSchema)