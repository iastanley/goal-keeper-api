'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const {Goal, User} = require('../models/models.js');
const {app, runServer, closeServer} = require('../server.js');
const {TEST_DATABASE_URL} = require('../config.js');

const should = chai.should();
chai.use(chaiHttp);

//test user for Authentication
const testUser = {
  username: 'testUser',
  password: '123'
}

// seed goal data
function seedTestGoalData() {
  console.log('Seeding Database');
  const seedData = [];
  for (let i = 0; i < 10; i++) {
    seedData.push(createGoalData());
  }
  return Goal.insertMany(seedData);
}

//add testUser to database for authentication
function seedTestUser(callback) {
  console.log('Seeding test user');
  return User.hashPassword(testUser.password)
          .then(hash => {
            return User
              .create({
                username: testUser.username,
                password: hash
              })
          })
          .then(user => {
            return callback();
          })
          .catch(err => {
            console.error(err);
          });
}

// function to create a single goal
function createGoalData() {
  return {
    user: testUser.username,
    title: faker.lorem.word(),
    color: faker.internet.color(),
    tasks: [{
        name: faker.lorem.word(),
        completed: faker.random.boolean(),
        date: faker.date.future()
      }]
  }
}

// function to tear down database after test
function tearDownDb() {
  console.log('Tearing Down Database');
  return mongoose.connection.dropDatabase();
}

describe('Goal Router API', function(){
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    // return seedTestGoalData();
    return seedTestUser(seedTestGoalData);
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })

  describe('Goal GET request', function() {
    it('should return all goals', function(){
      return chai.request(app)
        .get('/goals')
        .auth(testUser.username, testUser.password)
        .then(res => {
          res.should.have.status(200);
          Goal.count()
            .then(count => {
              res.body.should.have.length.of(count);
            });
        });
    });
  });// end of Goal GET request test
}); //end of main describe block
