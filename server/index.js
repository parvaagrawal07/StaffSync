require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (_, res) => res.send('StaffSync API running'));
app.use('/api', require('./routes'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log(`API on http://localhost:${process.env.PORT || 5000}`));
  })
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
