'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const { User } = require('../models/models.js');
const { app, runServer, closeServer } = require('../server.js');
const { TEST_DATABASE_URL } = require('../config.js');

const should = chai.should();
chai.use(chaiHttp);

const testUser = {
  username: 'testUser',
  password: '123'
}

// seed the user base with a test user
function seedTestUserData() {
  console.log('Seeding Database');
  return User.hashPassword(testUser.password)
    .then(hash => {
      return User
        .create({
          username: testUser.username,
          password: hash
        });
    })
    .catch(err => {
      throw new Error(err);
    });
}

// function to tear down database after test
function tearDownDb() {
  console.log('Tearing Down Database');
  return mongoose.connection.dropDatabase();
}

describe('User Router API', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return seedTestUserData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('Signup request at /users', function() {
    it('should create a new user', function() {
      const newUser = {
        username: 'new user',
        password: 'newPassword'
      }
      return chai.request(app)
        .post('/users')
        .send(newUser)
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.username.should.equal(newUser.username);
          return User
            .find({username: newUser.username})
            .count()
            .exec();
        })
        .then(count => {
          count.should.equal(1);
        })
        .catch(err => {
          throw new Error(err);
        });
    });

    it('should not accept a duplicate username', function() {
      const newUser = {
        username: testUser.username,
        password: 'newPassword'
      }
      return chai.request(app)
        .post('/users')
        .send(newUser)
        .then(res => {
          should.not.exist(res.body);
        })
        .catch(err => {
          err.response.should.have.status(422);
          err.response.body.message.should.equal('Username already taken');
        });
    });
  }); // end of Signup tests

  describe('Login request at /users', function() {
    it('should return user when login is successful', function() {
      return chai.request(app)
        .get('/users')
        .auth(testUser.username, testUser.password)
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.username.should.equal(testUser.username);
        })
        .catch(err => {
          throw new Error(err);
        });
    });

    it('should fail if password is not correct', function() {
      return chai.request(app)
        .get('/users')
        .auth(testUser.username, 'wrongPassword')
        .then(res => {
          should.not.exist(res.body);
        })
        .catch(err => {
          err.response.should.have.status(401);
        });
    });
  }); // end of Login tests

});
