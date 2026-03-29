import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Tag, FolderOpen, Calendar, ArrowLeft, ChevronRight, Hash, Loader2 } from 'lucide-react'

function FilteredPosts({ type }) {
  const { name } = useParams()
  const [posts, setPosts] = useState([])
  const[loading, setLoading] = useState(true)

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
        setLoading(false);
      })
  }, [name, type])

  return (
    <div className="text-left mb-24 w-full">
      <Link 
        to={type === 'tag' ? '/tags' : '/series'}
        className="inline-flex items-center gap-2 bg-theme-surface border-2 border-theme-border px-4 py-2 rounded-xl text-theme-text-primary font-black text-sm shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all mb-12 uppercase"
      >
        <ArrowLeft size={16} strokeWidth={3} /> BACK
      </Link>

      <div className="mb-16 bg-theme-surface border-4 border-theme-border p-6 md:p-10 rounded-2xl shadow-brutal-lg relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent border-l-4 border-b-4 border-theme-border -mr-16 -mt-16 rotate-45"></div>
        <div className="flex items-center gap-3 text-theme-text-secondary font-black font-mono text-sm uppercase tracking-widest mb-4">
          {type === 'tag' ? <Tag size={18} strokeWidth={3}/> : <FolderOpen size={18} strokeWidth={3}/>}
          {type === 'tag' ? 'TAG FILTER' : 'SERIES FILTER'}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-theme-text-primary tracking-tight uppercase flex items-center gap-4 break-words whitespace-normal">
          {type === 'tag' && <span className="text-theme-accent shrink-0">#</span>}
          {name}
        </h1>
        <p className="mt-6 font-mono font-black text-sm uppercase bg-theme-base border-2 border-theme-border inline-block px-4 py-2 rounded-lg shadow-brutal-sm">
          Matched Entries: <span className="text-theme-accent text-lg">{posts.length}</span>
        </p>
      </div>

      {/* [核心修复]：放弃 grid，改为 flex flex-col 并加上 w-full min-w-0 */}
      <div className="flex flex-col gap-8 w-full min-w-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-theme-text-primary font-black font-mono uppercase text-2xl w-full">
            <Loader2 className="animate-spin mb-4" size={40} strokeWidth={3} />
            Synchronizing...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-theme-surface rounded-[2rem] border-4 border-dashed border-theme-border shadow-brutal w-full">
            <p className="text-theme-text-secondary font-black font-mono uppercase tracking-widest text-lg">No entries found</p>
          </div>
        ) : (
          posts.map(post => (
            <Link 
              key={post._id} 
              to={`/post/${post._id}`} 
              className="group block w-full min-w-0 bg-theme-surface p-6 md:p-8 rounded-2xl border-4 border-theme-border shadow-brutal hover:shadow-brutal-lg hover:-translate-y-2 hover:-translate-x-2 transition-all duration-200 relative overflow-hidden"
            >
              <div className="hidden md:block absolute top-1/2 right-8 -translate-y-1/2 text-theme-border opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                <ChevronRight size={48} strokeWidth={4} />
              </div>

              {/* [核心修复]：强制右边距适应，并允许内部文字换行 break-words */}
              <div className="flex flex-col gap-4 relative z-10 md:pr-16 w-full min-w-0">
                <h2 className="text-2xl md:text-3xl font-black text-theme-text-primary group-hover:text-theme-accent transition-colors leading-tight break-words whitespace-normal">
                  {post.title}
                </h2>
                
                <p className="text-theme-text-secondary font-medium leading-relaxed line-clamp-2 text-base break-words whitespace-normal">
                  {post.summary || post.content.replace(/[#*`>]/g, '')}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-bold font-mono text-theme-text-secondary uppercase tracking-widest mt-2 min-w-0">
                  <span className="flex items-center gap-2 bg-theme-base border-2 border-theme-border px-3 py-1.5 rounded-lg shadow-brutal-sm text-theme-text-primary shrink-0">
                    <Calendar size={14} strokeWidth={3} />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  
                  {type === 'tag' && post.series && (
                    <span className="flex items-center gap-2 bg-theme-accent text-white border-2 border-theme-border px-3 py-1.5 rounded-lg shadow-brutal-sm shrink-0">
                      <FolderOpen size={14} strokeWidth={3} /> {post.series}
                    </span>
                  )}

                  <div className="flex gap-2 flex-wrap min-w-0">
                    {post.tags.slice(0, 3).map(t => (
                      <span key={t} className="flex items-center gap-1 bg-theme-base border-2 border-theme-border px-2 py-1 rounded-md text-theme-text-primary shadow-brutal-sm truncate">
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