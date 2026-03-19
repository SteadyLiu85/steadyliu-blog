import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Hash } from 'lucide-react'

function TagCloud() {
  const [tagData, setTagData] = useState([])

  useEffect(() => {
    axios.get('/api/tags')
      .then(res => setTagData(res.data))
      .catch(err => console.error(err))
  }, [])

  const getTagDynamicStyle = (count) => {
    if (count > 10) return 'text-7xl font-black text-gray-900 dark:text-white drop-shadow-xl dark:drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] opacity-100 hover:text-blue-600 dark:hover:text-cyan-300'
    if (count > 5)  return 'text-5xl font-extrabold text-blue-600 dark:text-cyan-400 opacity-95 hover:text-blue-800 dark:hover:text-white'
    if (count > 2)  return 'text-3xl font-bold text-blue-500 dark:text-blue-300 opacity-90'
    return 'text-xl font-medium text-gray-500 dark:text-gray-400 opacity-70 hover:text-blue-500 dark:hover:text-blue-200'
  }

  return (
    <div className="max-w-7xl mx-auto p-8 pb-24 text-left">
      
      <header className="mb-16">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500 mb-2 transition-colors">
            <Hash size={24} strokeWidth={2.5} />
            <span className="font-mono text-sm tracking-[0.3em] uppercase">Semantic Nodes</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white border-l-4 border-blue-500 pl-4 uppercase tracking-tighter transition-colors">
          Technical Tags / <span className="text-blue-500 font-mono italic">云</span>
        </h1>
      </header>

      <div className="min-h-[600px] flex flex-wrap items-center justify-center gap-x-16 gap-y-24 bg-white/60 dark:bg-gray-950/60 backdrop-blur-3xl p-10 md:p-20 rounded-[4rem] border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden transition-colors duration-500">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] pointer-events-none transition-colors duration-500"></div>

        {tagData.map((tag) => {
          // 生成随机旋转
          const rotation = (Math.random() * 16 - 8).toFixed(2);
          
          return (
            <Link 
              key={tag._id} 
              to={`/tags/${encodeURIComponent(tag._id)}`}
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`transition-all duration-500 ease-out hover:scale-125 hover:!rotate-0 hover:z-20 cursor-pointer inline-block ${getTagDynamicStyle(tag.count)}`}
            >
              <span className="relative inline-block tracking-tight">
                 {tag._id}
                 
                 <span className="absolute -right-4 -top-2 md:-right-6 md:-top-4 translate-x-1/2 flex items-center justify-center min-w-[20px] md:min-w-[24px] h-[20px] md:h-[24px] px-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border-2 border-white dark:border-gray-950 text-[10px] md:text-[11px] font-mono font-black text-blue-600 dark:text-cyan-500 shadow-sm transition-colors duration-500">
                   {tag.count}
                 </span>
              </span>
            </Link>
          );
        })}

        {/* 加载状态 */}
        {tagData.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 relative z-10">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-500 font-mono tracking-widest">SYNCHRONIZING TAGS...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TagCloud