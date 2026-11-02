const { Schema, model } = require('mongoose');
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });

exports.User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['hr', 'manager', 'employee'], default: 'employee' },
  department: String,
  position: String,
  manager: ref('User'),
}, { timestamps: true }));

exports.Leave = model('Leave', new Schema({
  user: ref('User'), type: String, from: Date, to: Date, reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true }));

exports.Attendance = model('Attendance', new Schema({
  user: ref('User'), date: String, checkIn: Date, checkOut: Date,
}, { timestamps: true }));

exports.Announcement = model('Announcement', new Schema({
  title: String, body: String, author: ref('User'),
}, { timestamps: true }));

exports.Training = model('Training', new Schema({
  title: String, description: String, date: Date, createdBy: ref('User'),
  attendees: [ref('User')],
}, { timestamps: true }));
