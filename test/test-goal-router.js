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
    tasks: [
      {
        name: faker.lorem.word(),
        completed: false,
        date: faker.date.future()
      },
      {
        name: faker.lorem.word(),
        completed: false,
        date: faker.date.future()
      }
    ]
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
              res.body.should.have.lengthOf(count);
            });
        }).catch(err => {
          throw new Error(err);
        });
    });
  });// end of goals GET request test

  describe('Goal POST request', function() {
    it('should create a new goal', function() {
      const newGoal = createGoalData();
      return chai.request(app)
        .post('/goals')
        .auth(testUser.username, testUser.password)
        .send(newGoal)
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('user', 'title', 'color', 'tasks');
          res.body.title.should.equal(newGoal.title);
          res.body.user.should.equal(newGoal.user);
          res.body.color.should.equal(newGoal.color);
          return Goal
            .findById(res.body._id)
            .exec();
        })
        .then(goal => {
          goal.user.should.equal(newGoal.user);
          goal.title.should.equal(newGoal.title);
          goal.color.should.equal(newGoal.color);
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  }); // end of goals POST request test

  describe('Goal PUT request', function() {
    it('should update existing goal', function() {
      const updateData = {
        title: 'Updated Title',
        color: '#000'
      }
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          updateData.id = goal._id;
          return chai.request(app)
            .put(`/goals/${goal._id}`)
            .auth(testUser.username, testUser.password)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('user', 'title', 'color', 'tasks');
          res.body.title.should.equal(updateData.title);
          res.body.color.should.equal(updateData.color);
        }).catch(err => {
          throw new Error(err);
        });
    });
  }); // end of goals PUT request test

  describe('Goal DELETE request', function() {
    it('should delete a goal', function() {
      let deletedGoal;
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          deletedGoal = goal;
          return chai.request(app)
            .delete(`/goals/${deletedGoal._id}`)
            .auth(testUser.username, testUser.password);
        })
        .then(res => {
          res.should.have.status(204);
          return Goal
            .findById(deletedGoal._id)
            .exec();
        })
        .then(goal => {
          should.not.exist(goal);
        }).catch(err => {
          throw new Error(err);
        });
    });
  }); // end of goals DELETE request test

  describe('Tasks GET request', function() {
    it('should get all tasks for goal', function() {
      let goalId;
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          goalId = goal._id;
          return chai.request(app)
            .get(`/goals/${goalId}/tasks`)
            .auth(testUser.username, testUser.password);
        })
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.forEach(task => {
            task.should.be.a('object');
            task.should.include.keys('name', 'completed', 'date');
          });
        }).catch(err => {
          throw new Error(err);
        });
    });
  }); // end of tasks GET request test

  describe('Tasks POST request', function() {
    it('should create a new task for a goal', function() {
      const newTask = {
        name: 'the new task',
        date: '2017-06-27'
      }
      let goalId;
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          goalId = goal._id;
          return chai.request(app)
            .post(`/goals/${goalId}/tasks`)
            .auth(testUser.username, testUser.password)
            .send(newTask);
        })
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.tasks.should.be.a('array');
          res.body.tasks.should.not.be.empty;

          const lastAdded = res.body.tasks[res.body.tasks.length - 1];
          lastAdded.should.be.a('object');
          lastAdded.should.include.keys('date', 'name', 'completed');
          lastAdded.date.should.equal(newTask.date);
          lastAdded.name.should.equal(newTask.name);
          lastAdded.completed.should.be.false;
        }).catch(err => {
          throw new Error(err);
        });
    });
  }); // end of tasks POST request test

  describe('Tasks UPDATE request', function() {
    it('should update a task in a goal', function() {
      const updateData = {
        completed: true
      }
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          updateData.goalId = goal._id;
          updateData.taskId = goal.tasks[0]._id;
          return chai.request(app)
            .put(`/goals/${updateData.goalId}/tasks/${updateData.taskId}`)
            .auth(testUser.username, testUser.password)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.should.be.a('object');

          const updatedTask = res.body.tasks[0];
          updatedTask.completed.should.equal(updateData.completed);
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  }); // end of tasks PUT request test

  describe('Tasks DELETE request', function() {
    it('should get delete a task in a goal', function() {
      let deletedTask;
      let goalId;
      let origLength;
      return Goal
        .findOne()
        .exec()
        .then(goal => {
          deletedTask = goal.tasks[0];
          origLength = goal.tasks.length;
          goalId = goal._id;
          return chai.request(app)
            .delete(`/goals/${goalId}/tasks/${deletedTask._id}`)
            .auth(testUser.username, testUser.password);
        })
        .then(res => {
          res.should.have.status(201);
          res.body.tasks.length.should.equal(origLength - 1);
          return Goal
            .findById(goalId)
            .exec();
        })
        .then(goal => {
          for (const task of goal.tasks) {
            task._id.should.not.equal(deletedTask._id);
          }
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  }); // end of tasks DELETE request test

}); //end of main describe block
