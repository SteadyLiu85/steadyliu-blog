import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Type, BookOpen, Hash, FileText, Save, XCircle, ChevronLeft, AlertCircle, ImagePlus, Loader2, Send, CalendarClock, Quote } from 'lucide-react'

const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d - offset).toISOString().slice(0, 16)
}

const createEmptyPost = () => ({
  title: '',
  summary: '',
  content: '',
  series: '',
  tags: '',
  createdAt: formatDateTime(new Date())
})

const markdownSnippets = [
  { label: 'H2', value: '\n## New Section\n' },
  { label: 'H3', value: '\n### Sub Section\n' },
  { label: 'Code', value: '\n```cpp\n\n```\n' },
  { label: 'Quote', value: '\n> Key takeaway\n' },
  { label: 'List', value: '\n- Point 1\n- Point 2\n' },
  { label: 'Table', value: '\n| Name | Note |\n| --- | --- |\n| Item | Detail |\n' }
]

function CreatePost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [draftRecovered, setDraftRecovered] = useState(false)
  const [post, setPost] = useState(createEmptyPost())

  const draftStorageKey = id ? `steady:draft:edit:${id}` : 'steady:draft:new'
  const wordCount = post.content.trim() ? post.content.trim().split(/\s+/).length : 0
  const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 220))

  useEffect(() => {
    if (id) {
      return
    }

    const savedDraft = localStorage.getItem(draftStorageKey)
    if (!savedDraft) {
      return
    }

    try {
      const parsedDraft = JSON.parse(savedDraft)
      setPost({ ...createEmptyPost(), ...parsedDraft })
      setDraftRecovered(true)
    } catch {
      localStorage.removeItem(draftStorageKey)
    }
  }, [draftStorageKey, id])

  useEffect(() => {
    if (!id) {
      return
    }

    axios.get(`/api/posts/${id}`).then((res) => {
      const data = res.data
      const serverPost = {
        title: data.title,
        summary: data.summary || '',
        content: data.content,
        series: data.series || '',
        tags: data.tags ? data.tags.join(', ') : '',
        createdAt: formatDateTime(data.createdAt)
      }

      const savedDraft = localStorage.getItem(draftStorageKey)
      if (!savedDraft) {
        setPost(serverPost)
        return
      }

      try {
        const parsedDraft = JSON.parse(savedDraft)
        setPost({ ...serverPost, ...parsedDraft })
        setDraftRecovered(true)
      } catch {
        localStorage.removeItem(draftStorageKey)
        setPost(serverPost)
      }
    })
  }, [draftStorageKey, id])

  useEffect(() => {
    if (!post.title && !post.summary && !post.content && !post.series && !post.tags) {
      return
    }

    localStorage.setItem(draftStorageKey, JSON.stringify(post))
  }, [draftStorageKey, post])

  const uploadFile = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('文件过大（限 5MB）')

    const formData = new FormData()
    formData.append('image', file)
    setIsUploading(true)

    try {
      const res = await axios.post('/api/upload', formData)
      setPost((currentPost) => ({
        ...currentPost,
        content: `${currentPost.content}\n![img](${res.data.url})\n`
      }))
    } catch {
      alert('上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = (e) => uploadFile(e.target.files[0])

  const handlePaste = (e) => {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
        uploadFile(e.clipboardData.items[i].getAsFile())
      }
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    uploadFile(e.dataTransfer.files[0])
  }

  const insertSnippet = (snippet) => {
    setPost((currentPost) => ({
      ...currentPost,
      content: currentPost.content.endsWith('\n') || currentPost.content.length === 0
        ? `${currentPost.content}${snippet}`
        : `${currentPost.content}\n${snippet}`
    }))
  }

  const clearRecoveredDraft = () => {
    localStorage.removeItem(draftStorageKey)
    setDraftRecovered(false)
    setPost(createEmptyPost())
  }

  const handleSubmit = async (e, postStatus) => {
    e.preventDefault()

    const postData = {
      ...post,
      tags: post.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== ''),
      status: postStatus
    }

    try {
      if (id) await axios.put(`/api/posts/${id}`, postData)
      else await axios.post('/api/posts', postData)

      localStorage.removeItem(draftStorageKey)
      navigate('/')
    } catch {
      alert('保存失败')
    }
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
          {draftRecovered && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-theme-base border-4 border-theme-border rounded-2xl px-5 py-4 shadow-brutal-sm">
              <div>
                <p className="font-mono font-black uppercase text-sm tracking-widest text-theme-text-primary">Recovered Local Draft</p>
                <p className="text-sm font-bold text-theme-text-secondary">上次未完成的内容已恢复，可以继续写，或者清空重来。</p>
              </div>
              <button
                type="button"
                onClick={clearRecoveredDraft}
                className="shrink-0 px-4 py-2 border-2 border-theme-border bg-theme-surface font-mono font-black text-xs uppercase shadow-brutal-sm hover:shadow-brutal transition-all text-theme-text-primary"
              >
                Clear Draft
              </button>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
              <Type size={16} strokeWidth={3} /> TITLE
            </label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-6 py-4 text-2xl font-black text-theme-text-primary focus:outline-none focus:shadow-brutal focus:-translate-y-1 focus:-translate-x-1 transition-all placeholder:text-theme-text-secondary/50"
              placeholder="ENTER TITLE"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <BookOpen size={16} strokeWidth={3} /> SERIES
              </label>
              <input
                type="text"
                value={post.series}
                onChange={(e) => setPost({ ...post, series: e.target.value })}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all placeholder:text-theme-text-secondary/50"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <Hash size={16} strokeWidth={3} /> TAGS
              </label>
              <input
                type="text"
                value={post.tags}
                onChange={(e) => setPost({ ...post, tags: e.target.value })}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all placeholder:text-theme-text-secondary/50"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <CalendarClock size={16} strokeWidth={3} /> DATE
              </label>
              <input
                type="datetime-local"
                value={post.createdAt}
                onChange={(e) => setPost({ ...post, createdAt: e.target.value })}
                className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-4 py-3 font-black font-mono text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
              <Quote size={16} strokeWidth={3} /> SUMMARY / 简介
            </label>
            <textarea
              value={post.summary}
              onChange={(e) => setPost({ ...post, summary: e.target.value })}
              rows="2"
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl p-4 text-theme-text-primary font-bold text-lg leading-relaxed focus:outline-none focus:shadow-brutal transition-all resize-none placeholder:text-theme-text-secondary/50"
              placeholder="一两句话概括本文核心内容；不填则列表页会自动截取正文。"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-2">
              <label className="flex items-center gap-2 font-mono font-black text-theme-text-primary uppercase tracking-widest text-sm">
                <FileText size={16} strokeWidth={3} /> CONTENT (MD)
              </label>
              <div className="flex items-center gap-4">
                <label
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-theme-border font-black text-sm uppercase cursor-pointer shadow-brutal-sm hover:shadow-brutal transition-all
                    ${isUploading ? 'bg-theme-hover text-theme-text-secondary' : 'bg-theme-accent text-white'}
                  `}
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} strokeWidth={3} />}
                  {isUploading ? 'UPLOADING...' : 'INSERT IMAGE'}
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isUploading} />
                </label>
                <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-widest text-theme-text-secondary">
                  <AlertCircle size={12} strokeWidth={3} /> DND / PASTE
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {markdownSnippets.map((snippet) => (
                <button
                  key={snippet.label}
                  type="button"
                  onClick={() => insertSnippet(snippet.value)}
                  className="border-2 border-theme-border bg-theme-surface px-3 py-1.5 font-mono font-black text-xs uppercase text-theme-text-primary shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                  + {snippet.label}
                </button>
              ))}
            </div>

            <textarea
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              value={post.content}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              rows="20"
              required
              className="w-full bg-theme-base border-4 border-theme-border rounded-2xl p-6 text-theme-text-primary font-mono text-lg leading-relaxed focus:outline-none focus:shadow-brutal transition-all resize-y"
            />

            <div className="flex flex-wrap gap-3 font-mono font-black text-[11px] uppercase tracking-widest text-theme-text-secondary">
              <span className="bg-theme-surface border-2 border-theme-border px-3 py-1.5 shadow-brutal-sm">Words: {wordCount}</span>
              <span className="bg-theme-surface border-2 border-theme-border px-3 py-1.5 shadow-brutal-sm">Chars: {post.content.length}</span>
              <span className="bg-theme-surface border-2 border-theme-border px-3 py-1.5 shadow-brutal-sm">Read: {estimatedReadMinutes} Min</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t-4 border-theme-border">
            <button type="button" onClick={() => navigate(-1)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-4 border-theme-border bg-theme-surface font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all text-theme-text-primary">
              <XCircle size={20} strokeWidth={3} /> DISCARD
            </button>
            <div className="flex w-full md:w-auto items-center gap-4">
              <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={isUploading || !post.title || !post.content} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-theme-base border-4 border-theme-border text-theme-text-primary px-8 py-4 rounded-xl font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all disabled:opacity-50">
                <Save size={20} strokeWidth={3} /> DRAFT
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'published')} disabled={isUploading || !post.title || !post.content} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-theme-accent border-4 border-theme-border text-white px-10 py-4 rounded-xl font-black uppercase shadow-brutal hover:shadow-brutal-lg active:active-brutal transition-all disabled:opacity-50">
                <Send size={20} strokeWidth={3} /> {id ? 'UPDATE' : 'PUBLISH'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
