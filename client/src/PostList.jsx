import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, Search, Clock, Edit3, Trash2, 
  ChevronRight, FileText, Calendar 
} from 'lucide-react'

function PostList() {
  const [posts, setPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPosts = () => {
    axios.get('http://localhost:5000/api/posts')
      .then(res => setPosts(res.data))
      .catch(err => console.error("获取失败:", err))
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (window.confirm('确定要删除吗？这份记录将永久消失。')) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${id}`)
        fetchPosts()
      } catch (err) {
        alert('删除失败')
      }
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10">
      {/* 1. 顶部标题栏：还原精致的间距与边框 */}
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-8 transition-colors">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
            STEADY <span className="text-blue-500">LOG</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-600 font-mono text-xs mt-2 tracking-[0.3em] uppercase">
            Total Archives: {posts.length}
          </p>
        </div>
        <Link to="/create">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm">
            <Plus size={18} strokeWidth={3} /> 新建博文
          </button>
        </Link>
      </div>

      {/* 2. 搜索框：还原玻璃质感 */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-600 group-focus-within:text-blue-500 transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="探索你的知识库..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900/60 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium shadow-sm backdrop-blur-sm"
        />
        {searchQuery && (
          <div className="absolute right-4 top-4 text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
            FOUND: {filteredPosts.length}
          </div>
        )}
      </div>

      {/* 3. 文章卡片列表：还原圆角与悬停动画 */}
      <div className="grid gap-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-24 bg-gray-100/50 dark:bg-gray-900/10 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-800 mb-4 opacity-20" />
            <p className="text-gray-400 dark:text-gray-600 italic font-mono uppercase tracking-widest text-sm">No records found</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post._id} className="group relative bg-white/80 dark:bg-gray-900/30 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all duration-500 text-left overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10">
              
              {/* 悬停时的右侧箭头提示 (还原) */}
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:right-6 transition-all duration-500 text-blue-500/50">
                <ChevronRight size={32} />
              </div>

              <Link to={`/post/${post._id}`} className="block mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors leading-tight">
                  {post.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-500 leading-relaxed mb-8 line-clamp-2 font-medium">
                {post.content}
              </p>

              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800/50 pt-6">
                <div className="flex gap-6">
                  <Link to={`/edit/${post._id}`} className="flex items-center gap-1.5 text-xs font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <button 
                    onClick={(e) => handleDelete(e, post._id)} 
                    className="flex items-center gap-1.5 text-xs font-black text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 dark:text-gray-600">
                  <Calendar size={12} className="opacity-50" />
                  {new Date(post.createdAt).toLocaleDateString()}
                  <span className="mx-1 opacity-20">|</span>
                  <Clock size={12} className="opacity-50" />
                  {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PostList