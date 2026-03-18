import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

// --- 引入所有页面组件 ---
import PostList from './PostList'
import CreatePost from './CreatePost'
import PostDetail from './PostDetail'
import FilteredPosts from './FilteredPosts'
import SeriesList from './SeriesList'
import TagCloud from './TagCloud'
import About from './About'
import AdminLogin from './AdminLogin.jsx' // 🟢 新增：管理员登录页

// --- 引入图标与主题上下文 ---
import { Home, FolderOpen, Tag, User, Sun, Moon, Monitor, ChevronDown, LogOut } from 'lucide-react'
import { useTheme } from './ThemeContext' 

// ==========================================
// 🚀 全局 Axios 拦截器 (核心魔法)
// ==========================================
// 每次前端发送任何 axios 请求前，都会自动执行这个拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // 如果本地有令牌，就把它挂在 HTTP 头部的 Authorization 字段里发送给后端
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// ==========================================
// 🛡️ 路由守卫组件 (保护特权区域)
// ==========================================
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("⛔ 访问受限：只有管理员才可以编辑文章！");
    // 如果没有 Token，直接重定向回首页
    return <Navigate to="/" replace />;
  }
  return children; // 如果有 Token，则正常渲染包裹的组件（如 CreatePost）
};

// ==========================================
// 🎨 主 App 组件
// ==========================================
function App() {
  const { theme, updateTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  
  // 🟢 判断当前是否处于登录状态
  const isLoggedIn = !!localStorage.getItem('token'); 

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🟢 登出逻辑
  const handleLogout = () => {
    if (window.confirm("确定要退出管理员模式吗？")) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.reload(); // 强制刷新页面以清除所有的状态缓存
    }
  };

  const navItems = [
    { path: '/', label: '首页', icon: <Home size={16} /> },
    { path: '/series', label: '合集', icon: <FolderOpen size={16} /> },
    { path: '/tags', label: '标签', icon: <Tag size={16} /> },
    { path: '/about', label: '关于', icon: <User size={16} /> }
  ]

  // 主题选项配置
  const themeOptions = [
    { id: 'light', label: '总是亮色', icon: <Sun size={14} /> },
    { id: 'dark', label: '总是暗色', icon: <Moon size={14} /> },
    { id: 'system', label: '跟随系统', icon: <Monitor size={14} /> }
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0c] dark:text-gray-200 transition-colors duration-500">
      <div className="w-full mx-auto p-4 md:p-8 relative">
        
        {/* 🌓 顶部右侧控制区 (主题切换 + 登出) */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-[100] flex items-center gap-4" ref={menuRef}>
          
          {/* 🟢 如果登录了，显示红色的登出按钮 */}
          {isLoggedIn && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold font-mono hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm"
            >
              <LogOut size={12} /> LOGOUT
            </button>
          )}

          {/* 主题下拉按钮 */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-gray-300 backdrop-blur-md"
            >
              {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
              <ChevronDown size={14} className={`transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉列表内容 */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 py-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl animate-in fade-in zoom-in duration-200 origin-top-right">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateTheme(opt.id)
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      theme === opt.id 
                        ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 font-bold' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 顶部 Logo 区 */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12 pt-8 md:pt-0">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse inline-block tracking-tight">
              STEADY LIU
            </h1>
          </div>
          
          <nav className="flex items-center mb-16 border-b border-gray-200 dark:border-gray-800/50 pb-4 transition-colors duration-300">
            <div className="flex gap-10 text-sm font-bold tracking-[0.2em] uppercase text-left">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `relative pb-4 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 ${
                      isActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`transition-all ${isActive ? 'scale-110' : 'opacity-60'}`}>{item.icon}</span>
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>

        {/* 路由展示区 */}
        <div className="w-full">
          <Routes>
            <Route path="/" element={<div className="max-w-4xl mx-auto"><PostList /></div>} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/series" element={<div className="max-w-4xl mx-auto"><SeriesList /></div>} />
            <Route path="/tags" element={<div className="max-w-4xl mx-auto"><TagCloud /></div>} />
            <Route path="/about" element={<div className="max-w-4xl mx-auto"><About /></div>} />
            <Route path="/series/:name" element={<FilteredPosts type="series" />} />
            <Route path="/tags/:name" element={<FilteredPosts type="tag" />} />
            
            {/* 🟢 新增：你的隐藏暗门 */}
            <Route path="/steady-admin" element={<div className="max-w-4xl mx-auto"><AdminLogin /></div>} />

            {/* 🟢 修改：给特权操作加上 RequireAuth 保护罩 */}
            <Route path="/create" element={
              <RequireAuth>
                <div className="max-w-4xl mx-auto"><CreatePost /></div>
              </RequireAuth>
            } />
            <Route path="/edit/:id" element={
              <RequireAuth>
                <div className="max-w-4xl mx-auto"><CreatePost /></div>
              </RequireAuth>
            } />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App