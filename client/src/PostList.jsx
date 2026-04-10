import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, Edit3, Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

function PostList() {
  const [posts, setPosts] = useState([])
  const[searchQuery, setSearchQuery] = useState('')
  const [pageInput, setPageInput] = useState('1')
  
  const { page } = useParams()
  const navigate = useNavigate()
  const parsedPage = Number.parseInt(page || '1', 10)
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  const POSTS_PER_PAGE = 15 // 每页显示篇数

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

  // 过滤数据
  const filteredPosts = Array.isArray(posts) ? posts.filter(post => 
    (post?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post?.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) :[]

  // 计算分页数据
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE) || 1
  const currentPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  // 当搜索导致当前页数超过总页数时，自动跳回第一页
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      navigate('/');
    }
  }, [filteredPosts.length, currentPage, totalPages, navigate])

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      navigate(newPage === 1 ? '/' : `/blog/${newPage}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageJump = (e) => {
    e.preventDefault()
    const targetPage = Number.parseInt(pageInput, 10)

    if (Number.isNaN(targetPage)) {
      setPageInput(String(currentPage))
      return
    }

    const clampedPage = Math.min(totalPages, Math.max(1, targetPage))
    handlePageChange(clampedPage)
  }

  const getPageItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages]
  }

  return (
    <div className="space-y-10 text-left mb-24 w-full">
      
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

      <div className="flex flex-col gap-6 w-full min-w-0">
        {currentPosts.length === 0 ? (
          <div className="text-center py-20 bg-theme-surface border-2 border-dashed border-theme-text-secondary rounded-sm w-full">
            <p className="text-theme-text-secondary font-mono font-bold uppercase tracking-widest text-sm">100% Empty Context</p>
          </div>
        ) : (
          currentPosts.map(post => (
            <div key={post._id} className="group flex flex-col md:flex-row w-full min-w-0 bg-theme-surface border-2 border-theme-border rounded-sm shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_var(--color-border)] transition-all duration-200">
              
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

      {/* === 粗野风分页器 === */}
      {totalPages > 1 && (
        <div className="mt-16 border-t-2 border-theme-border border-dashed pt-12 space-y-5">
          <div className="flex flex-col lg:flex-row justify-center items-center gap-3 md:gap-4">
          
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 border-2 border-theme-border bg-theme-surface font-black font-mono text-sm uppercase shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all disabled:opacity-30 disabled:pointer-events-none text-theme-text-primary"
            >
              <ChevronLeft size={16} strokeWidth={3} /> PREV
            </button>

            <div className="flex gap-2 items-center">
              {getPageItems().map((item, index) => {
                if (typeof item !== 'number') {
                  return (
                    <span
                      key={`${item}-${index}`}
                      className="hidden md:flex w-10 h-10 items-center justify-center font-black font-mono text-sm text-theme-text-secondary"
                    >
                      ...
                    </span>
                  )
                }

                const isActive = item === currentPage
                return (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item)}
                    className={`hidden md:flex w-10 h-10 items-center justify-center border-2 border-theme-border font-black font-mono text-sm shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all ${
                      isActive ? 'bg-theme-accent text-white shadow-brutal -translate-y-0.5' : 'bg-theme-surface text-theme-text-primary'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}

              {/* 移动端只显示当前页数 */}
              <div className="md:hidden flex items-center justify-center px-4 border-2 border-theme-border bg-theme-base font-black font-mono text-theme-text-primary">
                {currentPage} / {totalPages}
              </div>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 border-2 border-theme-border bg-theme-surface font-black font-mono text-sm uppercase shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all disabled:opacity-30 disabled:pointer-events-none text-theme-text-primary"
            >
              NEXT <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handlePageJump} className="flex flex-wrap justify-center items-center gap-3 font-mono">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-text-secondary">
              Jump To Page
            </span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-24 border-2 border-theme-border bg-theme-surface px-3 py-2 text-center font-black text-theme-text-primary focus:outline-none shadow-brutal-sm focus:shadow-brutal focus:-translate-y-0.5 transition-all"
            />
            <button
              type="submit"
              className="border-2 border-theme-border bg-theme-text-primary px-4 py-2 font-black text-sm uppercase text-theme-surface shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all"
            >
              Go
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-theme-text-secondary">
              Total {totalPages}
            </span>
          </form>
        </div>
      )}

    </div>
  )
}

export default PostList
