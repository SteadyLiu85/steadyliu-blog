import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
// 加入 Quote 图标用于简介栏
import { Type, BookOpen, Hash, FileText, Save, XCircle, ChevronLeft, AlertCircle, ImagePlus, Loader2, Send, CalendarClock, Quote } from 'lucide-react'

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
  
  // [新增] summary 初始状态
  const [post, setPost] = useState({ 
    title: '', summary: '', content: '', series: '', tags: '', createdAt: formatDateTime(new Date()) 
  })

  useEffect(() => {
    if (id) {
      axios.get(`/api/posts/${id}`).then(res => {
        const data = res.data
        setPost({
          title: data.title, 
          summary: data.summary || '', //[新增] 读取已有的简介
          content: data.content, 
          series: data.series || '',
          tags: data.tags ? data.tags.join(', ') : '', 
          createdAt: formatDateTime(data.createdAt)
        })
      })
    }
  }, [id])

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("文件过大 (限 5MB)");
    const formData = new FormData(); formData.append('image', file);
    setIsUploading(true);
    try {
      const res = await axios.post('/api/upload', formData);
      setPost(p => ({ ...p, content: p.content + `\n![img](${res.data.url})\n` }));
    } catch (err) { alert('上传失败'); } 
    finally { setIsUploading(false); }
  };

  const handleImageUpload = (e) => uploadFile(e.target.files[0]);
  const handlePaste = (e) => {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.indexOf('image') !== -1) uploadFile(e.clipboardData.items[i].getAsFile());
    }
  };
  const handleDrop = (e) => { e.preventDefault(); uploadFile(e.dataTransfer.files[0]); };

  const handleSubmit = async (e, postStatus) => {
    e.preventDefault()
    const postData = { ...post, tags: post.tags.split(',').map(t => t.trim()).filter(t => t !== ''), status: postStatus }
    try {
      if (id) await axios.put(`/api/posts/${id}`, postData)
      else await axios.post('/api/posts', postData)
      navigate('/')
    } catch (err) { alert('保存失败') }
  }

  return (
    <div className="text-left mb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 bg-theme-surface border-2 border-theme-border px-4 py-2 rounded-xl text-theme-text-primary font-black text-sm shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all mb-8 uppercase"
      >
        <ChevronLeft size={16} strokeWidth={3} /> Cancel
      </button>

      <div className="bg-theme-surface border-4 border-theme-border p-8 md:p-12 rounded-3xl shadow-brutal-lg">
        <header className="mb-10 border-b-4 border-theme-border pb-8">
          <h1 className="text-4xl font-black text-theme-text-primary flex items-center gap-4 uppercase">
            <div className="p-3 bg-theme-accent text-white border-2 border-theme-border rounded-xl shadow-brutal-sm">
              <FileText size={28} strokeWidth={3} />
            </div>
            {id ? 'EDIT ENTRY' : 'NEW ENTRY'}
          </h1>
        </header>

        <form className="space-y-10">
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
              <Type size={16} strokeWidth={3}/> TITLE
            </label>
            <input 
              type="text" value={post.title} onChange={(e) => setPost({...post, title: e.target.value})}
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-6 py-4 text-2xl font-black text-theme-text-primary focus:outline-none focus:shadow-brutal focus:-translate-y-1 focus:-translate-x-1 transition-all placeholder:text-theme-text-secondary/50"
              placeholder="ENTER TITLE" required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <BookOpen size={16} strokeWidth={3}/> SERIES
              </label>
              <input 
                type="text" value={post.series} onChange={(e) => setPost({...post, series: e.target.value})}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all placeholder:text-theme-text-secondary/50"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <Hash size={16} strokeWidth={3}/> TAGS
              </label>
              <input 
                type="text" value={post.tags} onChange={(e) => setPost({...post, tags: e.target.value})}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all placeholder:text-theme-text-secondary/50"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <CalendarClock size={16} strokeWidth={3}/> DATE
              </label>
              <input 
                type="datetime-local" value={post.createdAt} onChange={(e) => setPost({...post, createdAt: e.target.value})}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-black font-mono text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all"
              />
            </div>
          </div>

          {/* 简介框 */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
              <Quote size={16} strokeWidth={3}/> SUMMARY / 简介
            </label>
            <textarea
              value={post.summary} onChange={(e) => setPost({...post, summary: e.target.value})}
              rows="2"
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl p-4 text-theme-text-primary font-bold text-lg leading-relaxed focus:outline-none focus:shadow-brutal transition-all resize-none placeholder:text-theme-text-secondary/50"
              placeholder="一两句话概括本文核心内容（可选，不填将自动截取正文）..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-2">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <FileText size={16} strokeWidth={3}/> CONTENT (MD)
              </label>
              <div className="flex items-center gap-4">
                <label className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-theme-border font-black text-sm uppercase cursor-pointer shadow-brutal-sm hover:shadow-brutal transition-all
                  ${isUploading ? 'bg-theme-hover text-theme-text-secondary' : 'bg-theme-accent text-white'}
                `}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} strokeWidth={3}/>}
                  {isUploading ? 'UPLOADING...' : 'INSERT IMAGE'}
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isUploading}/>
                </label>
                <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-widest text-theme-text-secondary">
                  <AlertCircle size={12} strokeWidth={3}/> DND / PASTE
                </div>
              </div>
            </div>

            <textarea
              onPaste={handlePaste} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              value={post.content} onChange={(e) => setPost({...post, content: e.target.value})}
              rows="20" required
              className="w-full bg-theme-base border-4 border-theme-border rounded-2xl p-6 text-theme-text-primary font-mono text-lg leading-relaxed focus:outline-none focus:shadow-brutal transition-all resize-y"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t-4 border-theme-border">
            <button type="button" onClick={() => navigate(-1)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-4 border-theme-border bg-theme-surface font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all text-theme-text-primary">
              <XCircle size={20} strokeWidth={3}/> DISCARD
            </button>
            <div className="flex w-full md:w-auto items-center gap-4">
              <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={isUploading || !post.title || !post.content} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-theme-base border-4 border-theme-border text-theme-text-primary px-8 py-4 rounded-xl font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all disabled:opacity-50">
                <Save size={20} strokeWidth={3}/> DRAFT
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'published')} disabled={isUploading || !post.title || !post.content} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-theme-accent border-4 border-theme-border text-white px-10 py-4 rounded-xl font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all disabled:opacity-50">
                <Send size={20} strokeWidth={3}/> {id ? 'UPDATE' : 'PUBLISH'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost