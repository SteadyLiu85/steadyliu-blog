import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Hash } from 'lucide-react'

const getStableRotation = (value) => {
  const seed = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return ((seed % 7) - 3).toFixed(2)
}

function TagCloud() {
  const[tagData, setTagData] = useState([])
  const containerRef = useRef(null)
  
  // 用于记录每个标签中心点坐标的映射
  const [positions, setPositions] = useState({})
  const[hoveredTag, setHoveredTag] = useState(null)
  const [connectedTargets, setConnectedTargets] = useState([])

  useEffect(() => {
    axios.get('/api/tags').then(res => setTagData(res.data)).catch(err => console.error(err))
  },[])

  // === 计算元素的绝对几何坐标 ===
  useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nodes = containerRef.current.querySelectorAll('[data-tag-id]');
      const newPos = {};
      nodes.forEach(n => {
        const nRect = n.getBoundingClientRect();
        // 计算相对于父容器的中心坐标
        newPos[n.dataset.tagId] = {
           x: nRect.left - rect.left + nRect.width / 2,
           y: nRect.top - rect.top + nRect.height / 2,
        };
      });
      setPositions(newPos);
    };

    // 延迟计算确保 DOM 渲染并排列完成
    const timer = setTimeout(calculatePositions, 300);
    window.addEventListener('resize', calculatePositions);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePositions);
    }
  }, [tagData]);

  // 当鼠标悬浮时触发连线逻辑
  const handleMouseEnter = (tagId, index) => {
    setHoveredTag(tagId);
    
    // 利用索引确定性的绑定 3 个伪随机关联标签
    const targets =[];
    if (tagData.length > 1) {
       targets.push(tagData[(index + 2) % tagData.length]._id);
       if (tagData.length > 3) targets.push(tagData[(index + 5) % tagData.length]._id);
       if (tagData.length > 5) targets.push(tagData[(index + tagData.length - 1) % tagData.length]._id);
    }
    // 过滤掉自己
    setConnectedTargets(targets.filter(t => t !== tagId));
  };

  const handleMouseLeave = () => {
    setHoveredTag(null);
    setConnectedTargets([]);
  };

  const getTagScale = (count) => {
    if (count > 10) return 'text-4xl px-8 py-4'
    if (count > 5)  return 'text-2xl px-6 py-3'
    if (count > 2)  return 'text-xl px-5 py-2'
    return 'text-lg px-4 py-2'
  }

  return (
    <div className="text-left mb-24">
      <header className="mb-16 border-b-4 border-theme-border pb-6">
        <h1 className="text-5xl font-black text-theme-text-primary flex items-center gap-4 tracking-tighter uppercase">
          <Hash size={40} strokeWidth={3} className="text-theme-accent" />
          Semantic Nodes
        </h1>
        <p className="mt-4 font-mono text-sm text-theme-text-secondary uppercase tracking-widest font-bold">
          [ Hover over nodes to reveal hidden architectural links ]
        </p>
      </header>

      <div 
        ref={containerRef}
        className="min-h-[600px] flex flex-wrap content-start items-center justify-center gap-8 bg-theme-surface p-12 md:p-24 rounded-sm border-4 border-theme-border shadow-brutal-lg relative"
      >
        {/* 标签连线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {hoveredTag && connectedTargets.map((targetId) => {
            const p1 = positions[hoveredTag];
            const p2 = positions[targetId];
            if (!p1 || !p2) return null;

            const midX = p1.x + (p2.x - p1.x) / 2;
            const pathD = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;

            return (
              <g key={targetId}>
                <path 
                  d={pathD} 
                  stroke="var(--color-border)" 
                  strokeWidth="3" 
                  fill="none" 
                  className="animate-draw-line" 
                />
                {/* 起点红色高亮，终点深色方块 */}
                <rect x={p1.x - 4} y={p1.y - 4} width="8" height="8" fill="var(--color-accent)" className="animate-draw-line" />
                <rect x={p2.x - 4} y={p2.y - 4} width="8" height="8" fill="var(--color-border)" className="animate-draw-line" />
              </g>
            );
          })}
        </svg>

        {/* 标签渲染 (设置较高的 z-index 防止被线挡住交互) */}
        {tagData.map((tag, index) => {
          const rotation = getStableRotation(tag._id)
          
          // 计算当前节点的透明度状态
          const isHovered = hoveredTag === tag._id;
          const isConnected = connectedTargets.includes(tag._id);
          const isFaded = hoveredTag && !isHovered && !isConnected;

          return (
            <Link 
              key={tag._id} 
              to={`/tags/${encodeURIComponent(tag._id)}`}
              data-tag-id={tag._id}
              onMouseEnter={() => handleMouseEnter(tag._id, index)}
              onMouseLeave={handleMouseLeave}
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`relative z-10 font-black uppercase bg-theme-base border-4 border-theme-border shadow-brutal hover:shadow-brutal-lg hover:scale-110 active:active-brutal transition-all duration-300 cursor-pointer flex items-center gap-3 ${getTagScale(tag.count)}
                ${isHovered ? 'bg-theme-accent text-white border-theme-border z-20 !rotate-0' : 'text-theme-text-primary'}
                ${isConnected ? '!border-theme-accent !rotate-0 z-20' : ''}
                ${isFaded ? 'opacity-20 grayscale' : 'opacity-100'}
              `}
            >
              <span>{tag._id}</span>
              <span className={`px-2 py-0.5 text-sm shadow-brutal-sm font-mono border-2 border-theme-border
                ${isHovered ? 'bg-theme-surface text-theme-text-primary' : 'bg-theme-accent text-white'}`}
              >
                {tag.count}
              </span>
            </Link>
          );
        })}

        {tagData.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-20 z-10 relative">
            <div className="w-16 h-16 border-8 border-theme-border border-t-theme-accent rounded-full animate-spin"></div>
            <p className="text-theme-text-primary font-black font-mono tracking-widest text-xl">LOADING TAGS...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TagCloud
