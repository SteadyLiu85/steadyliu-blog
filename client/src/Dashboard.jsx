import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Loader2
} from 'lucide-react';

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      // 因为全局拦截器的存在，这里会自动带上你的 Token，获取包含草稿的全部文章
      const res = await axios.get('/api/posts');
      setPosts(res.data);
    } catch (err) {
      console.error("获取文章失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`⚠️ 警告：确定要永久删除《${title}》吗？`)) {
      try {
        await axios.delete(`/api/posts/${id}`);
        // 删除成功后，刷新列表
        fetchPosts();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500 font-mono">
        <Loader2 className="animate-spin mb-4" size={32} />
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pb-24 text-left">
      <header className="mb-12 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-8 transition-colors">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4 transition-colors tracking-tight">
            <LayoutDashboard size={36} className="text-blue-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 font-mono text-sm uppercase tracking-widest transition-colors">
            Total Archives: {posts.length}
          </p>
        </div>
        <Link 
          to="/create"
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          + 撰写新文章
        </Link>
      </header>

      {/* 极客风数据表格 */}
      <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl transition-colors duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 font-mono text-xs uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 transition-colors">
                <th className="p-6 font-black">Title</th>
                <th className="p-6 font-black">Status</th>
                <th className="p-6 font-black">Series</th>
                <th className="p-6 font-black">Date</th>
                <th className="p-6 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 transition-colors">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                  <td className="p-6">
                    <Link to={`/post/${post._id}`} className="text-lg font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </Link>
                  </td>
                  <td className="p-6">
                    {post.status === 'draft' ? (
                      <span className="flex items-center gap-1.5 w-max px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold transition-colors">
                        <EyeOff size={12} /> 草稿
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 w-max px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors">
                        <Eye size={12} /> 已发布
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-sm text-gray-500 dark:text-gray-400 font-bold transition-colors">
                    {post.series || '-'}
                  </td>
                  <td className="p-6 text-sm text-gray-500 dark:text-gray-500 font-mono flex items-center gap-2 mt-1.5 transition-colors">
                    <Calendar size={14} />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link 
                        to={`/edit/${post._id}`}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="编辑文章"
                      >
                        <Edit3 size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(post._id, post.title)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="永久删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 dark:text-gray-600 italic font-mono transition-colors">
                    暂无数据记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;