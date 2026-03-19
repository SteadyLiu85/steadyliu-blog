import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
// --- 引入图标 ---
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
  Loader2,
  Send,
  CalendarClock
} from 'lucide-react'

// 时间格式化 (将 Date 转换为 HTML input 需要的格式)
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 16);
};

function CreatePost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false) 
  
  // 初始：默认带上当前系统时间
  const [post, setPost] = useState({ 
    title: '', 
    content: '', 
    series: '', 
    tags: '',
    createdAt: formatDateTime(new Date()) 
  })

  useEffect(() => {
    if (id) {
      axios.get(`/api/posts/${id}`)
        .then(res => {
          const data = res.data
          setPost({
            title: data.title,
            content: data.content,
            series: data.series || '',
            tags: data.tags ? data.tags.join(', ') : '',
            // 编辑模式：读取数据库原有的时间
            createdAt: formatDateTime(data.createdAt)
          })
        })
    }
  }, [id])

  // --- 图片上传处理 ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 限制文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("文件过大，请上传 5MB 以内的图片");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res = await axios.post('/api/upload', formData, {
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

  // 处理粘贴图片 (Clipboard)
  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        uploadFile(file); 
      }
    }
  };

  // 处理拖拽图片 (Drag & Drop)
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  // 提取通用的上传逻辑 
  const uploadFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res = await axios.post('/api/upload', formData);
      const imageMarkdown = `\n![图片描述](${res.data.url})\n`;
      setPost(prev => ({ ...prev, content: prev.content + imageMarkdown }));
    } catch (err) {
      alert('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 接收 postStatus 参数 (published 或 draft)
  const handleSubmit = async (e, postStatus) => {
    e.preventDefault()
    const postData = {
      ...post,
      tags: post.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      status: postStatus // 告知后端文章的状态
    }

    try {
      if (id) {
        await axios.put(`/api/posts/${id}`, postData)
      } else {
        await axios.post('/api/posts', postData)
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

      {/* 表单主容器背景 */}
      <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-colors duration-500">
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-8 transition-colors">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <FileText size={24} />
            </div>
            {id ? '编辑文章' : '撰写新博文'}
          </h1>
        </header>

        <form className="space-y-8">
          {/* 标题输入 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
              <Type size={14} /> Title / 标题
            </label>
            <input 
              type="text" 
              placeholder="输入标题..." 
              value={post.title}
              onChange={(e) => setPost({...post, title: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/60 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 合集输入 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
                <BookOpen size={14} /> Series / 合集
              </label>
              <input 
                type="text" 
                placeholder="输入合集名..." 
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

            {/* 时间选择 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">
                <CalendarClock size={14} /> Date / 创作时间
              </label>
              <input 
                type="datetime-local" 
                value={post.createdAt}
                onChange={(e) => setPost({...post, createdAt: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800/60 transition-all font-mono"
              />
            </div>
          </div>

          {/* 内容编辑 */}
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

          {/* “存草稿”和“正式发布” */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800 transition-colors">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <XCircle size={18} /> 舍弃
            </button>
            
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'draft')}
                className="flex items-center gap-2 bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || !post.title || !post.content}
              >
                <Save size={18} /> 存为草稿
              </button>

              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'published')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent"
                disabled={isUploading || !post.title || !post.content}
              >
                <Send size={18} /> {id ? '更新发布' : '正式发布'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost