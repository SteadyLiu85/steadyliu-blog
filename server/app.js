const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { uploadDir } = require('./config/upload');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ message: '后端正常运行，且已连接数据库！' });
  });

  app.use('/api', authRoutes);
  app.use('/api', postRoutes);
  app.use('/api/uploads', express.static(uploadDir));
  app.use('/api', uploadRoutes);

  return app;
}

module.exports = { createApp };
