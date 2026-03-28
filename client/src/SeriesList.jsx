import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Library, Clock, Milestone, Infinity as InfinityIcon, Layers } from 'lucide-react'

function SeriesList() {
  const [seriesStats, setSeriesStats] = useState([])

  useEffect(() => {
    axios.get('/api/series/stats').then(res => setSeriesStats(res.data)).catch(err => console.error(err))
  },[])

  const formatTime = (dateString) => {
    if (!dateString) return 'NO REC';
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'TODAY';
    if (diffDays <= 7) return `${diffDays}D AGO`;
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="text-left mb-24">
      <header className="mb-16 border-b-4 border-theme-border pb-6">
        <h1 className="text-5xl font-black text-theme-text-primary flex items-center gap-4 tracking-tighter uppercase">
          <Library size={40} strokeWidth={3} className="text-theme-accent" />
          Series Collection
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seriesStats.map((item) => {
          const isLongTerm = item.total === 0;
          const progress = isLongTerm ? 0 : Math.min(Math.round((item.current / item.total) * 100), 100);
          
          return (
            <Link key={item.name} to={`/series/${encodeURIComponent(item.name)}`}>
              <div className="bg-theme-surface border-4 border-theme-border p-8 rounded-2xl shadow-brutal hover:shadow-brutal-lg hover:-translate-y-2 hover:-translate-x-2 transition-all duration-200 min-h-[280px] flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black font-mono uppercase tracking-widest px-3 py-1 rounded-lg border-2 border-theme-border shadow-brutal-sm mb-4 ${
                        isLongTerm ? 'bg-theme-surface text-theme-text-primary' : 'bg-theme-accent text-white'
                      }`}>
                        {isLongTerm ? <InfinityIcon size={14} strokeWidth={3}/> : <Milestone size={14} strokeWidth={3}/>}
                        {isLongTerm ? 'Continuous' : 'Targeted'}
                      </span>
                      <h2 className="text-3xl font-black text-theme-text-primary leading-tight">
                        {item.name}
                      </h2>
                    </div>
                    <Layers size={28} strokeWidth={2.5} className="text-theme-text-primary" />
                  </div>

                  {!isLongTerm ? (
                    <div className="mt-4 bg-theme-base border-2 border-theme-border p-4 rounded-xl shadow-inner">
                      <div className="flex justify-between text-xs font-black font-mono uppercase mb-2 text-theme-text-primary">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-theme-surface border-2 border-theme-border rounded-md overflow-hidden">
                        <div className="h-full bg-theme-accent" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 bg-theme-base border-2 border-theme-border p-4 rounded-xl border-dashed">
                      <p className="text-theme-text-secondary font-bold text-sm leading-relaxed">
                        该系列处于长期更新状态
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mt-8 border-t-2 border-theme-border pt-6">
                  <div className="font-mono font-black">
                    <p className="text-theme-text-secondary uppercase text-[10px] tracking-widest mb-1">Articles</p>
                    <p className="text-theme-text-primary text-2xl flex items-baseline gap-1">
                      {item.current} 
                      <span className="text-theme-text-secondary text-base mx-1">/</span> 
                      {isLongTerm ? <span className="text-xl">∞</span> : <span className="text-xl">{item.total}</span>}
                    </p>
                  </div>
                  <div className="text-right font-mono font-black">
                    <p className="text-theme-text-secondary uppercase text-[10px] tracking-widest mb-1">Updated</p>
                    <p className="text-theme-text-primary text-sm flex items-center justify-end gap-1.5 bg-theme-base border-2 border-theme-border px-2 py-1 rounded-md shadow-brutal-sm">
                      <Clock size={12} strokeWidth={3}/>
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