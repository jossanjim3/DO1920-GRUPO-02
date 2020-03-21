const app = require("../app");
const chai = require("chai");
const expect = require("chai").expect;
const chaiHttp = require("chai-http");

const route = "/v1/finders"
const idExplorer = "5e4d890645dd27745b5f6e81";
const explorers = "/explorers"

chai.use(chaiHttp);
describe("Tests on finder", () => {
    describe("Tests on GET", () => {
        it("Gets all finders", done => {
            chai
            .request(app)
            .get(route)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
        it("Get finder by explorerID, unexistent", done => {
            chai
            .request(app)
            .get(route + "/explorers" + "/5e4d890645dd27745b5f6aaa")
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
    });
    describe("PUT or CREATE", () => {
        it("Create finder", done =>{
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({
                keyword: "Hawai",
                minDate: "2021"
            })
            .end((err, res) => {
                expect(res).to.have.status(201);
                done();
            });
        });
        it("Read finder, because no changes were made", done =>{
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({
                keyword: "Hawai",
                minDate: "2021"
            })
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
        it("Updates finder, because a change was made", done =>{
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({
                keyword: "Hawai",
                minDate: "2022"
            })
            .end((err, res) => {
                expect(res).to.have.status(201);
                done();
            });
        });
        it("Updates finder, no parameters, should work", done => {
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({})
            .end((err, res) => {
                expect(res).to.have.status(201);
                done();
            });
        })
        it("Invalid combination of dates introduced, expect error", done => {
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({
                keyword: "Hawai",
                minDate: "2022",
                maxDate: "2021"
            })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
        });
        it("Invalid combination of prices introduced, expect error", done => {
            chai
            .request(app)
            .put(route + explorers + "/" + idExplorer)
            .send({
                keyword: "Hawai",
                minPrice: 1000,
                maxPrice: 500
            })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
        });
    });
    describe("DELETE", () => {
        it("Delete finder by sponsor ID", done =>{
            chai
            .request(app)
            .delete(route + explorers + "/" + idExplorer)
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });
});

