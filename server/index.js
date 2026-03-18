require('dotenv').config(); // 加载 .env 里的环境变量
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // 引入 mongoose
const Post = require('./models/Post'); // 引入刚刚定义的模型
const multer = require('multer');
const path = require('path');

// === 引入鉴权相关依赖 ===
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

// === JWT 鉴权拦截器 (门神中间件：强拦截，没牌子直接踢) ===
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: '访问被拒绝，缺少身份令牌' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (err) {
        res.status(403).json({ message: '令牌无效或已过期' });
    }
};

// 🟢 新增：辅助函数（软检查，没牌子不踢，只用来区分身份）
const checkIsAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return true; // 令牌有效，是管理员
        } catch (err) { return false; }
    }
    return false; // 没令牌，是游客
};
// =========================================

// === 身份认证路由 (初始化 & 登录) ===

// 1. 初始化账号 (仅第一次使用，创建完后可注释)
app.post('/api/auth/setup', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: 'steady' });
        if (existingUser) return res.status(400).json({ message: '管理员账号已存在' });

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

// 2. 获取所有文章的接口 
app.get('/api/posts', async (req, res) => {
    try {
        // 🟢 如果是管理员，查全部；如果是游客，只查 published
        const isAdmin = checkIsAdmin(req);
        const query = isAdmin ? {} : { status: 'published' };

        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取单篇文章详情的接口 (无需鉴权，因为能拿到 ID 一般都是允许看的)
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

// 筛选接口：根据标签或合集查文章
app.get('/api/posts/filter/data', async (req, res) => {
    const { tag, series } = req.query;
    
    // 🟢 同样加入草稿过滤逻辑
    const isAdmin = checkIsAdmin(req);
    let query = isAdmin ? {} : { status: 'published' };
    
    if (tag) query.tags = tag; 
    if (series) query.series = series;
    
    try {
        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 获取所有合集的列表
app.get('/api/series', async (req, res) => {
    try {
        // 🟢 游客仅能看到已发布文章所在的合集
        const isAdmin = checkIsAdmin(req);
        const query = isAdmin ? {} : { status: 'published' };
        
        const series = await Post.distinct('series', query);
        res.json(series);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/series/stats', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const matchStage = isAdmin ? {} : { status: 'published' };

        const stats = await Post.aggregate([
            { $match: matchStage }, // 🟢 草稿不计入游客的数据统计中
            { $group: { 
                _id: "$series", 
                count: { $sum: 1 },
                lastUpdate: { $max: "$createdAt" }
            } }
        ]);

        // 配置中心：
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
                total: goals[s._id] !== undefined ? goals[s._id] : 0, 
                lastUpdate: s.lastUpdate
            }));

        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 获取所有标签的列表
app.get('/api/tags', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const matchStage = isAdmin ? {} : { status: 'published' };

        const tagCounts = await Post.aggregate([
            { $match: matchStage }, // 🟢 过滤草稿标签
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
        const { title, content, tags, series, status, createdAt } = req.body;
        
        // 1. 先创建对象
        const newPost = new Post({ title, content, tags, series, status });
        
        // 2. 🟢 强行覆盖时间：必须在 save 之前显式赋值，才能盖过 Mongoose 的自动生成
        if (createdAt) {
            newPost.createdAt = new Date(createdAt);
        }

        const savedPost = await newPost.save(); // 存入数据库
        console.log("📝 新文章已存入:", savedPost.title, "日期:", savedPost.createdAt);
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 更新文章 (修改) (🛡️ 已加锁)
app.put('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const { title, content, series, tags, status, createdAt } = req.body; 
        
        const updateData = { 
            title, 
            content, 
            series, 
            tags, 
            status,
            updatedAt: new Date() // 手动更新最后修改时间
        };
        
        // 前端传了时间，就覆盖进去
        if (createdAt) {
            updateData.createdAt = new Date(createdAt);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            // 🟢 修复警告：使用 returnDocument: 'after' 替代 new: true
            { returnDocument: 'after', timestamps: false } 
        );
        
        console.log("🔄 文章已更新:", updatedPost.title, "最终落库日期:", updatedPost.createdAt);
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '上传失败' });
  
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// --- 启动服务器 ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行...`);
    console.log(`本地 API 访问地址: http://localhost:${PORT}/api/posts`);
});