const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Leave, Attendance, Announcement, Training } = require('./models');
const { auth, allow } = require('./auth');

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(400).json({ message: e.message }));
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Auth ----------
router.post('/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const { password: _, ...safe } = user.toObject();
  res.json({ token, user: safe });
}));

router.get('/auth/me', auth, (req, res) => res.json(req.user));

// ---------- Employees (HR manages) ----------
router.get('/users', auth, allow('hr', 'manager'), wrap(async (req, res) => {
  const q = req.user.role === 'manager' ? { manager: req.user._id } : {};
  res.json(await User.find(q).select('-password').populate('manager', 'name'));
}));

router.post('/users', auth, allow('hr'), wrap(async (req, res) => {
  const data = { ...req.body, password: await bcrypt.hash(req.body.password || 'password123', 10) };
  if (!data.manager) delete data.manager;
  const u = await User.create(data);
  res.status(201).json({ ...u.toObject(), password: undefined });
}));

router.put('/users/:id', auth, allow('hr'), wrap(async (req, res) => {
  const data = { ...req.body };
  if (data.password) data.password = await bcrypt.hash(data.password, 10); else delete data.password;
  if (!data.manager) delete data.manager;
  res.json(await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password'));
}));

router.delete('/users/:id', auth, allow('hr'), wrap(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Leaves ----------
router.post('/leaves', auth, wrap(async (req, res) => {
  res.status(201).json(await Leave.create({ ...req.body, user: req.user._id }));
}));

router.get('/leaves/mine', auth, wrap(async (req, res) => {
  res.json(await Leave.find({ user: req.user._id }).sort('-createdAt'));
}));

router.get('/leaves', auth, allow('hr', 'manager'), wrap(async (req, res) => {
  let q = {};
  if (req.user.role === 'manager') {
    const team = await User.find({ manager: req.user._id }).select('_id');
    q = { user: { $in: team.map((t) => t._id) } };
  }
  res.json(await Leave.find(q).populate('user', 'name department').sort('-createdAt'));
}));

router.patch('/leaves/:id', auth, allow('hr', 'manager'), wrap(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');
  res.json(await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true }));
}));

// ---------- Attendance ----------
router.post('/attendance/checkin', auth, wrap(async (req, res) => {
  const existing = await Attendance.findOne({ user: req.user._id, date: today() });
  if (existing) throw new Error('Already checked in today');
  res.status(201).json(await Attendance.create({ user: req.user._id, date: today(), checkIn: new Date() }));
}));

router.post('/attendance/checkout', auth, wrap(async (req, res) => {
  const rec = await Attendance.findOne({ user: req.user._id, date: today() });
  if (!rec) throw new Error('Check in first');
  rec.checkOut = new Date();
  res.json(await rec.save());
}));

router.get('/attendance/mine', auth, wrap(async (req, res) => {
  res.json(await Attendance.find({ user: req.user._id }).sort('-date').limit(30));
}));

router.get('/attendance', auth, allow('hr'), wrap(async (req, res) => {
  res.json(await Attendance.find().populate('user', 'name department').sort('-date').limit(200));
}));

// ---------- Announcements ----------
router.get('/announcements', auth, wrap(async (req, res) => {
  res.json(await Announcement.find().populate('author', 'name').sort('-createdAt'));
}));
router.post('/announcements', auth, allow('hr'), wrap(async (req, res) => {
  res.status(201).json(await Announcement.create({ ...req.body, author: req.user._id }));
}));
router.delete('/announcements/:id', auth, allow('hr'), wrap(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- Training ----------
router.get('/training', auth, wrap(async (req, res) => {
  res.json(await Training.find().populate('createdBy', 'name').sort('date'));
}));
router.post('/training', auth, allow('hr', 'manager'), wrap(async (req, res) => {
  res.status(201).json(await Training.create({ ...req.body, createdBy: req.user._id }));
}));
router.post('/training/:id/enroll', auth, wrap(async (req, res) => {
  res.json(await Training.findByIdAndUpdate(req.params.id, { $addToSet: { attendees: req.user._id } }, { new: true }));
}));
router.delete('/training/:id', auth, allow('hr', 'manager'), wrap(async (req, res) => {
  await Training.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;
