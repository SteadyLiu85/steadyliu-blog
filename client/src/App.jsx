import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

import PostList from './PostList'
import CreatePost from './CreatePost'
import PostDetail from './PostDetail'
import FilteredPosts from './FilteredPosts'
import SeriesList from './SeriesList'
import TagCloud from './TagCloud'
import About from './About'
import AdminLogin from './AdminLogin.jsx'
import Dashboard from './Dashboard'

import { Sun, Moon, Monitor, ChevronDown, LogOut } from 'lucide-react'
import { useTheme } from './ThemeContext' 

axios.defaults.baseURL = '';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("⛔ 访问受限");
    return <Navigate to="/" replace />;
  }
  return children; 
};

function App() {
  const { theme, updateTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const isLoggedIn = !!localStorage.getItem('token'); 

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  },[])

  const handleLogout = () => {
    if (window.confirm("确定要退出管理员模式吗？")) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.reload(); 
    }
  };

  const navItems =[
    { path: '/', label: 'Blog' },
    { path: '/series', label: 'Series' },
    { path: '/tags', label: 'Tags' },
    { path: '/about', label: 'About' }
  ]

  const themeOptions =[
    { id: 'light', label: 'Light', icon: <Sun size={14} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { id: 'system', label: 'System', icon: <Monitor size={14} /> }
  ]

  return (
    <div className="min-h-screen pb-12">
      
      {/* 导航栏 */}
      <header className="border-b-2 border-theme-border bg-theme-surface sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          
          {/* Logo & 导航 */}
          <div className="flex items-center gap-8">
            <div className="font-black text-xl tracking-tight uppercase flex items-center gap-2">
              STEADY <span className="bg-theme-text-primary text-theme-surface px-1.5 py-0.5 text-sm leading-none">LOG</span>
            </div>
            
            <nav className="hidden md:flex gap-1 font-mono text-sm font-bold">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `px-3 py-1.5 transition-colors ${
                      isActive 
                        ? 'bg-theme-text-primary text-theme-surface' 
                        : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-hover'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 右侧 */}
          <div className="flex items-center gap-3" ref={menuRef}>
            {isLoggedIn && (
              <>
                <NavLink to="/dashboard" className="hidden md:block font-mono text-xs font-bold border-2 border-theme-border px-3 py-1.5 shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal active:active-brutal-sm transition-all bg-theme-surface">
                  DASHBOARD
                </NavLink>
                <button onClick={handleLogout} className="text-theme-text-secondary hover:text-theme-accent transition-colors" title="Logout">
                  <LogOut size={16} />
                </button>
              </>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 border-2 border-theme-border px-2 py-1 shadow-brutal-sm hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] active:active-brutal-sm transition-all bg-theme-surface"
              >
                {theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <Monitor size={14} />}
                <ChevronDown size={12} className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 border-2 border-theme-border bg-theme-surface shadow-brutal flex flex-col font-mono text-sm">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { updateTheme(opt.id); setShowMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-2 text-left hover:bg-theme-text-primary hover:text-theme-surface transition-colors ${
                        theme === opt.id ? 'bg-theme-hover font-bold' : 'text-theme-text-secondary'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 移动端辅助 */}
      <div className="md:hidden border-b-2 border-theme-border bg-theme-surface px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `font-mono text-xs font-bold px-3 py-1.5 border-2 border-theme-border whitespace-nowrap ${isActive ? 'bg-theme-text-primary text-theme-surface' : 'bg-theme-base text-theme-text-primary'}`}>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* 主路由 */}
      <main className="w-full mt-8 md:mt-12 px-4 md:px-8">
        <Routes>
          <Route path="/" element={<div className="max-w-4xl mx-auto"><PostList /></div>} />
          <Route path="/blog/:page" element={<div className="max-w-4xl mx-auto"><PostList /></div>} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/series" element={<div className="max-w-4xl mx-auto"><SeriesList /></div>} />
          <Route path="/tags" element={<div className="max-w-4xl mx-auto"><TagCloud /></div>} />
          <Route path="/about" element={<div className="max-w-4xl mx-auto"><About /></div>} />
          <Route path="/series/:name" element={<FilteredPosts type="series" />} />
          <Route path="/tags/:name" element={<FilteredPosts type="tag" />} />
          <Route path="/steady-admin" element={<div className="max-w-4xl mx-auto"><AdminLogin /></div>} />
          <Route path="/dashboard" element={ <RequireAuth><div className="max-w-6xl mx-auto"><Dashboard /></div></RequireAuth> } />
          <Route path="/create" element={ <RequireAuth><div className="max-w-4xl mx-auto"><CreatePost /></div></RequireAuth> } />
          <Route path="/edit/:id" element={ <RequireAuth><div className="max-w-4xl mx-auto"><CreatePost /></div></RequireAuth> } />
        </Routes>
      </main>
    </div>
  )
}

export default App