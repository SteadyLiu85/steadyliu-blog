const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    series: { type: String, default: '未分类' }, 
    tags: [{ type: String }], 
    author: { type: String, default: 'Steady Liu' }
}, { 
    // 自动管理 createdAt 和 updatedAt
    timestamps: true 
});

module.exports = mongoose.model('Post', postSchema);