const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    content: { type: String, required: true },
    series: { type: String, default: '未分类' },
    tags: [String],
    status: { 
        type: String, 
        enum: ['published', 'draft'], 
        default: 'published' 
    },
    createdAt: { 
        type: Date, 
        immutable: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);