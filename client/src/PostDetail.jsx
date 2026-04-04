import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
// [新增] 引入 remarkGfm
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css' 

const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]+/g, '');

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
  const[scrollProgress, setScrollProgress] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`/api/posts/${id}`).then(res => setPost(res.data)).catch(err => console.error(err))
  }, [id])

  const generateTOC = (text) => {
    const toc =[];
    text.split('\n').forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const rawTitle = match[2].trim();
        const cleanTitle = rawTitle.replace(/[*`_]/g, ''); 
        toc.push({ level: match[1].length, title: cleanTitle, id: slugify(cleanTitle) });
      }
    });
    return toc;
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setScrollProgress((window.scrollY / totalHeight) * 100);

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const headings = Array.from(document.querySelectorAll('article h2, article h3'));
          if (headings.length > 0) {
            let currentId = headings[0].id;
            const threshold = window.innerHeight * 0.4; 
            for (let i = 0; i < headings.length; i++) {
              const top = headings[i].getBoundingClientRect().top;
              if (top < threshold) { currentId = headings[i].id; } else { break; }
            }
            setActiveId(currentId);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    const initialTimer = setTimeout(handleScroll, 300); 
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(initialTimer); };
  }, [post]);

  if (!post) return <div className="font-mono font-black text-2xl uppercase p-20 text-center text-theme-text-primary">RUNNING...</div>

  const tocEntries = generateTOC(post.content);

  const renderAsciiProgress = () => {
    const totalChars = 15; 
    const filledChars = Math.min(totalChars, Math.max(0, Math.round((scrollProgress / 100) * totalChars)));
    const emptyChars = totalChars - filledChars;
    return '█'.repeat(filledChars) + '░'.repeat(emptyChars);
  };

  return (
    <div className="w-full pb-24 text-left relative">
      
      {scrollProgress > 2 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50 bg-theme-surface border-2 border-theme-border w-14 h-14 shadow-brutal hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-brutal-sm active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all font-mono group flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center text-theme-text-primary text-lg font-black group-hover:-translate-y-full transition-transform duration-300">
            {Math.round(scrollProgress)}<span className="text-[10px]">%</span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-theme-surface bg-theme-text-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-xl leading-none">↑</span>
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Top</span>
          </div>
        </button>
      )}

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 items-start relative">
        <article className="w-full lg:w-[75%] bg-theme-surface border-2 border-theme-border rounded-sm shadow-brutal min-h-screen flex flex-col min-w-0">
          <header className="border-b-2 border-theme-border p-8 md:p-12 bg-theme-base/30">
            <button onClick={() => navigate(-1)} className="font-mono text-xs font-bold text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-2 mb-8 transition-colors">
              <ArrowLeft size={14} strokeWidth={3} /> BACK TO INDEX
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-theme-text-primary tracking-tight leading-tight mb-6 break-words whitespace-normal">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-4 font-mono text-xs font-bold uppercase text-theme-text-primary">
              <span className="border-2 border-theme-border px-2 py-1 bg-theme-surface cursor-default shadow-brutal-sm">DATE: {new Date(post.createdAt).toLocaleDateString()}</span>
              {post.series && (
                <Link to={`/series/${encodeURIComponent(post.series)}`} className="border-2 border-theme-border px-2 py-1 bg-theme-accent text-white shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:active-brutal-sm transition-all">
                  CAT: {post.series}
                </Link>
              )}
              {post.tags?.map(t => (
                <Link key={t} to={`/tags/${encodeURIComponent(t)}`} className="border-2 border-theme-border px-2 py-1 bg-theme-base shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 hover:bg-theme-surface active:active-brutal-sm transition-all">
                  #{t}
                </Link>
              ))}
            </div>
          </header>
          
          <div className="w-full h-1.5 bg-theme-border/10">
            <div className="h-full bg-theme-accent transition-all duration-100 ease-out" style={{ width: `${scrollProgress}%` }} />
          </div>

          <div className="p-8 md:p-12 text-theme-text-primary font-medium flex-1 overflow-hidden">
            <ReactMarkdown 
              // [新增] 引入 remarkGfm 处理表格
              remarkPlugins={[remarkMath, remarkGfm]} 
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                h2: ({node, ...props}) => {
                  const text = extractText(props.children);
                  return <h2 id={slugify(text)} className="text-2xl md:text-3xl font-black mt-16 mb-6 pb-2 border-b-2 border-theme-border break-words" {...props} />
                },
                h3: ({node, ...props}) => {
                  const text = extractText(props.children);
                  return <h3 id={slugify(text)} className="text-xl font-black mt-10 mb-4 flex items-center gap-2 before:content-['::'] before:text-theme-accent break-words" {...props} />
                },
                p: ({node, ...props}) => <p className="text-[17px] leading-8 mb-6 break-words" {...props} />,
                ul: ({node, ...props}) => <ul className="list-square list-inside space-y-2 mb-6 text-[17px] ml-4 marker:text-theme-text-primary break-words" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-6 text-[17px] ml-4 font-bold break-words" {...props} />,
                
                // [新增] 粗野风表格
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-10 border-4 border-theme-border shadow-brutal rounded-sm">
                    <table className="w-full text-left border-collapse bg-theme-surface" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-theme-base border-b-4 border-theme-border" {...props} />,
                tbody: ({node, ...props}) => <tbody className="divide-y-2 divide-theme-border" {...props} />,
                tr: ({node, ...props}) => <tr className="hover:bg-theme-hover transition-colors" {...props} />,
                th: ({node, ...props}) => <th className="p-4 md:p-6 font-black text-theme-text-primary border-r-2 border-theme-border last:border-r-0 uppercase tracking-widest text-sm whitespace-nowrap" {...props} />,
                td: ({node, ...props}) => <td className="p-4 md:p-6 font-bold border-r-2 border-theme-border last:border-r-0" {...props} />,

                // [更新] 对行内短代码和多行代码块进行严格的样式剥离
                code: ({node, className, ...props}) => {
                  // 如果有 language-xxx 类名，说明这是一个多行代码块里面的 code（已经被外层 pre 处理过背景了）
                  const match = /language-(\w+)/.exec(className || '');
                  if (!match) {
                    // 没有 language 属性，说明它是行内短代码 (Inline Code) `test`
                    return <code className="font-mono text-[0.85em] bg-theme-base border-2 border-theme-border px-2 py-0.5 rounded-sm mx-1 font-black text-theme-accent shadow-[2px_2px_0_0_var(--color-border)] break-words" {...props} />
                  }
                  // 多行代码块，交给 highlight.js 渲染
                  return <code className={className} {...props} />
                },

                pre: ({node, ...props}) => {
                  const childProps = props.children?.props;
                  const className = childProps?.className || '';
                  const match = /language-(\w+)/.exec(className);
                  const language = match ? match[1] : '';

                  return (
                    <div className="my-8 border-2 border-theme-border rounded-sm overflow-hidden shadow-brutal-sm">
                      <div className="h-10 border-b-2 border-theme-border bg-theme-base flex items-center justify-between px-4">
                        <div className="flex items-center">
                          <span className="bg-theme-accent text-white border-2 border-theme-border px-3 py-1 text-[10px] font-black font-mono uppercase tracking-widest shadow-brutal-sm -translate-y-0.5">
                            {language || 'CODE'}
                          </span>
                        </div>
                        <div className="flex gap-1.5 opacity-80">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-theme-border bg-[#FF5F56]"></div>
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-theme-border bg-[#FFBD2E]"></div>
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-theme-border bg-[#27C93F]"></div>
                        </div>
                      </div>
                      <pre className="p-6 bg-[#0E0F0E] text-gray-300 text-sm leading-relaxed overflow-x-auto" {...props} />
                    </div>
                  );
                },
                
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-accent bg-theme-base/50 p-6 my-8 font-mono text-sm leading-relaxed text-theme-text-secondary break-words" {...props} />,
                a: ({node, ...props}) => <a className="text-theme-text-primary border-b-2 border-theme-text-primary hover:bg-theme-text-primary hover:text-theme-surface transition-colors break-words" {...props} />,
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

        <aside className="hidden lg:block w-[25%] sticky top-24">
          <div className="bg-theme-surface border-2 border-theme-border p-6 rounded-sm shadow-brutal-sm flex flex-col gap-6">
            
            <div className="bg-theme-base border-2 border-theme-border p-4 shadow-inner">
              <div className="flex justify-between items-end mb-2">
                <span className="font-mono text-[10px] font-black uppercase text-theme-text-secondary tracking-widest">
                  READING STATUS
                </span>
                <span className="font-mono text-xs font-black text-theme-text-primary">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
              <div className="font-mono text-theme-accent text-sm tracking-[0.1em] whitespace-nowrap overflow-hidden">[{renderAsciiProgress()}]
              </div>
            </div>

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