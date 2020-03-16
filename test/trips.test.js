const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

let port = process.env.PORT || 8080;
const url = 'http://localhost:'+ port;

describe('Tests Trips', ()=>{
    let ticker_id='';
    let trip_test;
    describe('Post a Trip', ()=>{
        it('Post successfull',(done)=>{
            chai.request(url)
            .post('/v1/trips')
            .send({
                title: "Viaje a hawai",
                description: "Viaje paradisiaco para disfrutar de la naturaleza y el mar",
                price: 400,
                requeriments: ["Ser mayor de edad", "No se permite fumar"],
                startDate: "2020-12-09",
                endDate: "2020-12-16",
                stages: [
                        {
                            title: "Buceo",
                            description: "Buceo al rededor de las islas, para comprobar la naturaleza marina.",
                            price: 200
                        },
                        {
                            title: "Surf",
                            description: "Surf en playas hawaianas",
                            price: 200
                        }
                    ],
                manager: "5e47fcb3aed9531440793134"
            })
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                ticker_id = res.body.ticker;
                trip_test = res.body;
                done();
            })
        })

        it('Post Validation Error',(done)=>{
            chai.request(url)
            .post('/v1/trips')
            .send({
                description: "Viaje paradisiaco para disfrutar de la naturaleza y el mar",
                price: 400,
                requeriments: ["Ser mayor de edad", "No se permite fumar"],
                startDate: "2020-12-09",
                endDate: "2020-12-16",
                stages: [
                        {
                            title: "Buceo",
                            description: "Buceo al rededor de las islas, para comprobar la naturaleza marina.",
                            price: 200
                        },
                        {
                            title: "Surf",
                            description: "Surf en playas hawaianas",
                            price: 200
                        }
                    ],
                manager: "5e47fcb3aed9531440793134"
            })
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(422);
                done();
            })
        })
    })

    describe('Read a Trip',()=>{
        it('Read a trip successfull',(done)=>{
            chai.request(url)
            .get('/v1/trips/'+ticker_id)
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Update a Trip',()=>{
        it('Update a trip successfull',(done)=>{
            chai.request(url)
            .put('/v1/trips/'+ ticker_id)
            .send({
                description: "Viaje Modificado",
            })
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('List all trips of a manager',()=>{
        it('List trips successfull',(done)=>{
            chai.request(url)
            .get('/v1/trips/manager/'+trip_test.manager)
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Publish an trip',()=>{
        it('Publish successfull',(done)=>{
            chai.request(url)
            .put('/v1/trips/'+ticker_id+'/publish')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Cancel an trip',()=>{
        it('Cancel successfull',(done)=>{
            chai.request(url)
            .put('/v1/trips/'+ticker_id+'/publish')
            .send({reasonCancel:"No se puede hacer el viaje"})
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Search trips',()=>{

        it('Search trips successfull',(done)=>{
            chai.request(url)
            .get('/v1/trips/search?keyword=Hawai&minPrice=100&maxPrice=500&minDate=2020-12-04&maxDate=2020-12-20')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })

        it('Search trips Price Validation',(done)=>{
            chai.request(url)
            .get('/v1/trips/search?keyword=Hawai&minPrice=1000&maxPrice=500')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(422);
                done();
            })
        })

        it('Search trips Date Validation',(done)=>{
            chai.request(url)
            .get('/v1/trips/search?keyword=Hawai&minDate=2020-12-22&maxDate=2020-12-20')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(422);
                done();
            })
        })
    })

    describe('Delete an trip',()=>{
        it('Delete an trip successfull',(done)=>{
            chai.request(url)
            .delete('/v1/trips/'+ticker_id)
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })
})


