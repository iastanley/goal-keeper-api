const chai = require('chai');
const chaiHttp = require('chai-http');

const {app} = require('../server');

const should = chai.should();
chai.use(chaiHttp);

// FOR INITIAL CI SETUP
describe('API', function() {
  it('should have status 200 on GET requests', function() {
    
  });
});
