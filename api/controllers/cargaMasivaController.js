'use strict';

var logger = require('../../logger');

var mongoose = require('mongoose'),
    Actor = mongoose.model('Actors'),
    Trip = mongoose.model('Trips'),
    Application = mongoose.model('Applications');

//----------------------------
// /v1/cargaMasiva/:numActors/:numTrips/:numApplis
//----------------------------

async function countActors() {
    let number = 0;
    number = await Actor.find({});
    return number.length;
}

async function countExplorers() {
    let number = 0;
    number = await Actor.find({role : "EXPLORER"});
    return number.length;
}

async function getExplorers() {
    let number;
    number = await Actor.find({role : "EXPLORER"});
    return number;
}

async function countManagers() {
    let number = 0;
    number = await Actor.find({role : "MANAGER"});
    return number.length;
}

async function getManagers() {
    let number;
    number = await Actor.find({role : "MANAGER"});
    return number;
}

async function countTrips() {
    let number = 0;
    number = await Trip.find({});
    return number.length;
}

// published a true and is not started and cancelled
async function getTrips() {
    let number;
    number = await Trip.find({"isPublished": true, 
                              "startDate" : {"$gt": new Date()}, 
                              "reasonCancel" : { "$exists" : false }} 
                            );                           
    return number;
}

async function countApplications() {
    let number = 0;
    number = await Application.find({});
    return number.length;
}

async function agregarNuevosActores(countAct,numNewActors){

    var contador = countAct + 1;
    var roleArray = [
        'EXPLORER',
        'MANAGER'
    ];

    var newActorsArray = [];

    for (var i = 0; i <= numNewActors-1; i++) {

        var randomNumber = Math.floor(Math.random()*roleArray.length);

        var newActor = new Actor({
            "name": "nameActor" + contador,
            "surname": "surnameActor" + contador,
            "email": "emailActor" + contador + "@gmail.com",
            "password": "nameActor" + contador,
            "phone": Math.floor(Math.random() * 100000000) + 1,
            "role": roleArray[randomNumber]
        });

        try {
            var actor = await newActor.save();
            newActorsArray.push(actor);
        } catch (error) {
            i = i - 1;
            contador = contador - 1;
        }

        contador += 1;
        
     }

     return newActorsArray;

}

async function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function agregarNuevosTrips(countTri,numNewTrips){

    var contador = countTri + 1;
    var newTripsArray = [];
    var managersBBDD = await getManagers();

    for (var i = 0; i <= numNewTrips-1; i++) {

        const startDate = await randomDate(new Date(2020, 0, 1), new Date(2021,0,1));   
        //logger.info("startDate1:" + startDate.toDateString());

        var numberToIncrement = Math.floor(Math.random()*30 + 1);
        //logger.info("numberToIncrement: " + numberToIncrement);

        var endDate   = await randomDate(startDate, new Date(2021, 0, 1));

        //logger.info("startDate2:" + startDate.toDateString());
        //logger.info("endDate:" + endDate.toDateString());

        var randomNumber = Math.floor(Math.random()*managersBBDD.length);

        var newTrip = new Trip(
            {
              "title": "Trip" + contador,
              "description": "Trip Description " + contador,
              "price": Math.floor(Math.random() * 3000) + 1,
              "requeriments": ["Requeriments A" + contador, "Requirements" + contador],
              "startDate": startDate,
              "endDate": endDate,
              "stages": [
                  {
                    "title": "Stage trip " + contador,
                    "description": "Stage trip description  " + contador,
                    "price": Math.floor(Math.random() * 1000) + 1,
                  }
                ],
              "isPublished" : Math.random() >= 0.5, //random boolean
              "manager": managersBBDD[randomNumber]
            }
          );
        
        try {
            var trip = await newTrip.save();
            newTripsArray.push(trip);
        } catch (error) {
            i = i - 1;
            contador = contador - 1;
        }        

        contador += 1;
        
     }
    
     return newTripsArray;

}

async function agregarNuevasApplications(countAppli,numNewApplis){

    var contador = countAppli + 1;
    var newApplissArray = [];
    var explorerBBDD = await getExplorers();
    var tripsBBDD = await getTrips();
    //logger.info(tripsBBDD.length);

    for (var i = 0; i <= numNewApplis-1; i++) {

        var randomNumberExplorer = Math.floor(Math.random()*explorerBBDD.length);
        var randomNumberTrip = Math.floor(Math.random()*tripsBBDD.length);

        var newAppl = new Application(
            {              
              "explorer": explorerBBDD[randomNumberExplorer],
              "trip": tripsBBDD[randomNumberTrip]
            }
          );

        try {
            var app = await newAppl.save();
            newApplissArray.push(app);
        } catch (error) {
            i = i - 1;
            contador = contador - 1;
        }

        contador += 1;
        
     }
    
     return newApplissArray;

}

// list all the applications
exports.loadData = async (req,res) => {

    const numNewActors = req.params.numActors;
    const numNewTrips  = req.params.numTrips;
    const numNewApplis = req.params.numApplis;

    logger.info("numNewActors: " + numNewActors + ", numNewTrips: " + numNewTrips + ", numNewApplis: " + numNewApplis);
    
    var countAct = await countActors();
    //logger.info("countAct:" + countAct);

    var countTri = await countTrips();
    //logger.info("countTri:" + countTri);

    var countAppli= await countApplications();
    //logger.info("countAppli:" + countAppli);

    var totalInicio = "ActorIni: " + countAct + ", TripsIni: " + countTri + ", ApplicationsIni: " + countAppli;
    logger.info(totalInicio);

    /* --------------------------------------- */
    /* AGREGO NUEVOS ACTORES */
    /* --------------------------------------- */

    // si se quieren crear nuevos actores
    if (numNewActors > 0 ) {              
        // creo nuevos actores, le paso cuando actores hay en bbdd para contador de nombres y cuantos nuevos quiero
        await agregarNuevosActores(countAct,numNewActors);
    }

    /* --------------------------------------- */
    /* AGREGO NUEVOS TRIPS */
    /* --------------------------------------- */

    // managers en bbdd
    var countMan = await countManagers();
    //logger.info("countMan:" + countMan);

    // si hay viajes nuevos por insertar y hay actores en bbdd
    if (numNewTrips > 0 && countMan > 0){
        // creo nuevos trips, le paso cuantos managers hay en bbdd para contador de nombres y cuantos nuevos quiero
        await agregarNuevosTrips(countTri,numNewTrips);

    }

    /* --------------------------------------- */
    /* AGREGO NUEVAS SOLICITUDES DE VIAJES */
    /* --------------------------------------- */

    // explorers en bbdd
    var countExplo = await countExplorers();
    //logger.info("countExplo:" + countExplo);

    // si hay viajes nuevos por insertar y hay actores en bbdd
    if (numNewApplis > 0 && countExplo > 0){
        // creo nuevas applis, le paso cuantos explorers hay en bbdd para contador de nombres y cuantos nuevos quiero
        await agregarNuevasApplications(countAppli,numNewApplis);

    }

    // print result operations
    countAct = await countActors();
    countTri = await countTrips();
    countAppli= await countApplications();

    var resultadoTotal = "ActorsTotal: " + countAct + ", TripsTotal: " + countTri + ", ApplicationsTotal: " + countAppli;
    logger.info(resultadoTotal);

    await res.status(200).json(totalInicio + " ----- " + resultadoTotal);


};
