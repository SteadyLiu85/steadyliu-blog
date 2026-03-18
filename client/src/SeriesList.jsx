import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
// --- 1. 引入图标 ---
import { 
  Library, 
  Clock, 
  Milestone, 
  Infinity as InfinityIcon, 
  Layers 
} from 'lucide-react'

function SeriesList() {
  const [seriesStats, setSeriesStats] = useState([])

  useEffect(() => {
    axios.get('http://localhost:5000/api/series/stats')
      .then(res => setSeriesStats(res.data))
      .catch(err => console.error("获取统计数据失败:", err))
  }, [])

  const formatTime = (dateString) => {
    if (!dateString) return '暂无记录';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '今日更新';
    if (diffDays <= 7) return `${diffDays} 天前更新`;
    return date.toLocaleDateString();
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pb-24 text-left">
      <header className="mb-16">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500 mb-2 transition-colors">
            <Library size={24} strokeWidth={2.5} />
            <span className="font-mono text-sm tracking-[0.3em] uppercase">Knowledge Base</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white border-l-4 border-blue-500 pl-4 uppercase tracking-tighter transition-colors">
          Collections / <span className="text-blue-500 font-mono italic">合集</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seriesStats.map((item) => {
          const isLongTerm = item.total === 0;
          const progress = isLongTerm ? 0 : Math.min(Math.round((item.current / item.total) * 100), 100);
          
          return (
            <Link key={item.name} to={`/series/${encodeURIComponent(item.name)}`}>
              {/* 🟢 适配点：白天白底磨砂，夜晚深灰底磨砂 */}
              <div className="group relative bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 rounded-3xl hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-gray-800/40 transition-all duration-500 shadow-sm hover:shadow-xl dark:shadow-2xl overflow-hidden min-h-[260px] flex flex-col justify-between text-left">
                
                {/* 装饰性背景 */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[80px] opacity-10 group-hover:opacity-30 transition-all ${isLongTerm ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      {/* 🟢 适配点：标签徽章的颜色适配 */}
                      <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded mb-3 border transition-colors ${
                        isLongTerm 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                      }`}>
                        {isLongTerm ? <InfinityIcon size={12} /> : <Milestone size={12} />}
                        {isLongTerm ? 'Continuous' : 'Targeted'}
                      </span>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h2>
                    </div>
                    <Layers size={24} className="text-gray-300 dark:text-gray-700 group-hover:text-blue-500 transition-colors" />
                  </div>

                  {!isLongTerm ? (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-mono mb-2">
                        <span className="text-gray-500 uppercase tracking-tighter transition-colors">Completion Rate</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold transition-colors">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden transition-colors">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 py-3 border-y border-gray-100 dark:border-gray-800/30 transition-colors">
                      <p className="text-gray-500 dark:text-gray-500 text-xs italic font-mono leading-relaxed transition-colors">
                        该领域处于持续更新状态，旨在记录零散的技术笔记与心得。
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mt-8">
                  <div className="font-mono">
                    <p className="text-gray-400 dark:text-gray-600 uppercase text-[9px] mb-1 transition-colors">Articles</p>
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-lg flex items-baseline gap-1 transition-colors">
                      {item.current} 
                      <span className="text-gray-300 dark:text-gray-600 font-light text-sm transition-colors">/</span> 
                      {isLongTerm ? <span className="text-emerald-500 text-sm">∞</span> : <span className="text-sm">{item.total}</span>}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-gray-400 dark:text-gray-600 uppercase text-[9px] mb-1 transition-colors">Latest Activity</p>
                    <p className="text-blue-600/80 dark:text-blue-400/80 text-xs flex items-center justify-end gap-1.5 font-semibold transition-colors">
                      <Clock size={12} />
                      {formatTime(item.lastUpdate)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  )
}

export default SeriesList