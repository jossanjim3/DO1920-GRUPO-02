'use strict';

module.exports = function (app){
    
    var cargaMasiva = require('../controllers/cargaMasivaController');

    app.route('/v1/cargaMasiva/:numActors/:numTrips/:numApplis')
        // load all the data example
        .post(cargaMasiva.loadData)        

}