require('dotenv').config(); // 加载 .env 里的环境变量
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Post = require('./models/Post');
const multer = require('multer');
const path = require('path');

// === JWT鉴权相关依赖 ===
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
// =================================

const app = express();

// --- 中间件配置 ---
app.use(cors()); // 允许跨域
app.use(express.json()); // 允许解析 JSON 格式的请求体

// --- 数据库连接 ---
console.log("读取到的 URI 是:", process.env.MONGO_URI);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ 错误:MONGO_URI 未定义！请检查 .env 文件。");
} else {
    // 连接配置，防止网络抖动导致的连接挂起
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ 成功连接到 MongoDB 数据库！"))
        .catch((err) => console.error("❌ 数据库连接失败:", err));
}

// === JWT 鉴权拦截  ===
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

// 软检查，没牌子不踢，只用来区分身份
const checkIsAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return true; // 令牌有效
        } catch (err) { 
            return false; 
        }
    }
    return false; // 无令牌
};
// =========================================

// === 身份认证路由 ===

// 初始化账号 (仅第一次使用，创建完后注释)
// app.post('/api/auth/setup', async (req, res) => {
//     try {
//         const existingUser = await User.findOne({ username: 'steady' });
//         if (existingUser) return res.status(400).json({ message: '管理员账号已存在' });

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash('050622', salt);

//         const admin = new User({ username: 'steady', password: hashedPassword });
//         await admin.save();
        
//         res.status(201).json({ message: '管理员账号 steady 初始化成功' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// 登录接口 (验证密码并签发 Token)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '密码错误' });
        }

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

// 基础测试接口
app.get('/', (req, res) => {
    res.json({ message: "后端正常运行，且已连接数据库！" });
});

// 获取所有文章的接口 
app.get('/api/posts', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const query = isAdmin ? {} : { status: 'published' };

        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [已优化] 获取单篇文章详情的接口 (支持通过 _id 或 标题 获取)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const identifier = req.params.id;
        let post;
        
        // 1. 先尝试用 MongoDB ObjectId 去找 (兼容 ID 链接)
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            post = await Post.findById(identifier);
        }
        
        // 2. 如果找不到，或者传进来的是标题，就用标题去找
        if (!post) {
            post = await Post.findOne({ title: identifier });
        }

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
    
    const isAdmin = checkIsAdmin(req);
    let query = isAdmin ? {} : { status: 'published' };
    
    if (tag) query.tags = tag; 
    if (series) query.series = series;
    
    try {
        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 获取所有合集的列表
app.get('/api/series', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const query = isAdmin ? {} : { status: 'published' };
        
        const series = await Post.distinct('series', query);
        res.json(series);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 获取合集统计数据
app.get('/api/series/stats', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const matchStage = isAdmin ? {} : { status: 'published' };

        const stats = await Post.aggregate([
            { $match: matchStage },
            { $group: { 
                _id: "$series", 
                count: { $sum: 1 },
                lastUpdate: { $max: "$createdAt" }
            } }
        ]);

        // 配置合集长度：
        const goals = {
            "CS:APP": 12,
            "Blog功能开发": 3,
            "视觉SLAM十四讲": 8,          // 长期更新设0
            "MERN Stack": 5,
            "嵌入式开发纪实": 0,
            "前端随想": 0,
            "工具和库": 0,
            "具身智能杂录": 0
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
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 获取所有标签的列表
app.get('/api/tags', async (req, res) => {
    try {
        const isAdmin = checkIsAdmin(req);
        const matchStage = isAdmin ? {} : { status: 'published' };

        const tagCounts = await Post.aggregate([
            { $match: matchStage },
            { $unwind: "$tags" }, 
            { $group: { _id: "$tags", count: { $sum: 1 } } }, 
            { $sort: { count: -1 } } 
        ]);
        res.json(tagCounts); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// [已优化] 创建文章的接口 (接收 summary)
app.post('/api/posts', verifyToken, async (req, res) => {
    try {
        const { title, summary, content, tags, series, status, createdAt } = req.body;
        
        // 包含 summary 字段
        const newPost = new Post({ title, summary, content, tags, series, status });
        
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

//[已优化] 更新文章的接口 (接收 summary)
app.put('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const { title, summary, content, series, tags, status, createdAt } = req.body; 
        
        // 包含 summary 字段
        const updateData = { 
            title, 
            summary,
            content, 
            series, 
            tags, 
            status,
            updatedAt: new Date()
        };
        
        // 前端传了时间，就覆盖进去
        if (createdAt) {
            updateData.createdAt = new Date(createdAt);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { returnDocument: 'after', timestamps: false } 
        );
        
        console.log("🔄 文章已更新:", updatedPost.title, "最终落库日期:", updatedPost.createdAt);
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除文章
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
  if (!req.file) {
      return res.status(400).json({ message: '上传失败' });
  }
  
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// --- 启动服务器 ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行...`);
    console.log(`本地 API 访问地址: http://localhost:${PORT}/api/posts`);
});