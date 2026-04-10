const mongoose = require('mongoose');

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;

  console.log('读取到的 URI 是:', mongoUri);

  if (!mongoUri) {
    console.error('❌ 错误:MONGO_URI 未定义！请检查 .env 文件。');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ 成功连接到 MongoDB 数据库！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
}

module.exports = { connectToDatabase };
