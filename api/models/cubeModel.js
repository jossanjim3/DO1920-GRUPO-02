'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var CubeSchema = new Schema({
    cube: Object,
    points: Object,
    data: Object
});

module.exports = mongoose.model('Cube', CubeSchema);