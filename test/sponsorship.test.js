const chai = require("chai");
const expect = require("chai").expect;
const chaiHttp = require("chai-http");

const route = "/v1/sponsorships"
const idSponsor = "5e4d890345dd27745b5f6e81";
const idTrip = "5e52755ba9be7b1c51e2d890";
var idSponsorship = "";

let port = process.env.PORT || 8080;
const url = 'http://localhost:'+ port;

chai.use(chaiHttp);
describe("Tests on Sponsorships", () => {

    describe("POST", () => {
        
        it("Create Sponsorship", done =>{
            chai
            .request(url)
            .post(route)
            .send({
                "banner": "Banner de prueba",
                "link": "Link de prueba",
                "sponsor": "5e4d890345dd27745b5f6e81",
                "tripSponsorships": [{"trip":"5e52755ba9be7b1c51e2d890"}]
            })
            .end((err, res) => {
                expect(res).to.have.any.status(201);
                idSponsorship = res.body._id;
                done();
            });
        });
        it("Create duplicated Sponsorship, expect error", done =>{
            chai
            .request(url)
            .post(route)
            .send({
                "banner": "No aun",
                "link": "No aun",
                "sponsor": "5e4d890345dd27745b5f6e81",
                "tripSponsorships": [{"trip":"5e52755ba9be7b1c51e2d890"}]
            })
            .end((err, res) => {
                expect(res).to.have.any.status(500);
                done();
            });
        });
    });

    describe("Tests on GET", () => {
        it("Gets all Sponsorships", done => {
            chai
            .request(url)
            .get(route)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
        it("Gets sponsorship by ID", done => {
            chai
            .request(url)
            .get(route + "/" + idSponsorship)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
        it("Gets sponsorship by SponsorID", done => {
            chai
            .request(url)
            .get(route + "/sponsors" + "/" + idSponsor)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
        it("Gets sponsorship by TripID", done => {
            chai
            .request(url)
            .get(route + "/trips" + "/" + idTrip)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    describe("PUT", done => {
        it("Update sponsorship", done =>{
            chai
            .request(url)
            .put(route + "/" + idSponsorship)
            .send({"banner": "Sigue sin haber banner"})
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Sponsorship not found in paying, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + "5e4d890645dd27745b5f6aaa" + "/" + idTrip + "/pay")
            .end((err, res) => {
                expect(res).to.have.status(404);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Sponsorship not found in cancelling, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + "5e4d890645dd27745b5f6aaa" + "/" + idTrip + "/cancel")
            .end((err, res) => {
                expect(res).to.have.status(404);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Trip not found in paying, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + "5e4d890645dd27745b5f6aaa" + "/pay")
            .end((err, res) => {
                expect(res).to.have.status(404);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Trip not found in cancelling, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + "AAAAAAA" + "/cancel")
            .end((err, res) => {
                expect(res).to.have.status(404);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Pay a sponsorship for a trip", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + idTrip + "/pay")
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Pay a sponsorship for a trip already paid, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + idTrip + "/pay")
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Cancel a sponsorship for a trip", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + idTrip + "/cancel")
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
        it("Cancel a sponsorship for a trip not paid or already canceled, expect error", done => {
            chai
            .request(url)
            .put(route + "/" + idSponsorship + "/" + idTrip + "/cancel")
            .end((err, res) => {
                expect(res).to.have.status(422);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });

    describe("DELETE", () => {
        it("Delete finder by sponsor ID", done =>{
            chai
            .request(url)
            .delete(route + "/" + idSponsorship)
            .end((err, res) => {
                expect(res).to.have.status(200);
                //expect(res).to.have({message: "Finder eliminado."});
                done();
            });
        });
    });
});