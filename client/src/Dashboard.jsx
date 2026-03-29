import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Edit3, Trash2, Eye, EyeOff, Calendar, Loader2 } from 'lucide-react';

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    axios.get('/api/posts')
      .then(res => {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else {
          setPosts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPosts([]);
        setLoading(false); // 核心修复：就算报错也能关闭动画
      });
  };

  useEffect(() => { fetchPosts(); },[]);

  const handleDelete = async (id, title) => {
    if (window.confirm(`⚠️ PERMANENT DELETE: 《${title}》?`)) {
      try { 
        await axios.delete(`/api/posts/${id}`); 
        fetchPosts(); 
      } catch (err) { 
        alert('删除失败'); 
      }
    }
  };

  if (loading) return <div className="flex justify-center py-32 text-theme-text-primary font-black font-mono text-2xl uppercase"><Loader2 className="animate-spin mr-4" size={32} /> INITIALIZING...</div>;

  return (
    <div className="text-left mb-24">
      <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between border-b-4 border-theme-border pb-6 gap-6">
        <div>
          <h1 className="text-5xl font-black text-theme-text-primary flex items-center gap-4 tracking-tighter uppercase">
            <LayoutDashboard size={40} strokeWidth={3} className="text-theme-accent" />
            Control Panel
          </h1>
          <p className="text-theme-text-secondary font-mono font-bold text-sm mt-4 tracking-widest uppercase bg-theme-surface border-2 border-theme-border inline-block px-3 py-1 rounded-lg shadow-brutal-sm">
            Total Entities: {posts.length}
          </p>
        </div>
        <Link 
          to="/create"
          className="bg-theme-accent text-white border-2 border-theme-border px-6 py-3 rounded-xl font-black uppercase shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 hover:-translate-x-1 active:active-brutal transition-all"
        >
          + COMPOSE
        </Link>
      </header>

      <div className="bg-theme-surface border-4 border-theme-border rounded-2xl shadow-brutal-lg overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-theme-base text-theme-text-primary font-black font-mono uppercase tracking-widest border-b-4 border-theme-border">
              <th className="p-6 border-r-2 border-theme-border">TITLE</th>
              <th className="p-6 border-r-2 border-theme-border">STATUS</th>
              <th className="p-6 border-r-2 border-theme-border">SERIES</th>
              <th className="p-6 border-r-2 border-theme-border">DATE</th>
              <th className="p-6 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-theme-border font-bold">
            {posts.map((post) => (
              <tr key={post._id} className="hover:bg-theme-hover transition-colors">
                <td className="p-6 border-r-2 border-theme-border">
                  {/* 回档：使用 post._id */}
                  <Link to={`/post/${post._id}`} className="text-lg text-theme-text-primary hover:text-theme-accent transition-colors underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-theme-accent">
                    {post.title}
                  </Link>
                </td>
                <td className="p-6 border-r-2 border-theme-border">
                  {post.status === 'draft' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-theme-base border-2 border-theme-border text-theme-text-secondary text-xs font-black shadow-brutal-sm uppercase">
                      <EyeOff size={14} strokeWidth={3}/> DRAFT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-theme-accent border-2 border-theme-border text-white text-xs font-black shadow-brutal-sm uppercase">
                      <Eye size={14} strokeWidth={3}/> LIVE
                    </span>
                  )}
                </td>
                <td className="p-6 border-r-2 border-theme-border text-sm text-theme-text-secondary uppercase">
                  {post.series || '-'}
                </td>
                <td className="p-6 border-r-2 border-theme-border text-sm text-theme-text-primary font-mono">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {/* 回档：使用 post._id */}
                    <Link to={`/edit/${post._id}`} className="bg-theme-base border-2 border-theme-border p-2 rounded-lg text-theme-text-primary hover:bg-theme-surface hover:text-theme-accent shadow-brutal-sm hover:shadow-brutal active:active-brutal-sm transition-all">
                      <Edit3 size={18} strokeWidth={2.5} />
                    </Link>
                    <button onClick={() => handleDelete(post._id, post.title)} className="bg-theme-base border-2 border-theme-border p-2 rounded-lg text-theme-text-primary hover:bg-theme-surface hover:text-red-500 shadow-brutal-sm hover:shadow-brutal active:active-brutal-sm transition-all">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan="5" className="p-16 text-center text-theme-text-secondary font-black font-mono uppercase text-xl">NO ENTRIES FOUND</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;