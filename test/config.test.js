const app = require("../app");
const chai = require("chai");
const expect = require("chai").expect;
const chaiHttp = require("chai-http");

route = '/v1/config';

describe("Tests on config parameters for Finder", () => {
    describe("Max Hours", () => {
        it("Max hours", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_hours_finder_stored: 2})
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Max hours, invalid parameter, higher than max", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_hours_finder_stored: 25})
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Max hours, invalid parameter, lower than min", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_hours_finder_stored: 0})
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });
    describe("Max Results", () => {
        it("Max results", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_trips_results: 1})
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Max results, invalid parameter, higher than max", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_trips_results: 101})
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Max results, invalid parameter, lower than min", done => {
            chai
            .request(app)
            .put(route)
            .send({max_number_trips_results: 0})
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });
});

describe("Tests on config parameters for Sponsorship", () => {
    describe("Flat rate", () => {
        it("Correct flat rate", done => {
            chai
            .request(app)
            .put(route)
            .send({flat_rate_sponsorships: 100})
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Flat rate, invalid parameter, lower than minimun", done => {
            chai
            .request(app)
            .put(route)
            .send({flat_rate_sponsorships: -1})
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });
});