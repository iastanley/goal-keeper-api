'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const router = express.Router();
mongoose.Promise = global.Promise;

const { Goal } = require('../models/models');
router.use(bodyParser.json());

// For Testing Only
let defaultUser = "Illy";

// GET all goals
router.get('/', (req, res) => {
  Goal
    .find({user: defaultUser})
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

// PUT request to add task to a route or change name or color
router.put('/:id', (req, res) => {
  //verify that req.params.id and req.body.id match
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Path id: ${req.params.id} and request body id: ${req.body.id} don't match`;
    console.error(message);
    res.status(400).json({message: message});
  }

  // if the update is for adding a task to a goal
  if (req.body.task) {
    Goal
      .findOneAndUpdate({_id: req.params.id}, {$addToSet: {tasks: req.body.task}}, {new: true})
      .exec()
      .then(goal => {
        res.status(201).json(goal);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error at goals PUT request'})
      });
  } else {
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
  }

});

module.exports = router;
