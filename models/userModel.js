//const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Post = require('./../models/postModel');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    isPrivate: {
      type: Boolean,
      required: [
        true,
        'You should decide your post to be public or private for gyms.',
      ],
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'owner'],
      default: 'user',
    },
    height: Number,
    weight: Number,
    experience: Number,
    membership: {
      type: mongoose.Schema.ObjectId,
      ref: 'Gym',
    },
    follows: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Post',
        },
      ],
      default: null,
    },
    followers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//Virtual populate
userSchema.virtual('posts', {
  ref: 'Post',
  foreignField: 'owner',
  localField: '_id',
});
// userSchema.virtual('test').get(function () {
//   return 'testVirtual';
// });

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.populate({ path: 'posts', select: 'name -owner' });
  next();
});

// To hide the password info, pre save hook's this object is pointing to document to be saved.
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
