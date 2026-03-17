import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

// --- 图标与渲染核心 ---
import { 
  ArrowLeft, 
  Calendar, 
  FolderOpen, 
  Edit3, 
  Hash, 
  Layers,
  Clock
} from 'lucide-react'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css' 

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // 空格转连字符
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '') // 核心：删掉括号、斜杠等特殊字符，保留中文
};

function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [activeId, setActiveId] = useState('') 
  const [scrollProgress, setScrollProgress] = useState(0)
  const navigate = useNavigate()

  // 1. 获取数据
  useEffect(() => {
    axios.get(`http://localhost:5000/api/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(err => console.error(err))
  }, [id])

  // 2. 阅读进度监听
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. 目录生成逻辑
  const generateTOC = (text) => {
    const toc = [];
    text.split('\n').forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const title = match[2].trim();
        toc.push({ level: match[1].length, title, id: slugify(title) });
      }
    });
    return toc;
  };

  // 4. 滚动追踪
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-10% 0% -45% 0%' }
    );
    document.querySelectorAll('h2, h3').forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  if (!post) return <div className="text-gray-900 dark:text-white p-20 text-center font-mono animate-pulse uppercase">Knowledge Synchronizing...</div>

  const tocEntries = generateTOC(post.content);

  return (
    <div className="w-full pb-24 px-4 md:px-10 relative">
      
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 w-full h-1 z-[70] bg-transparent text-left">
        <div 
          className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6] transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>

      <div className="max-w-[1800px] mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="group text-blue-500 hover:text-blue-400 font-bold my-8 flex items-center gap-2 transition-all"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          返回列表
        </button>

        <div className="flex flex-col lg:flex-row-reverse w-full gap-12 items-start relative text-left">
          
          {/* --- 正文区域：85% 宽度 --- */}
          <div className="lg:w-[85%] w-full min-w-0">
            {/* 加上了 bg-white dark:bg-gray-900/30 让白天模式有个白底卡片 */}
            <article className="bg-white/80 dark:bg-gray-900/30 backdrop-blur-2xl p-8 md:p-16 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden transition-colors duration-500">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 blur-[120px] pointer-events-none"></div>

              <header className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-10">
                {/* 加上了 text-gray-900 dark:text-white */}
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-tight transition-colors">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap gap-8 text-base items-center text-gray-500 font-mono">
                  <span className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500/60" /> 
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  
                  {post.series && post.series !== '未分类' && (
                    <Link 
                      to={`/series/${encodeURIComponent(post.series)}`}
                      className="group flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all"
                    >
                      <FolderOpen size={16} />
                      <span className="font-bold tracking-wider">{post.series}</span>
                    </Link>
                  )}

                  <div className="flex gap-4">
                    {post.tags?.map(tag => (
                      <Link 
                        key={tag} 
                        to={`/tags/${encodeURIComponent(tag)}`}
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all group/tag"
                      >
                        <Hash size={14} className="opacity-40 group-hover/tag:opacity-100" />
                        <span>{tag}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </header>
              

              <div className="text-gray-700 dark:text-gray-300 transition-colors">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={{
                    h2: ({node, ...props}) => {
                      const id = slugify(props.children.toString());
                      // 加上 text-gray-900 dark:text-white
                      return <h2 id={id} className="text-4xl font-black text-gray-900 dark:text-white mt-16 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2 tracking-tight transition-colors" {...props} />
                    },
                    h3: ({node, ...props}) => {
                      const id = slugify(props.children.toString());
                      // 加上 text-blue-600 dark:text-blue-300
                      return <h3 id={id} className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-10 mb-4 transition-colors" {...props} />
                    },
                    p: ({node, ...props}) => <p className="text-xl leading-[1.8] mb-8 text-gray-700 dark:text-gray-300 transition-colors" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-3 mb-8 text-xl" {...props} />,
                    pre: ({node, ...props}) => <pre className="rounded-2xl p-8 bg-gray-900 border border-gray-800 my-10 overflow-x-auto shadow-inner" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 bg-blue-500/5 p-6 italic my-10 rounded-r-2xl text-xl" {...props} />
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              <footer className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <Link 
                    to={`/edit/${post._id}`} 
                    className="group flex items-center gap-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-8 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all font-black text-sm tracking-widest shadow-xl"
                  >
                    <Edit3 size={18} className="text-blue-500" /> EDIT POST
                  </Link>
                  <div className="text-gray-500 dark:text-gray-600 text-[10px] font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    Finalized <Clock size={14} />
                  </div>
              </footer>
            </article>
          </div>

          <aside className="hidden lg:block lg:w-[15%] sticky top-24 self-start">
            <div className="border-r border-gray-200 dark:border-gray-800/40 pr-6 text-left max-h-[calc(100vh-120px)] overflow-y-auto 
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/50
              transition-colors">
              <div className="text-blue-500 mb-10 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                <Layers size={16} strokeWidth={3} /> CONTENTS
              </div>
              <nav className="flex flex-col gap-">
                {tocEntries.map((item, index) => {
                  const isActive = activeId === item.id;
                  
                  // 🟢 完美修复：用 Tailwind 类名接管颜色，摒弃内联 style
                  const colorClass = isActive 
                    ? 'text-blue-500 font-bold' 
                    : (item.level === 2 ? 'text-gray-900 dark:text-white font-black' : 'text-gray-500 dark:text-gray-400 font-medium');

                  return (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const targetId = decodeURIComponent(item.id);
                        const target = document.getElementById(targetId) || document.getElementById(item.id);
                        if (target) {
                          const top = target.getBoundingClientRect().top + window.pageYOffset - 100;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      }}
                      // 🟢 把 colorClass 拼接到 className 里
                      className={`transition-all duration-200 block w-full cursor-pointer leading-tight py-1 ${
                        isActive ? 'translate-x-2' : 'hover:opacity-70'
                      } ${colorClass}`}
                      style={{ 
                        // 删掉了写死的 color: textColor
                        fontSize: item.level === 2 ? '15px' : '13px',
                        textTransform: 'none',
                        marginLeft: item.level === 3 ? '1.5rem' : '0px',
                        display: 'block',
                        textDecoration: 'none',
                        whiteSpace: 'normal',
                        fontStyle: 'normal'
                      }}
                    >
                      {item.level === 3 && <span className="mr-2 opacity-30">•</span>}
                      {item.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default PostDetail