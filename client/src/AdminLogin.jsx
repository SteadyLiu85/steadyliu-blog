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
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'NETWORK ERR');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-theme-surface border-4 border-theme-border p-10 rounded-3xl shadow-brutal-lg text-left">
        
        <div className="flex items-center gap-3 text-theme-text-primary border-b-4 border-theme-border pb-6 mb-8">
          <div className="bg-theme-accent text-white p-2 border-2 border-theme-border rounded-xl shadow-brutal-sm">
            <Terminal size={28} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            System Auth
          </h1>
        </div>

        {error && (
          <div className="bg-theme-accent border-4 border-theme-border text-white p-4 rounded-xl mb-6 text-sm font-black font-mono uppercase shadow-brutal-sm">
            DENIED: {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-mono font-black text-theme-text-primary uppercase">
              Admin ID
            </label>
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="ROOT"
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-5 py-4 text-xl font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all font-mono"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-mono font-black text-theme-text-primary uppercase">
              Secret Key
            </label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
              className="w-full bg-theme-base border-4 border-theme-border rounded-xl px-5 py-4 text-xl font-bold text-theme-text-primary focus:outline-none focus:shadow-brutal transition-all font-mono"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-theme-text-primary text-theme-surface border-4 border-theme-border py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 active:active-brutal transition-all mt-8 disabled:opacity-50">
            {loading ? <Loader2 size={24} className="animate-spin" /> : <KeyRound size={24} strokeWidth={3} />}
            {loading ? 'WAIT...' : 'VERIFY'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;