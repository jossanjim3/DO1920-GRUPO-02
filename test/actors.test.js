const app = require("../app");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = chai;
chai.use(chaiHttp);


describe("API Testing actors", () => {

    let id='';

    it("Post Actor 1: request the post of an actor as an explorer", done => {
      chai
        .request(app)
        .post("/v1/actors")
        .send({"role":"EXPLORER","validated":false,"name":"Miguel","surname":"Agudo","email":"esteMiguel@gmail.com","password":"abcdefghj","phone":"+34612345679","address":"Avenida de reina Mercedes"})
        .end((err, res) => {
          id=res.body._id;//the id of the actor is saved so that next tests can access to this actor.
          expect(res).to.have.status(200);
          expect('Content-Type', /json/);
          if (err) done(err);
          else done();
        });
    });


    it("Post Actor 2: request the post of an actor as an administrator but it is not possible", done => {
      chai
        .request(app)
        .post("/v1/actors")
        .send({"preferredLanguage":"en","role":"ADMINISTRATOR","validated":false,"name":"Carlos","surname":"Agudo","email":"carlos@fakemail11.com","password":"abecdedfg","phone":"+34612345679","address":"myAddress"})
        .end((err, res) => {
          expect(res).to.have.status(422);
          done();
        });
    });

    it("Post Actor 3: request the post of an actor as an explorer but there are some required fields which are missing", done => {
      chai
        .request(app)
        .post("/v1/actors")
        .send({"preferredLanguage":"en","role":"EXPLORER","validated":false,"name":"Carlos","surname":"Agudo","password":"xdfftghjit","phone":"+34612345679","address":"myAddress"})
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });

  

    it("Get Actor 1: request of an actor and he/she exists", done => {
    
      chai
        .request(app)
        .get("/v1/actors/"+id)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect('Content-Type', /json/);
          if (err) done(err);
          else done();
        });
    });

    it("Get Actor 2: request of an actor but he/she does not exist", done => {
      chai
        .request(app)
        .get("/v1/actors/"+"erth976645")
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });

    it("Validate Actor 1: request the validation of an actor", done => {
      chai
        .request(app)
        .put("/v1/actors/"+id+"/validated")
        .send({"validated":true})
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect('Content-Type', /json/);
          if (err) done(err);
          else done();
        });
      })

      it("Validate Actor 2: request the validation of an actor but the actor does not exist", done => {
        chai
          .request(app)
          .put("/v1/actors/"+"345678"+"/validated")
          .send({"validated":true})
          .end((err, res) => {
            expect(res).to.have.status(500);
            if (err) done(err);
            else done();
          });
        })

    
      it("Put Actor 1: request the modification of an actor", done => {
      chai
        .request(app)
        .put("/v1/actors/"+id)
        .send({"name":"Miguel Angel"})
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect('Content-Type', /json/);
          if (err) done(err);
          else done();
        });
      })

      it("Put Actor 2: request the modification of an actor but he/she does not exist in the database", done => {
        chai
          .request(app)
          .put("/v1/actors/"+"abecdftgh")
          .send({"name":"Pepe"})
          .end((err, res) => {
            expect(res).to.have.status(500);
            if (err) done(err);
            else done();
          });
        })


      it("Delete Actor 1: request the deletion of actor", done =>{
          chai
          .request(app)
          .delete("/v1/actors/"+id)
          .end((err, res) => {
            expect(res).to.have.status(200);
            if (err) done (err);
            else done();
          });
      
      });

      it("Delete Actor 2: request the deletion of actor but he/she does not exist", done =>{
        chai
        .request(app)
        .delete("/v1/actors/"+"abhdjiun")
        .end((err, res) => {
          expect(res).to.have.status(500);
          if (err) done (err);
          else done();
        });
    });
      
});