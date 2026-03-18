require('dotenv').config(); // 加载 .env 里的环境变量
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // 引入 mongoose
const Post = require('./models/Post'); // 引入刚刚定义的模型
const multer = require('multer');
const path = require('path');

// === 新增：引入鉴权相关依赖 ===
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // 引入用户模型
// =================================

const app = express();

// --- 中间件配置 ---
app.use(cors()); // 允许跨域，让前端 5173 能访问后端 5000
app.use(express.json()); // 允许解析 JSON 格式的请求体

// --- 数据库连接逻辑 ---
console.log("读取到的 URI 是:", process.env.MONGO_URI);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ 错误：MONGO_URI 未定义！请检查 .env 文件。");
} else {
    // 增加连接配置，防止网络抖动导致的连接挂起
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ 成功连接到 MongoDB 数据库！"))
        .catch((err) => console.error("❌ 数据库连接失败:", err));
}

// === 新增：JWT 鉴权拦截器 (门神中间件) ===
const verifyToken = (req, res, next) => {
    // 从请求头 Authorization: Bearer <token> 中提取 token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: '访问被拒绝，缺少身份令牌' });
    }

    try {
        // 使用 .env 中的秘钥验证 Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 将用户信息挂载到请求对象上
        next(); // 验证通过，放行
    } catch (err) {
        res.status(403).json({ message: '令牌无效或已过期' });
    }
};
// =========================================

// === 新增：身份认证路由 (初始化 & 登录) ===

// 1. 初始化账号 (仅第一次使用，创建完后可注释)
app.post('/api/auth/setup', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: 'steady' });
        if (existingUser) return res.status(400).json({ message: '管理员账号已存在' });

        // 将 123456 替换为你想要的真实密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('050622', salt);

        const admin = new User({ username: 'steady', password: hashedPassword });
        await admin.save();
        
        res.status(201).json({ message: '管理员账号 steady 初始化成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 登录接口 (验证密码并签发 Token)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: '用户不存在' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '密码错误' });

        // 签发 Token，有效期 7 天
        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        res.json({ token, username: user.username, message: '登录成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// =========================================

// --- API 路由接口 ---

// 1. 基础测试接口
app.get('/', (req, res) => {
    res.json({ message: "后端正常运行，且已连接数据库！" });
});

// 2. 获取所有文章的接口 (无需鉴权，所有人可看)
app.get('/api/posts', async (req, res) => {
    try {
        // .sort({ createdAt: -1 }) 表示按时间倒序排列（最新的在前面）
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取单篇文章详情的接口 (无需鉴权)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ message: "文章未找到" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 筛选接口：根据标签或合集查文章 (无需鉴权)
app.get('/api/posts/filter/data', async (req, res) => {
    const { tag, series } = req.query;
    let query = {};
    if (tag) query.tags = tag; // MongoDB 会自动处理数组包含关系
    if (series) query.series = series;
    
    try {
        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 获取所有合集的列表 (无需鉴权)
app.get('/api/series', async (req, res) => {
    try {
        // distinct 会返回数据库中所有不重复的 series 字段值
        const series = await Post.distinct('series');
        res.json(series);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/series/stats', async (req, res) => {
    try {
        const stats = await Post.aggregate([
            { $group: { 
                _id: "$series", 
                count: { $sum: 1 },
                lastUpdate: { $max: "$createdAt" }
            } }
        ]);

        // 配置中心：
        // 数值 > 0：显示进度条
        // 数值 = 0：标记为“长期更新”，不显示进度条
        const goals = {
            "CS:APP": 12,        // 明确目标
            "Java学习": 20,     // 明确目标
            "随笔": 0,          // 长期更新 (不设上限)
            "项目周报": 0,       // 长期更新
            "功能": 2
        };

        const result = stats
            .filter(s => s._id && s._id !== '未分类')
            .map(s => ({
                name: s._id,
                current: s.count,
                total: goals[s._id] !== undefined ? goals[s._id] : 0, // 默认 0 
                lastUpdate: s.lastUpdate
            }));

        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 获取所有标签的列表 (无需鉴权)
app.get('/api/tags', async (req, res) => {
    try {
        const tagCounts = await Post.aggregate([
            { $unwind: "$tags" }, 
            { $group: { _id: "$tags", count: { $sum: 1 } } }, 
            { $sort: { count: -1 } } 
        ]);
        res.json(tagCounts); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. 创建文章的接口 (🛡️ 已加锁)
app.post('/api/posts', verifyToken, async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const newPost = new Post({ title, content, tags });
        const savedPost = await newPost.save(); // 存入数据库
        console.log("📝 新文章已存入数据库:", savedPost.title);
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 更新文章 (修改) (🛡️ 已加锁)
app.put('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const { title, content, series, tags } = req.body; // 确保这里解构了 series
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            { title, content, series, tags }, 
            { new: true } // 返回修改后的新对象，而不是旧的
        );
        console.log("🔄 文章已更新:", updatedPost.title);
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. 删除文章 (🛡️ 已加锁)
app.delete('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const result = await Post.findByIdAndDelete(req.params.id);
        if (result) {
            console.log("🗑️ 文章已成功删除，ID:", req.params.id);
            res.json({ message: "文章已成功删除" });
        } else {
            res.status(404).json({ message: "找不到该文章" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 上传图片
// 1. 配置存储逻辑
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 图片保存在后端根目录下的 uploads 文件夹
  },
  filename: (req, file, cb) => {
    // 命名规则：时间戳-原文件名（防止重名）
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 2. 静态资源托管（这样前端才能通过 URL 访问到图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. 上传接口 (🛡️ 已加锁，防止别人随便往你的服务器塞图片)
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '上传失败' });
  
  // 返回图片在服务器上的访问地址
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// --- 启动服务器 ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行...`);
    console.log(`本地 API 访问地址: http://localhost:${PORT}/api/posts`);
});