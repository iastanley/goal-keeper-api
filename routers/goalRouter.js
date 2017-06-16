'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const router = express.Router();
mongoose.Promise = global.Promise;

const { Goal } = require('../models/models');
router.use(bodyParser.json());

router.get('/', (req, res) => {
  res.status(200).send("Goal root route");
});

module.exports = router;
