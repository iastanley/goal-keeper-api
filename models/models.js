'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

// MODEL FOR GOALS
// not sure how to represent tasks right now
const goalSchema = mongoose.Schema({
  user: String,
  title: String,
  color: String,
  tasks: [{
    name: String,
    completed: Boolean,
    date: Date
  }]
});




const Goal = mongoose.model('Goal', goalSchema);

// MODEL FOR USERS
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', userSchema);

module.exports = {Goal, User};
