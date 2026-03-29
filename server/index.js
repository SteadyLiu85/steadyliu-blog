require('dotenv').config();
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
app.use(cors());
app.use(express.json());

// --- 数据库连接 ---
console.log("读取到的 URI 是:", process.env.MONGO_URI);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ 错误:MONGO_URI 未定义！请检查 .env 文件。");
} else {
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

const checkIsAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return true;
        } catch (err) { 
            return false; 
        }
    }
    return false;
};
// =========================================

// === 身份认证路由 ===
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

// 1. 获取所有文章的接口 (补回，用于首页和Dashboard)
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

// 2. 筛选接口：根据标签或合集查文章 (必须在 /:id 之前)
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

// 3. 获取单篇文章详情的接口 (回档：仅通过 _id 获取)
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

        const goals = {
            "CS:APP": 12,
            "Blog功能开发": 3,
            "视觉SLAM十四讲": 8,          
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

// 创建文章的接口 (接收 summary)
app.post('/api/posts', verifyToken, async (req, res) => {
    try {
        const { title, summary, content, tags, series, status, createdAt } = req.body;
        
        const newPost = new Post({ title, summary, content, tags, series, status });
        if (createdAt) {
            newPost.createdAt = new Date(createdAt);
        }

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新文章的接口 (接收 summary)
app.put('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const { title, summary, content, series, tags, status, createdAt } = req.body; 
        
        const updateData = { 
            title, summary, content, series, tags, status, updatedAt: new Date()
        };
        if (createdAt) {
            updateData.createdAt = new Date(createdAt);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, updateData, { returnDocument: 'after', timestamps: false } 
        );
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
            res.json({ message: "文章已成功删除" });
        } else {
            res.status(404).json({ message: "找不到该文章" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 图片上传
const fs = require('fs');

// 1. 自动检查并创建 uploads 文件夹，防止刚部署时因为没文件夹而崩溃
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. 配置 Multer 存储规则
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // 使用时间戳 + 随机数 + 原扩展名，解决中文文件名上传后乱码断链的问题
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// 3. 开放静态文件访问目录
app.use('/uploads', express.static(uploadDir));

// 4. 接收上传并返回相对路径
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: '上传失败' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  
  res.json({ url: imageUrl });
});

// --- 启动服务器 ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行...`);
});