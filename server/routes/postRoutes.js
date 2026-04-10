const express = require('express');
const {
  listPosts,
  filterPosts,
  getPostById,
  listSeries,
  getSeriesStats,
  listTags,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', listPosts);
router.get('/posts/filter/data', filterPosts);
router.get('/posts/:id', getPostById);
router.get('/series', listSeries);
router.get('/series/stats', getSeriesStats);
router.get('/tags', listTags);
router.post('/posts', verifyToken, createPost);
router.put('/posts/:id', verifyToken, updatePost);
router.delete('/posts/:id', verifyToken, deletePost);

module.exports = router;
