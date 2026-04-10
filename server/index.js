require('dotenv').config();
const { createApp } = require('./app');
const { connectToDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectToDatabase();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行...`);
  });
}

startServer();
