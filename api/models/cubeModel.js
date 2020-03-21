'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var CubeSchema = new Schema({
    idCubo: {
        type: Number,
        required: true,
        unique: true,
        default: 1
    },
    cube: Object,
    points: Object,
    data: Object
});

module.exports = mongoose.model('Cube', CubeSchema);