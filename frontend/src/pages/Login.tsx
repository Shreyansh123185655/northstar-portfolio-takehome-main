import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Login({ setToken, setUser }: { setToken: (token: string) => void, setUser: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const autoFill = () => {
    setEmail('tenant_a@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-ink">
      <div className="w-full max-w-[420px] p-8">
        <div className="flex flex-col items-center mb-10">
          <span className="w-8 h-8 relative shrink-0 mb-4">
            <svg viewBox="0 0 26 26" fill="none">
              <path d="M13 1L15.6 10.4L25 13L15.6 15.6L13 25L10.4 15.6L1 13L10.4 10.4L13 1Z" fill="#c9a227"></path>
            </svg>
          </span>
          <h1 className="font-serif text-[28px] tracking-[0.01em] font-medium text-parchment m-0">
            North<em className="text-gold not-italic">star</em>
          </h1>
          <div className="font-mono text-[10.5px] text-[#5c657a] mt-2 tracking-[0.04em] uppercase">PORTFOLIO INSIGHTS</div>
        </div>

        {error && (
          <div className="mb-6 bg-coral/10 border border-coral/20 text-coral text-[13.5px] p-4 rounded-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div className="bg-panel border border-line rounded-sm p-5 mb-8">
          <div className="font-mono text-[10.5px] text-gold mb-3 tracking-[0.04em]">DEMO CREDENTIALS</div>
          <div className="flex justify-between text-[13.5px] text-muted mb-1.5 font-mono">
            <span>ID:</span>
            <span className="text-parchment">tenant_a@example.com</span>
          </div>
          <div className="flex justify-between text-[13.5px] text-muted mb-4 font-mono">
            <span>Pass:</span>
            <span className="text-parchment">Password123!</span>
          </div>
          <button 
            type="button" 
            onClick={autoFill}
            className="w-full bg-white/5 hover:bg-white/10 text-gold text-[11px] font-mono p-2 rounded-sm transition-colors uppercase tracking-[0.04em]"
          >
            Auto-fill
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block font-mono text-[10.5px] text-muted mb-2 uppercase tracking-[0.04em]">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input 
                type="email" 
                className="w-full bg-panel border border-line rounded-sm py-2.5 pl-10 pr-4 text-[13.5px] text-parchment focus:border-gold focus:outline-none transition-colors placeholder-muted/50" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
          </div>
          <div className="mb-8">
            <label className="block font-mono text-[10.5px] text-muted mb-2 uppercase tracking-[0.04em]">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
              </span>
              <input 
                type="password" 
                className="w-full bg-panel border border-line rounded-sm py-2.5 pl-10 pr-4 text-[13.5px] text-parchment focus:border-gold focus:outline-none transition-colors placeholder-muted/50" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-parchment text-ink font-sans text-[13px] font-semibold py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
