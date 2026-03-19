import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
// --- 引入图标 ---
import { Tag, FolderOpen, Calendar, ArrowLeft, ChevronRight, Hash, Loader2 } from 'lucide-react'

function FilteredPosts({ type }) {
  const { name } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const encodedName = encodeURIComponent(name)
    
    const url = type === 'tag' 
      ? `/api/posts/filter/data?tag=${encodedName}`
      : `/api/posts/filter/data?series=${encodedName}`
    
    axios.get(url)
      .then(res => {
        setPosts(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Fetch Error:", err)
        setLoading(false)
      })
  }, [name, type])

  return (
    <div className="max-w-4xl mx-auto p-8 pb-24 text-left">
      {/* 返回按钮 */}
      <Link 
        to={type === 'tag' ? '/tags' : '/series'}
        className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-10 font-bold text-sm"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        返回{type === 'tag' ? '标签云' : '合集列表'}
      </Link>

      {/* --- 页面头部 --- */}
      <div className="mb-16 border-l-4 border-blue-600 pl-8 relative transition-colors">
        <div className="absolute -left-1 top-0 h-full w-1 bg-blue-400 blur-sm"></div>
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2 font-mono text-sm uppercase tracking-[0.2em] transition-colors">
          {type === 'tag' ? <Tag size={16} /> : <FolderOpen size={16} />}
          {type === 'tag' ? 'Filtered by Tag' : 'Series Collection'}
        </div>
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight transition-colors flex items-center">
          {type === 'tag' && <span className="text-blue-500 mr-2">#</span>}
          {name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-6 font-mono text-xs uppercase tracking-widest transition-colors">
          Total matched entries: <span className="text-blue-600 dark:text-blue-400 font-bold">{posts.length}</span>
        </p>
      </div>

      {/* --- 结果列表 --- */}
      <div className="grid gap-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-mono italic transition-colors">
            <Loader2 className="animate-spin mb-4" size={32} />
            Data Synchronizing...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/10 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <p className="text-gray-500 dark:text-gray-600 italic">该目录下暂无文章...</p>
          </div>
        ) : (
          posts.map(post => (
            <Link 
              key={post._id} 
              to={`/post/${post._id}`} 
              className="group block bg-white/80 dark:bg-gray-900/20 backdrop-blur-sm p-8 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 
                         hover:border-blue-500/40 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 
                         shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] 
                         transition-all duration-300 relative overflow-hidden text-left"
            >
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 p-6 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:translate-x-2">
                <ChevronRight size={64} />
              </div>

              <div className="flex flex-col gap-5 relative z-10">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                  {post.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 dark:text-gray-500 font-mono transition-colors">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  
                  {type === 'tag' && post.series && (
                    <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400/80 font-bold transition-colors">
                      <FolderOpen size={14} />
                      {post.series}
                    </span>
                  )}

                  <div className="flex gap-4">
                    {post.tags.slice(0, 3).map(t => (
                      <span key={t} className="flex items-center gap-1 opacity-60 dark:opacity-40 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-all">
                        <Hash size={12} /> {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default FilteredPosts