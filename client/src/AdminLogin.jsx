// client/src/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Terminal, KeyRound, Loader2 } from 'lucide-react';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      // 登录成功！将 Token 存入浏览器的 localStorage (本地存储)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      // 登录成功后，直接传送回首页
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '认证失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-10 rounded-[2.5rem] shadow-2xl transition-colors duration-500 text-left">
        
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500 mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 transition-colors">
          <Terminal size={32} strokeWidth={2.5} />
          <h1 className="text-2xl font-black tracking-widest uppercase text-gray-900 dark:text-white transition-colors">
            System Auth
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-bold border border-red-200 dark:border-red-500/20 font-mono transition-colors">
            ACCESS DENIED: {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono font-black text-gray-500 tracking-widest uppercase">
              Admin ID
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              required
              placeholder="Enter your ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-black text-gray-500 tracking-widest uppercase">
              Secret Key
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              required
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black tracking-widest transition-all shadow-lg shadow-blue-500/30 active:scale-95 mt-8 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={20} />}
            {loading ? 'AUTHENTICATING...' : 'VERIFY IDENTITY'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;