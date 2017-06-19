'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const router = express.Router();
mongoose.Promise = global.Promise;

const { Goal } = require('../models/models');
router.use(bodyParser.json());

// GET all goals
router.get('/', (req, res) => {
  let filter;
  if (req.query.user) {
    filter = {user: req.query.user};
  } else {
    filter = {};
  }

  Goal
    .find(filter)
    .exec()
    .then(goals => {
      res.status(200).json(goals);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error after goals GET route'});
    })
});

// POST new goal to server and respond with new goal
router.post('/', (req, res) => {
  const requiredFields = ['title', 'color'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing '${field}' in request body`;
      console.error(message);
      return res.status(400).json({message: message});
    }
  });

  let newData = {
    user: req.body.user || defaultUser,
    title: req.body.title,
    color: req.body.color,
    tasks: []
  }

  Goal
    .create(newData)
    .then(goal => {
      res.status(201).json(goal);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({message: 'Internal server error after goals POST route'});
    });
});

// PUT request to update title or color of goal
router.put('/:id', (req, res) => {
  //verify that req.params.id and req.body.id match
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Path id: ${req.params.id} and request body id: ${req.body.id} don't match`;
    console.error(message);
    res.status(400).json({message: message});
  }

  // code for handling updates to goal title and goal color
  const updatesToGoal = {};
  const updateFields = ['title', 'color'];
  updateFields.forEach(field => {
    if (field in req.body) {
      updatesToGoal[field] = req.body[field];
    }
  });
  Goal
    .findOneAndUpdate({_id: req.params.id}, {$set: updatesToGoal}, {new: true})
    .exec()
    .then(goal => {
      res.status(201).json(goal);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error at goals PUT request'});
    });
});

//delete route for a goal
router.delete('/:id', (req, res) => {
  Goal
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error at DELETE goals route'});
    });
});

//retrieve all tasks for a specific goal
router.get('/:goalId/tasks', (req, res) => {
  Goal
    .findById(req.params.goalId)
    .exec()
    .then(goal => {
      res.status(200).json(goal.tasks);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

// adding a new task function should be pulled into a different route
router.post('/:goalId/tasks', (req, res) => {
  const requiredFields = ['name', 'date'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing '${field}' in request body`;
      console.error(message);
      return res.status(400).json({message: message});
    }
  });

  let newTask = {
    name: req.body.name,
    date: req.body.date,
    completed: false
  }

  Goal
    .findOneAndUpdate({_id: req.params.goalId}, {$addToSet: {tasks: newTask} }, {new: true})
    .exec()
    .then(goal => {
      res.status(201).json(goal);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error at tasks POST request'});
    });
});

//update a task
router.put('/:goalId/tasks/:taskId', (req, res) => {
  if (!req.body.goalId || !req.body.taskId) {
    res.status(400).json({message: 'Request does not have goalId and taskId'});
  }

  const updatesToTask = {}
  const updateFields = ['name', 'completed', 'date'];
  updateFields.forEach(field => {
    if (field in req.body) {
      updatesToTask[`tasks.$.${field}`] = req.body[field];
    }
  });

  Goal
    .findOneAndUpdate({_id: req.params.goalId, 'tasks._id': req.params.taskId}, {$set: updatesToTask}, {new: true})
    .exec()
    .then(goal => {
      res.status(201).json(goal);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});



//delete a task
router.delete('/:goalId/tasks/:taskId', (req, res) => {
  Goal
    .findOneAndUpdate(
      {_id: req.params.goalId},
      {$pull: {tasks: {_id: req.params.taskId} } }, {new: true})
    .exec()
    .then(goal => {
      res.status(201).json(goal)
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error at DELETE tasks route'});
    });
});

module.exports = router;
