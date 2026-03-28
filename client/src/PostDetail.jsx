import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css' 

// --- 工具函数：生成干净的 ID ---
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]+/g, '');

// --- 工具函数：深度提取 React 子组件中的纯文本 ---
// 完美解决 Markdown 标题中含有 `代码块` 或 **加粗** 时，生成的 ID 不匹配导致锚点失效的 Bug
const extractText = (children) => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (typeof children === 'object' && children !== null && children.props) {
    return extractText(children.props.children);
  }
  return '';
};

function PostDetail() {
  const { id } = useParams()
  const[post, setPost] = useState(null)
  const [activeId, setActiveId] = useState('') 
  const [scrollProgress, setScrollProgress] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`/api/posts/${id}`).then(res => setPost(res.data)).catch(err => console.error(err))
  }, [id])

  // --- 解析 Markdown 生成侧边栏目录 ---
  const generateTOC = (text) => {
    const toc =[];
    text.split('\n').forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const rawTitle = match[2].trim();
        const cleanTitle = rawTitle.replace(/[*`_]/g, ''); // 移除标记符
        toc.push({ level: match[1].length, title: cleanTitle, id: slugify(cleanTitle) });
      }
    });
    return toc;
  };

  // --- 全局滚动监听：进度计算 & 目录高亮 (Scroll Spy) ---
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      // 1. 计算全局阅读进度百分比
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // 2. 计算当前激活的目录项
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const headings = Array.from(document.querySelectorAll('article h2, article h3'));
          if (headings.length > 0) {
            let currentId = headings[0].id;
            // 将判定阈值放宽到屏幕向下 40% 的位置，解决长屏幕下不触发的问题
            const threshold = window.innerHeight * 0.4; 
            
            for (let i = 0; i < headings.length; i++) {
              const top = headings[i].getBoundingClientRect().top;
              if (top < threshold) {
                currentId = headings[i].id;
              } else {
                break; // 越过检测线则停止遍历
              }
            }
            setActiveId(currentId);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    const initialTimer = setTimeout(handleScroll, 300); // 延迟触发一次保证初始化
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(initialTimer);
    };
  }, [post]);

  if (!post) return <div className="font-mono font-black text-2xl uppercase p-20 text-center text-theme-text-primary">RUNNING...</div>

  const tocEntries = generateTOC(post.content);

  // --- 终端风 ASCII 进度条渲染逻辑 ---
  const renderAsciiProgress = () => {
    const totalChars = 15; // 进度条总格数
    const filledChars = Math.min(totalChars, Math.max(0, Math.round((scrollProgress / 100) * totalChars)));
    const emptyChars = totalChars - filledChars;
    return '█'.repeat(filledChars) + '░'.repeat(emptyChars);
  };

  return (
    <div className="w-full pb-24 text-left relative">
      
      {/* 悬浮进度徽章 / 回到顶部按钮 (终端风互动方块) */}
      {scrollProgress > 2 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50 bg-theme-surface border-2 border-theme-border w-14 h-14 shadow-brutal hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-brutal-sm active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all font-mono group flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        >
          {/* 默认状态：显示百分比 */}
          <div className="absolute inset-0 flex items-center justify-center text-theme-text-primary text-lg font-black group-hover:-translate-y-full transition-transform duration-300">
            {Math.round(scrollProgress)}<span className="text-[10px]">%</span>
          </div>
          {/* 悬浮状态：显示向上箭头 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-theme-surface bg-theme-text-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-xl leading-none">↑</span>
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Top</span>
          </div>
        </button>
      )}

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* === 左侧：核心正文区 === */}
        <article className="w-full lg:w-[75%] bg-theme-surface border-2 border-theme-border rounded-sm shadow-brutal min-h-screen flex flex-col">
          
          <header className="border-b-2 border-theme-border p-8 md:p-12 bg-theme-base/30">
            <button onClick={() => navigate(-1)} className="font-mono text-xs font-bold text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-2 mb-8 transition-colors">
              <ArrowLeft size={14} strokeWidth={3} /> BACK TO INDEX
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-theme-text-primary tracking-tight leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-4 font-mono text-xs font-bold uppercase text-theme-text-primary">
              <span className="border-2 border-theme-border px-2 py-1 bg-theme-surface shadow-brutal-sm cursor-default">
                DATE: {new Date(post.createdAt).toLocaleDateString()}
              </span>
              
              {post.series && (
                <Link 
                  to={`/series/${encodeURIComponent(post.series)}`}
                  className="border-2 border-theme-border px-2 py-1 bg-theme-accent text-white shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all"
                >
                  CAT: {post.series}
                </Link>
              )}
              
              {post.tags?.map(t => (
                <Link 
                  key={t} 
                  to={`/tags/${encodeURIComponent(t)}`}
                  className="border-2 border-theme-border px-2 py-1 bg-theme-base shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 hover:bg-theme-surface active:active-brutal-sm transition-all"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </header>
          
          <div className="p-8 md:p-12 text-theme-text-primary font-medium flex-1">
            <ReactMarkdown 
              remarkPlugins={[remarkMath]} 
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                h2: ({node, ...props}) => {
                  const text = extractText(props.children);
                  const id = slugify(text);
                  return <h2 id={id} className="text-2xl md:text-3xl font-black mt-16 mb-6 pb-2 border-b-2 border-theme-border" {...props} />
                },
                h3: ({node, ...props}) => {
                  const text = extractText(props.children);
                  const id = slugify(text);
                  return <h3 id={id} className="text-xl font-black mt-10 mb-4 flex items-center gap-2 before:content-['::'] before:text-theme-accent" {...props} />
                },
                p: ({node, ...props}) => <p className="text-[17px] leading-8 mb-6" {...props} />,
                ul: ({node, ...props}) => <ul className="list-square list-inside space-y-2 mb-6 text-[17px] ml-4 marker:text-theme-text-primary" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-6 text-[17px] ml-4 font-bold" {...props} />,
                pre: ({node, ...props}) => (
                  <div className="my-8 border-2 border-theme-border rounded-sm overflow-hidden shadow-brutal-sm">
                    <div className="h-8 border-b-2 border-theme-border bg-theme-base flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-theme-border bg-[#FF5F56]"></div>
                      <div className="w-3 h-3 rounded-full border-2 border-theme-border bg-[#FFBD2E]"></div>
                      <div className="w-3 h-3 rounded-full border-2 border-theme-border bg-[#27C93F]"></div>
                    </div>
                    <pre className="p-6 bg-[#0E0F0E] text-gray-300 text-sm leading-relaxed overflow-x-auto" {...props} />
                  </div>
                ),
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-accent bg-theme-base/50 p-6 my-8 font-mono text-sm leading-relaxed text-theme-text-secondary" {...props} />,
                a: ({node, ...props}) => <a className="text-theme-text-primary border-b-2 border-theme-text-primary hover:bg-theme-text-primary hover:text-theme-surface transition-colors" {...props} />,
                code: ({node, inline, ...props}) => inline ? <code className="font-mono text-sm bg-theme-base border border-theme-border px-1.5 py-0.5 rounded-sm mx-1" {...props} /> : <code {...props} />
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          <footer className="border-t-2 border-theme-border p-8 bg-theme-base/30 flex justify-between items-center">
            <Link to={`/edit/${post._id}`} className="font-mono text-xs font-bold border-2 border-theme-border px-4 py-2 flex items-center gap-2 bg-theme-surface shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all text-theme-text-primary">
              <Edit3 size={14} strokeWidth={3} /> EDIT
            </Link>
            <div className="font-mono text-[10px] font-bold text-theme-text-secondary uppercase">
              STATUS: SECURE EXECUTED
            </div>
          </footer>
        </article>

        {/* === 右侧：固定侧边栏 === */}
        <aside className="hidden lg:block w-[25%] sticky top-24">
          <div className="bg-theme-surface border-2 border-theme-border p-6 rounded-sm shadow-brutal-sm flex flex-col gap-6">
            
            {/* 终端风格的阅读进度可视化 */}
            <div className="bg-theme-base border-2 border-theme-border p-4 shadow-inner">
              <div className="flex justify-between items-end mb-2">
                <span className="font-mono text-[10px] font-black uppercase text-theme-text-secondary tracking-widest">
                  READING STATUS
                </span>
                <span className="font-mono text-xs font-black text-theme-text-primary">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
              {/* ASCII 码组成的伪终端进度条 */}
              <div className="font-mono text-theme-accent text-sm tracking-[0.1em] whitespace-nowrap overflow-hidden">[{renderAsciiProgress()}]
              </div>
            </div>

            {/* 目录索引 */}
            <div>
              <div className="font-mono text-xs font-black uppercase text-theme-text-primary mb-4 border-b-2 border-theme-border pb-2">
                [ INDEX ]
              </div>
              <nav className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-theme-border scrollbar-track-transparent">
                {tocEntries.map((item, index) => {
                  const isActive = activeId === item.id;
                  return (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(decodeURIComponent(item.id)) || document.getElementById(item.id);
                        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
                      }}
                      className={`font-mono text-xs transition-colors py-1.5 block w-full truncate ${
                        isActive ? 'font-bold text-theme-text-primary bg-theme-base border-l-2 border-theme-accent pl-2' : 'text-theme-text-secondary hover:text-theme-text-primary pl-3'
                      }`}
                      style={{ marginLeft: item.level === 3 ? '1rem' : '0', width: item.level === 3 ? 'calc(100% - 1rem)' : '100%' }}
                      title={item.title}
                    >
                      {item.title}
                    </a>
                  );
                })}
              </nav>
            </div>

          </div>
        </aside>

      </div>
    </div>
  )
}

export default PostDetail