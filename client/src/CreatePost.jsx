import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
// --- 1. 引入图标 ---
import { 
  Type, 
  BookOpen, 
  Hash, 
  FileText, 
  Save, 
  XCircle, 
  ChevronLeft,
  AlertCircle,
  ImagePlus,
  Loader2
} from 'lucide-react'

function CreatePost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false) // 图片上传状态
  const [post, setPost] = useState({ 
    title: '', 
    content: '', 
    series: '', 
    tags: '' 
  })

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:5000/api/posts/${id}`)
        .then(res => {
          const data = res.data
          setPost({
            title: data.title,
            content: data.content,
            series: data.series || '',
            tags: data.tags ? data.tags.join(', ') : ''
          })
        })
    }
  }, [id])

  // --- 核心修复：图片上传处理逻辑 ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 限制文件大小 (例如 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("文件过大，请上传 5MB 以内的图片");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = res.data.url;
      // 在当前光标位置或末尾插入 Markdown 图片语法
      const imageMarkdown = `\n![图片描述](${imageUrl})\n`;
      setPost(prev => ({ ...prev, content: prev.content + imageMarkdown }));
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败，请检查后端是否开启并存在 uploads 目录');
    } finally {
      setIsUploading(false);
    }
  };

  // A. 处理粘贴图片 (Clipboard)
  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        uploadFile(file); 
      }
    }
  };

  // B. 处理拖拽图片 (Drag & Drop)
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  // C. 提取通用的上传逻辑 
  const uploadFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      const imageMarkdown = `\n![图片描述](${res.data.url})\n`;
      setPost(prev => ({ ...prev, content: prev.content + imageMarkdown }));
    } catch (err) {
      alert('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    const postData = {
      ...post,
      tags: post.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    }

    try {
      if (id) {
        await axios.put(`http://localhost:5000/api/posts/${id}`, postData)
      } else {
        await axios.post('http://localhost:5000/api/posts', postData)
      }
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('保存失败，请检查后端服务')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8 pb-24 text-left">
      {/* 顶部返回导航 */}
      <button 
        onClick={() => navigate(-1)} 
        className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all mb-8 font-bold text-sm"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        取消并返回
      </button>

      {/* 🟢 适配点：表单主容器背景色 */}
      <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-colors duration-500">
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-8 transition-colors">
          {/* 🟢 适配点：主标题颜色 */}
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <FileText size={24} />
            </div>
            {id ? '编辑文章' : '撰写新博文'}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 标题输入 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
              <Type size={14} /> Title / 标题
            </label>
            {/* 🟢 适配点：输入框的白天/黑夜模式 */}
            <input 
              type="text" 
              placeholder="输入标题..." 
              value={post.title}
              onChange={(e) => setPost({...post, title: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/60 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 合集输入 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
                <BookOpen size={14} /> Series / 合集
              </label>
              <input 
                type="text" 
                placeholder="例如: CSAPP, RoboMaster..." 
                value={post.series}
                onChange={(e) => setPost({...post, series: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/60 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
              />
            </div>

            {/* 标签输入 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
                <Hash size={14} /> Tags / 标签
              </label>
              <input 
                type="text" 
                placeholder="使用英文逗号分隔标签..." 
                value={post.tags}
                onChange={(e) => setPost({...post, tags: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/60 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
              />
            </div>
          </div>

          {/* 内容编辑区 */}
          <div className="space-y-2">
            <div className="flex justify-between items-end mb-2 ml-1">
              <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                <FileText size={14} /> Content / 内容 (Markdown)
              </label>
              
              <div className="flex items-center gap-4">
                <label className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold
                  ${isUploading 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50'}
                `}>
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  {isUploading ? '上传中...' : '插入图片'}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    disabled={isUploading}
                  />
                </label>
                <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600 font-mono italic transition-colors">
                  <AlertCircle size={10} /> 支持拖拽 / 粘贴上传图片
                </div>
              </div>
            </div>

            {/* 🟢 适配点：大型文本域的背景和字体颜色 */}
            <textarea
              onPaste={handlePaste}
              onDrop={handleDrop} 
              onDragOver={(e) => e.preventDefault()}
              placeholder="开始创作..." 
              value={post.content}
              onChange={(e) => setPost({...post, content: e.target.value})}
              rows="15"
              className="w-full bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700 rounded-[2rem] px-8 py-8 text-gray-800 dark:text-gray-300 font-mono leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/40 transition-all resize-y placeholder:text-gray-400 dark:placeholder:text-gray-700
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
              [&::-webkit-scrollbar-thumb]:rounded-full"
              required
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 transition-colors">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <XCircle size={18} /> 舍弃
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              <Save size={18} /> {id ? '更新文章' : '发布博文'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost