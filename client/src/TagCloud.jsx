import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function TagCloud() {
  const [tagData, setTagData] = useState([])

  useEffect(() => {
    axios.get('http://localhost:5000/api/tags').then(res => setTagData(res.data))
  }, [])

  // 动态样式映射：内容越多，颜色越亮，字号越大，发光越强
  const getTagDynamicStyle = (count) => {
    if (count > 10) return 'text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] opacity-100 hover:text-cyan-300'
    if (count > 5)  return 'text-5xl font-extrabold text-cyan-400 opacity-95 hover:text-white'
    if (count > 2)  return 'text-3xl font-bold text-blue-300 opacity-90'
    // 最小标签：提升至 text-xl 和 text-gray-300，确保清晰可见
    return 'text-xl font-medium text-gray-300 opacity-70 hover:text-blue-200'
  }

  return (
    <div className="max-w-7xl mx-auto p-8 pb-24">
      <h1 className="text-4xl font-black text-white mb-16 border-l-4 border-blue-500 pl-4 uppercase tracking-tighter">
        Technical Tags / <span className="text-blue-500 font-mono italic">云</span>
      </h1>

      {/* 核心云容器：深色背景 + 强磨砂 + 宽阔间距 */}
      <div className="min-h-[600px] flex flex-wrap items-center justify-center gap-x-16 gap-y-24 bg-gray-950/60 backdrop-blur-3xl p-20 rounded-[4rem] border border-gray-800 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* 背景光斑装饰 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 blur-[180px] pointer-events-none"></div>

        {tagData.map((tag) => {
          // 生成 -8 到 8 度之间的随机旋转，增加灵动感
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
                 {/* 增强型计数角标 */}
                 <sub className="absolute -right-7 -top-3 text-[12px] font-mono font-black text-cyan-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700 shadow-lg">
                   {tag.count}
                 </sub>
              </span>
            </Link>
          );
        })}

        {tagData.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-mono tracking-widest">SYNCHRONIZING TAGS...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TagCloud