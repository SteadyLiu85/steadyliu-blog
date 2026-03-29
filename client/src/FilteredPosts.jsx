import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Tag, FolderOpen, Calendar, ArrowLeft, ChevronRight, Hash, Loader2 } from 'lucide-react'

function FilteredPosts({ type }) {
  const { name } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const encodedName = encodeURIComponent(name)
    const url = type === 'tag' ? `/api/posts/filter/data?tag=${encodedName}` : `/api/posts/filter/data?series=${encodedName}`
    
    axios.get(url)
      .then(res => { 
        if (Array.isArray(res.data)) setPosts(res.data);
        else setPosts([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPosts([]);
        setLoading(false); // 防止网络错误死循环
      })
  }, [name, type])

  return (
    <div className="text-left mb-24">
      <Link 
        to={type === 'tag' ? '/tags' : '/series'}
        className="inline-flex items-center gap-2 bg-theme-surface border-2 border-theme-border px-4 py-2 rounded-xl text-theme-text-primary font-black text-sm shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all mb-12 uppercase"
      >
        <ArrowLeft size={16} strokeWidth={3} /> BACK
      </Link>

      <div className="mb-16 bg-theme-surface border-4 border-theme-border p-10 rounded-2xl shadow-brutal-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent border-l-4 border-b-4 border-theme-border -mr-16 -mt-16 rotate-45"></div>
        <div className="flex items-center gap-3 text-theme-text-secondary font-black font-mono text-sm uppercase tracking-widest mb-4">
          {type === 'tag' ? <Tag size={18} strokeWidth={3}/> : <FolderOpen size={18} strokeWidth={3}/>}
          {type === 'tag' ? 'TAG FILTER' : 'SERIES FILTER'}
        </div>
        <h1 className="text-5xl font-black text-theme-text-primary tracking-tight uppercase flex items-center gap-4">
          {type === 'tag' && <span className="text-theme-accent">#</span>}
          {name}
        </h1>
        <p className="mt-6 font-mono font-black text-sm uppercase bg-theme-base border-2 border-theme-border inline-block px-4 py-2 rounded-lg shadow-brutal-sm">
          Matched Entries: <span className="text-theme-accent text-lg">{posts.length}</span>
        </p>
      </div>

      <div className="grid gap-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-theme-text-primary font-black font-mono uppercase text-2xl">
            <Loader2 className="animate-spin mb-4" size={40} strokeWidth={3} />
            Synchronizing...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-theme-surface rounded-[2rem] border-4 border-dashed border-theme-border shadow-brutal">
            <p className="text-theme-text-secondary font-black font-mono uppercase tracking-widest text-lg">No entries found</p>
          </div>
        ) : (
          posts.map(post => (
            // 回档：使用 post._id
            <Link 
              key={post._id} 
              to={`/post/${post._id}`} 
              className="group block bg-theme-surface p-8 rounded-2xl border-4 border-theme-border shadow-brutal hover:shadow-brutal-lg hover:-translate-y-2 hover:-translate-x-2 transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute top-1/2 right-8 -translate-y-1/2 text-theme-border opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                <ChevronRight size={48} strokeWidth={4} />
              </div>

              <div className="flex flex-col gap-4 relative z-10 pr-16">
                <h2 className="text-3xl font-black text-theme-text-primary group-hover:text-theme-accent transition-colors leading-tight">
                  {post.title}
                </h2>
                
                <p className="text-theme-text-secondary font-medium leading-relaxed line-clamp-2 text-base">
                  {post.summary || post.content.replace(/[#*`>]/g, '')}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-xs font-bold font-mono text-theme-text-secondary uppercase tracking-widest mt-2">
                  <span className="flex items-center gap-2 bg-theme-base border-2 border-theme-border px-3 py-1.5 rounded-lg shadow-brutal-sm text-theme-text-primary">
                    <Calendar size={14} strokeWidth={3} />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  
                  {type === 'tag' && post.series && (
                    <span className="flex items-center gap-2 bg-theme-accent text-white border-2 border-theme-border px-3 py-1.5 rounded-lg shadow-brutal-sm">
                      <FolderOpen size={14} strokeWidth={3} /> {post.series}
                    </span>
                  )}

                  <div className="flex gap-3">
                    {post.tags.slice(0, 3).map(t => (
                      <span key={t} className="flex items-center gap-1 bg-theme-base border-2 border-theme-border px-2 py-1 rounded-md text-theme-text-primary shadow-brutal-sm">
                        <Hash size={12} strokeWidth={3} /> {t}
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