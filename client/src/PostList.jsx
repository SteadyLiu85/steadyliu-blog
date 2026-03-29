import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Search, Edit3, Trash2, ArrowRight } from 'lucide-react'

function PostList() {
  const [posts, setPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPosts = () => {
    axios.get('/api/posts')
      .then(res => {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else {
          setPosts([]);
        }
      })
      .catch(err => {
        console.error(err);
        setPosts([]);
      })
  }

  useEffect(() => { fetchPosts() },[])

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (window.confirm('Delete this entry?')) {
      try { 
        await axios.delete(`/api/posts/${id}`); 
        fetchPosts(); 
      } catch (err) { 
        alert('删除失败'); 
      }
    }
  }

  const filteredPosts = Array.isArray(posts) ? posts.filter(post => 
    (post?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post?.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) :[]

  return (
    <div className="space-y-10 text-left mb-24 w-full">
      
      {/* 头部控制与搜索栏 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-end w-full">
        <div className="w-full md:w-2/3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-text-primary">
              <Search size={18} strokeWidth={3} />
            </div>
            <input 
              type="text" 
              placeholder="Search codebase context..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-surface border-2 border-theme-border rounded-sm pl-12 pr-4 py-3 font-mono font-bold text-theme-text-primary focus:outline-none shadow-brutal-sm focus:shadow-brutal focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all placeholder:text-theme-text-secondary/50"
            />
          </div>
        </div>
        <Link to="/create" className="shrink-0 w-full md:w-auto text-center bg-theme-text-primary text-theme-surface font-mono font-bold text-sm px-6 py-3.5 rounded-sm border-2 border-theme-border hover:bg-theme-surface hover:text-theme-text-primary shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all">
          Write New Entry →
        </Link>
      </div>

      {/* [核心修复]：放弃 grid，改为 flex flex-col 并加上 w-full min-w-0 强制收缩限制 */}
      <div className="flex flex-col gap-6 w-full min-w-0">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-theme-surface border-2 border-dashed border-theme-text-secondary rounded-sm w-full">
            <p className="text-theme-text-secondary font-mono font-bold uppercase tracking-widest text-sm">100% Empty Context</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            // [核心修复]：卡片增加 w-full min-w-0
            <div key={post._id} className="group flex flex-col md:flex-row w-full min-w-0 bg-theme-surface border-2 border-theme-border rounded-sm shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_var(--color-border)] transition-all duration-200">
              
              {/* 左侧元信息区 */}
              <div className="w-full md:w-1/4 border-b-2 md:border-b-0 md:border-r-2 border-theme-border bg-theme-base/50 p-6 flex flex-col justify-between min-w-0 shrink-0">
                <div className="space-y-4">
                  <div className="font-mono text-xs font-bold text-theme-text-secondary uppercase">
                    Date
                    <div className="text-theme-text-primary mt-1 text-sm">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                  {post.series && (
                    <div className="font-mono text-xs font-bold text-theme-text-secondary uppercase">
                      Category
                      <div className="text-theme-accent mt-1 text-sm truncate">{post.series}</div>
                    </div>
                  )}
                </div>
                
                <div className="hidden md:flex gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/edit/${post._id}`} className="text-theme-text-secondary hover:text-theme-text-primary"><Edit3 size={16} strokeWidth={2.5}/></Link>
                  <button onClick={(e) => handleDelete(e, post._id)} className="text-theme-text-secondary hover:text-red-500"><Trash2 size={16} strokeWidth={2.5}/></button>
                </div>
              </div>

              {/* [核心修复]：右侧正文区增加 w-full min-w-0，并强制断词 break-words */}
              <Link to={`/post/${post._id}`} className="w-full md:w-3/4 p-6 flex flex-col cursor-pointer min-w-0">
                <h2 className="text-2xl md:text-3xl font-black text-theme-text-primary leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4 decoration-theme-accent break-words whitespace-normal">
                  {post.title}
                </h2>
                
                <p className="text-theme-text-secondary font-medium leading-relaxed mb-6 line-clamp-3 break-words whitespace-normal">
                  {post.summary || post.content.replace(/[#*`>]/g, '')}
                </p>

                <div className="mt-auto flex justify-between items-end gap-4">
                  <div className="flex gap-2 flex-wrap min-w-0">
                    {post.tags?.slice(0,3).map(tag => (
                      <span key={tag} className="font-mono text-[10px] font-bold border border-theme-border px-1.5 py-0.5 text-theme-text-secondary rounded-sm truncate">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ArrowRight size={20} strokeWidth={2.5} className="shrink-0 text-theme-border opacity-30 group-hover:opacity-100 group-hover:text-theme-accent group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PostList