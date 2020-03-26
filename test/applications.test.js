
var logger = require('../../logger');

const app = require("../app");
const chai = require("chai");
const chaiHttp = require("chai-http");
var mongoose = require('mongoose'),
Actor = mongoose.model('Actors'),
Trip = mongoose.model('Trips'),
Application = mongoose.model('Applications');

const { expect } = chai;
chai.use(chaiHttp);

describe("API Testing for Applications", () => {

  // hacer mock para que no interfiera los datos de BB.DD. con los de test...
  let explorerTest;
  let managerTest;
  let tripTest;
  let appIdTmp;
  let applicationTest;     
    
  // este bloque se ejecuta antes de todo
  before( (done) => {

    explorerTest = new Actor(
      {
        "name": "testExplorer",
        "surname": "testExplorer",
        "email": "testExplorer@gmail.com",
        "password": "testExplorer",
        "phone": "+34666555987",
        "role": "EXPLORER"
      }
    );
    explorerTest.save(function (err) {
      if (err) return handleError(err);
      // saved!
      logger.info("Explorer test saved! : " + explorerTest._id);
    });  

    managerTest = new Actor(
      {
        "name": "testManager",
        "surname": "testManager",
        "email": "testManager@gmail.com",
        "password": "testManager",
        "phone": "+34666555987",
        "role": "MANAGER"
      }
    );
    managerTest.save(function (err,res) {
      if (err) return handleError(err);
      // saved!
      logger.info("Manager test saved! : " + managerTest._id);
    }); 

    tripTest = new Trip(
      {
        "title": "Trip Test",
        "description": "Trip Test Description",
        "price": 200,
        "requeriments": ["Ser mayor de edad", "No se permite fumar"],
        "startDate": "2020-03-28",
        "endDate": "2020-03-31",
        "stages": [
            {
              "title": "Viaje Test stages",
              "description": "Viaje Test stages description",
              "price": 200
            }
          ],
        "isPublished" : true,
        "manager": managerTest._id
      }
    );
    tripTest.save(function (err) {
      if (err) return handleError(err);
      // saved!
      logger.info("Trip test saved! : " + tripTest._id);
    }); 

    done();
  });

  it("Get all applications",  function (done) {
    
    this.timeout(10000); // 10 second timeout only for this test

    chai
      .request(app)
      .get("/v1/applications")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect('Content-Type', /json/);
        if (err) {
          done(err);
        } else {
          appIdTmp = res.body._id;
          //logger.info(appIdTmp);          
          done();
          
        }
      });
  });

  it("Post Applications", (done) => {
    chai
      .request(app)
      .post("/v1/applications")
      .send({"explorer":explorerTest._id,"trip":tripTest._id})
      .end((err, res) => {
        expect(res).to.have.status(200);
        //expect(res.body.status).to.equals("success");
        //expect(res.body.result).to.equals(10);
        if (err) {
          done(err);
        } else {
          appIdTmp = res.body._id;
          //logger.info(appIdTmp);          
          done();
          
        }
      });          
  });     
  
  it("Get One Application", done => {
    chai
      .request(app)
      .get("/v1/applications/" + appIdTmp)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect('Content-Type', /json/);
        if (err) done(err);
        else done();
      });
  });


  it("Update One Application from PENDING to DUE", done => {
    chai
      .request(app)
      .put("/v1/applications/" + appIdTmp)
      .end((err, res) => {
        expect(res).to.have.status(201);
        //expect(res.body.status).to.equals("success");
        //expect(res.body.result).to.equals(10);
        if (err) done(err);
        else done();
      });
  }); 

  it("Update One Application from DUE to ACCEPTED", done => {
    chai
      .request(app)
      .put("/v1/applications/" + appIdTmp)
      .end((err, res) => {
        expect(res).to.have.status(201);
        //expect(res.body.status).to.equals("success");
        //expect(res.body.result).to.equals(10);
        if (err) done(err);
        else done();
      });
  });
  

  it("Cancel One Application with status ACCEPTED", done => {
    chai
      .request(app)
      .put("/v1/applications/" + appIdTmp + "/cancel")
      .end((err, res) => {
        expect(res).to.have.status(201);
        //expect(res.body.status).to.equals("success");
        //expect(res.body.result).to.equals(10);
        if (err) done(err);
        else done();
      });
  });   

  it("Get Applications that explorer have made", done => {
    chai
      .request(app)
      .get("/v1/applications/users/" + explorerTest._id)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect('Content-Type', /json/);
        if (err) done(err);
        else done();
      });
  });

  it("Get Applications from a Trip", done => {
    chai
      .request(app)
      .get("/v1/applications/trips/" + tripTest._id)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect('Content-Type', /json/);
        if (err) done(err);
        else done();
      });
  }); 
  
  it("Delete One Application", done => {
    chai
      .request(app)
      .delete("/v1/applications/" + appIdTmp)
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect('Content-Type', /json/);
        if (err) done(err);
        else done();
      });
  });
  

  // este bloque se ejecuta despues de todo
  after( (done) => {
    //logger.info(applicationTest._id);

    Application.deleteOne({ _id: appIdTmp }, function (err) {
      if (err) return handleError(err);
      else "Application Test deleted!";
    }); 

    Trip.deleteOne({ _id: tripTest._id }, function (err) {
      if (err) return handleError(err);
      else "Trip Test deleted!";
    });

    Actor.deleteOne({ _id: explorerTest._id }, function (err) {
      if (err) return handleError(err);
      else "Explorer Test deleted!";
    });

    Actor.deleteOne({ _id: managerTest._id }, function (err) {
      if (err) return handleError(err);
      else "Manager Test deleted!";
    });

    done();
  });

});

