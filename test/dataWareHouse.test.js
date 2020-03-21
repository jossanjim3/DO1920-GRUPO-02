const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

let port = process.env.PORT || 8080;
const url = 'http://localhost:'+ port;

describe('Tests DataWareHouse', ()=>{
    describe('Get all indicators', ()=>{
        it('Get successfull',(done)=>{
            chai.request(url)
            .get('/v1/dataWareHouse')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Post a rebuild period', ()=>{
        it('Post successfull',(done)=>{
            chai.request(url)
            .post('/v1/dataWareHouse?rebuildPeriod=* * * * * *')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

    describe('Get a list of last computed indicator', ()=>{
        it('Get successfull',(done)=>{
            chai.request(url)
            .get('/v1/dataWareHouse/latest')
            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
        })
    })

})


