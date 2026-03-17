import { Routes, Route, NavLink } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import PostList from './PostList'
import CreatePost from './CreatePost'
import PostDetail from './PostDetail'
import FilteredPosts from './FilteredPosts'
import SeriesList from './SeriesList'
import TagCloud from './TagCloud'
import About from './About'

import { Home, FolderOpen, Tag, User, Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTheme } from './ThemeContext' 

function App() {
  const { theme, updateTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

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
        
        {/* 🌓 主题切换下拉菜单 */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-[100]" ref={menuRef}>
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
            <Route path="/create" element={<div className="max-w-4xl mx-auto"><CreatePost /></div>} />
            <Route path="/edit/:id" element={<div className="max-w-4xl mx-auto"><CreatePost /></div>} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/series" element={<div className="max-w-4xl mx-auto"><SeriesList /></div>} />
            <Route path="/tags" element={<div className="max-w-4xl mx-auto"><TagCloud /></div>} />
            <Route path="/about" element={<div className="max-w-4xl mx-auto"><About /></div>} />
            <Route path="/series/:name" element={<FilteredPosts type="series" />} />
            <Route path="/tags/:name" element={<FilteredPosts type="tag" />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App