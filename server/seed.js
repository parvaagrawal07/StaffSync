require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Announcement } = require('./models');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  const pw = await bcrypt.hash('password123', 10);
  const hr = await User.create({ name: 'Hannah HR', email: 'hr@staffsync.com', password: pw, role: 'hr', department: 'HR', position: 'HR Lead' });
  const mgr = await User.create({ name: 'Mike Manager', email: 'manager@staffsync.com', password: pw, role: 'manager', department: 'Engineering', position: 'Engineering Manager' });
  await User.create({ name: 'Emma Employee', email: 'employee@staffsync.com', password: pw, role: 'employee', department: 'Engineering', position: 'Developer', manager: mgr._id });
  await Announcement.create({ title: 'Welcome to StaffSync', body: 'Mark your attendance daily and apply for leaves here.', author: hr._id });
  console.log('Seeded. Login with hr@/manager@/employee@staffsync.com, password: password123');
  process.exit(0);
})();
