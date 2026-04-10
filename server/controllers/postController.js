const Post = require('../models/Post');
const { SERIES_GOALS } = require('../constants/seriesGoals');
const { isAdminRequest } = require('../middleware/auth');

function buildVisibilityQuery(req, extraQuery = {}) {
  if (isAdminRequest(req)) {
    return { ...extraQuery };
  }

  return { status: 'published', ...extraQuery };
}

async function listPosts(req, res) {
  try {
    const posts = await Post.find(buildVisibilityQuery(req)).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function filterPosts(req, res) {
  const { tag, series } = req.query;
  const filters = {};

  if (tag) {
    filters.tags = tag;
  }

  if (series) {
    filters.series = series;
  }

  try {
    const posts = await Post.find(buildVisibilityQuery(req, filters)).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getPostById(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: '文章未找到' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listSeries(req, res) {
  try {
    const series = await Post.distinct('series', buildVisibilityQuery(req));
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSeriesStats(req, res) {
  try {
    const stats = await Post.aggregate([
      { $match: buildVisibilityQuery(req) },
      {
        $group: {
          _id: '$series',
          count: { $sum: 1 },
          lastUpdate: { $max: '$createdAt' },
        },
      },
    ]);

    const result = stats
      .filter((series) => series._id && series._id !== '未分类')
      .map((series) => ({
        name: series._id,
        current: series.count,
        total: SERIES_GOALS[series._id] ?? 0,
        lastUpdate: series.lastUpdate,
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listTags(req, res) {
  try {
    const tagCounts = await Post.aggregate([
      { $match: buildVisibilityQuery(req) },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(tagCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createPost(req, res) {
  try {
    const { title, summary, content, tags, series, status, createdAt } = req.body;
    const newPost = new Post({ title, summary, content, tags, series, status });

    if (createdAt) {
      newPost.createdAt = new Date(createdAt);
    }

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updatePost(req, res) {
  try {
    const { title, summary, content, series, tags, status, createdAt } = req.body;
    const updateData = {
      title,
      summary,
      content,
      series,
      tags,
      status,
      updatedAt: new Date(),
    };

    if (createdAt) {
      updateData.createdAt = new Date(createdAt);
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      timestamps: false,
    });

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deletePost(req, res) {
  try {
    const result = await Post.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: '找不到该文章' });
    }

    res.json({ message: '文章已成功删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPosts,
  filterPosts,
  getPostById,
  listSeries,
  getSeriesStats,
  listTags,
  createPost,
  updatePost,
  deletePost,
};
