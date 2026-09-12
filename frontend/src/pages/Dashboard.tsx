import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardData {
  hasData: boolean;
  message?: string;
  startDate?: string;
  endDate?: string;
  startMarketValue?: number;
  endMarketValue?: number;
  periodReturn?: number;
  assetClassBreakdown?: { assetClass: string, marketValue: number }[];
}

function Dashboard({ token, setToken, user }: { token: string, setToken: (token: string | null) => void, user: any }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setToken(null);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const handleLogout = () => {
    setToken(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/api/holdings/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setUploadSuccess(true);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDashboard();
      
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setUploadError(`CSV validation failed: ${err.response.data.errors.map((e: any) => `Row ${e.row}: ${e.message}`).join(', ')}`);
      } else {
        setUploadError(err.response?.data?.error || 'Upload failed.');
      }
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadError(null);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '0';
    return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  const formatCurrencyFull = (val?: number) => {
    if (val === undefined) return '0.00';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const periodReturnAmount = (data?.endMarketValue || 0) - (data?.startMarketValue || 0);
  const periodReturnPct = data?.periodReturn ? (data.periodReturn * 100) : 0;
  
  const breakdown = data?.assetClassBreakdown || [];
  // Sort descending by value for top asset
  const sortedBreakdown = [...breakdown].sort((a, b) => b.marketValue - a.marketValue);
  const topAsset = sortedBreakdown.length > 0 ? sortedBreakdown[0].assetClass : '-';
  const holdingsCount = breakdown.length; // Number of positions/classes
  
  const totalValue = data?.endMarketValue || 1; // avoid division by zero

  const colors = [
    { bg: 'var(--color-gold)', hex: '#c9a227', gradStart: 'var(--color-gold-soft)', gradEnd: '#8a6b1a', gradStop: 'var(--color-gold) 65%' },
    { bg: 'var(--color-teal)', hex: '#4a8f88', gradStart: '#6fb0a8', gradEnd: '#2c5652', gradStop: 'var(--color-teal) 70%' },
    { bg: 'var(--color-coral)', hex: '#c1584d', gradStart: '#e3a29b', gradEnd: '#8a2b22', gradStop: 'var(--color-coral) 60%' }
  ];

  let currentDeg = 0;
  const pieStops = sortedBreakdown.map((item, i) => {
    const pct = item.marketValue / totalValue;
    const deg = pct * 360;
    const c = colors[i % colors.length].bg;
    const stop = `${c} ${currentDeg}deg ${currentDeg + deg}deg`;
    currentDeg += deg;
    return stop;
  });
  if (currentDeg < 360 && pieStops.length > 0) {
     pieStops.push(`#2a3550 ${currentDeg}deg 360deg`);
  }
  const conicGradient = pieStops.length > 0 ? `conic-gradient(${pieStops.join(', ')})` : '';

  const initials = user?.tenantName ? user.tenantName.substring(0, 2).toUpperCase() : 'TA';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[232px_1fr] min-h-screen">
      <aside className="bg-ink-soft border-r border-line p-[28px_22px] flex flex-col h-full md:sticky top-0 md:h-screen">
        <div className="flex items-center gap-2.5 mb-11">
          <span className="w-[26px] h-[26px] relative shrink-0">
            <svg viewBox="0 0 26 26" fill="none">
              <path d="M13 1L15.6 10.4L25 13L15.6 15.6L13 25L10.4 15.6L1 13L10.4 10.4L13 1Z" fill="#c9a227"></path>
            </svg>
          </span>
          <span className="font-serif text-[18px] tracking-[0.01em] font-medium text-parchment">
            North<em className="text-gold not-italic">star</em>
          </span>
        </div>
        <ul className="list-none p-0 m-0 flex flex-col gap-[2px]">
          <li>
            <a href="#" className="flex items-center gap-3 text-parchment text-[13.5px] p-[10px] rounded-sm border-l-2 border-gold bg-gold/5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 opacity-85 shrink-0"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
              Overview
            </a>
          </li>
          <li>
            <a href="#holdings" className="flex items-center gap-3 text-muted text-[13.5px] p-[10px] rounded-sm border-l-2 border-transparent hover:text-parchment hover:bg-white/5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 opacity-85 shrink-0"><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" strokeLinecap="round"></path></svg>
              Holdings
            </a>
          </li>
          <li>
            <a href="#upload" className="flex items-center gap-3 text-muted text-[13.5px] p-[10px] rounded-sm border-l-2 border-transparent hover:text-parchment hover:bg-white/5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 opacity-85 shrink-0"><path d="M12 3v12m0-12l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              Upload data
            </a>
          </li>
          <div className="font-mono text-[10.5px] text-[#5c657a] m-[22px_0_8px_10px] tracking-[0.04em]">ACCOUNT</div>
          <li>
            <a href="#" className="flex items-center gap-3 text-muted text-[13.5px] p-[10px] rounded-sm border-l-2 border-transparent hover:text-parchment hover:bg-white/5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 opacity-85 shrink-0"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round"></path></svg>
              Profile
            </a>
          </li>
          <li>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 text-muted text-[13.5px] p-[10px] rounded-sm border-l-2 border-transparent hover:text-coral hover:bg-white/5 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out w-4 h-4 opacity-85 shrink-0" aria-hidden="true"><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>
              Sign Out
            </button>
          </li>
        </ul>
        <div className="mt-auto pt-[18px] border-t border-line flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-[#8a6b1a] flex items-center justify-center font-mono text-xs text-ink font-semibold">
            {initials}
          </div>
          <div className="text-[12.5px] leading-[1.35]">
            <div className="text-parchment">{user?.tenantName}</div>
            <div className="text-muted text-[11px]">Professional plan</div>
          </div>
        </div>
      </aside>

      <main className="p-[36px_44px_80px] max-w-[1180px] w-full">
        <div className="flex justify-between items-end mb-[38px] flex-wrap gap-[18px]">
          <div>
            <h1 className="font-serif font-medium text-[28px] m-[0_0_6px]">Portfolio overview</h1>
            <p className="m-0 text-muted text-[13.5px]">Everything you hold, how it moved, and what to do about it.</p>
          </div>
          <div className="font-mono text-[11px] text-muted text-right">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal mr-1.5 animate-pulse shadow-[0_0_0_0_rgba(74,143,136,.6)]"></span>
            LIVE — updated just now
          </div>
        </div>

        {data?.hasData ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-end pb-[30px] mb-[30px] border-b border-line" style={{ animationDelay: '0.05s', animationName: 'fadeUp', animationDuration: '0.6s', animationFillMode: 'both' }}>
              <div>
                <div className="font-mono text-[11px] text-muted tracking-[.03em] mb-2.5">TOTAL PORTFOLIO VALUE</div>
                <div className="font-serif text-[clamp(44px,7vw,72px)] font-medium leading-none tracking-[-0.01em]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <sup className="text-[0.4em] text-muted font-mono relative -top-[1.4em] mr-1">$</sup>
                  {formatCurrency(data.endMarketValue)}
                </div>
                <div className="flex items-center gap-2 mt-2.5 text-[14px]">
                  <span className={`inline-flex items-center gap-1 font-mono text-[12.5px] font-medium p-[3px_8px] rounded-[3px] ${periodReturnPct >= 0 ? 'text-[#8fd6ca] bg-teal/15' : 'text-coral bg-coral/15'}`}>
                    {periodReturnPct >= 0 ? '▲' : '▼'} {Math.abs(periodReturnPct).toFixed(2)}%
                  </span>
                  <span className="text-muted text-[12.5px]">this period</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-0 md:border-l md:border-line md:pl-8">
                <div className="pl-6 md:pl-0">
                  <div className="font-mono text-[10.5px] text-muted mb-2">PERIOD RETURN</div>
                  <div className="font-serif text-[22px]" style={{ color: periodReturnAmount >= 0 ? 'rgb(143, 214, 202)' : 'rgb(193, 88, 77)', fontVariantNumeric: 'tabular-nums' }}>
                    {periodReturnAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(periodReturnAmount))}
                  </div>
                </div>
                <div className="pl-6 border-l border-line">
                  <div className="font-mono text-[10.5px] text-muted mb-2">HOLDINGS</div>
                  <div className="font-serif text-[22px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {holdingsCount}
                  </div>
                </div>
                <div className="pl-6 border-l border-line">
                  <div className="font-mono text-[10.5px] text-muted mb-2">TOP ASSET</div>
                  <div className="font-serif text-[19px] truncate" title={topAsset}>
                    {topAsset}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-[22px] mb-[22px]">
              <div className="bg-panel border border-line rounded-sm p-6" style={{ animationDelay: '0.1s', animationName: 'fadeUp', animationDuration: '0.6s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline mb-[22px]">
                  <h2 className="font-serif font-medium text-[16px] m-0">Value by asset</h2>
                  <span className="font-mono text-[10.5px] text-muted">CURRENT · USD</span>
                </div>
                <div className="flex items-end gap-3.5 h-[170px] pt-1.5">
                  {sortedBreakdown.map((item, i) => {
                    const c = colors[i % colors.length];
                    const heightPct = Math.max((item.marketValue / (sortedBreakdown[0]?.marketValue || 1)) * 100, 5); // Relative to largest bar, min 5%
                    const valueK = (item.marketValue / 1000).toFixed(0) + 'k';
                    return (
                      <div key={item.assetClass} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div 
                          className="w-full max-w-[34px] rounded-t-sm relative transition-all duration-1000 ease-[cubic-bezier(.16,.9,.3,1)] group-hover:opacity-80" 
                          style={{ height: `${heightPct}%`, background: `linear-gradient(180deg, ${c.gradStart}, ${c.gradStop}, ${c.gradEnd})` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-parchment bg-ink px-1.5 py-0.5 rounded border border-line whitespace-nowrap">
                            ${valueK}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] text-muted truncate max-w-full uppercase" title={item.assetClass}>
                          {item.assetClass.substring(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-panel border border-line rounded-sm p-6" style={{ animationDelay: '0.15s', animationName: 'fadeUp', animationDuration: '0.6s', animationFillMode: 'both' }}>
                <div className="flex justify-between items-baseline mb-[22px]">
                  <h2 className="font-serif font-medium text-[16px] m-0">Allocation</h2>
                  <span className="font-mono text-[10.5px] text-muted">BY ASSET CLASS</span>
                </div>
                <div className="flex items-center gap-[22px]">
                  <div className="w-[130px] h-[130px] rounded-full relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0" style={{ background: conicGradient }}></div>
                    <div className="absolute inset-[18px] bg-panel rounded-full"></div>
                  </div>
                  <ul className="list-none m-0 p-0 text-[12.5px] flex flex-col gap-[11px] w-full">
                    {sortedBreakdown.map((item, i) => {
                      const c = colors[i % colors.length];
                      const pct = ((item.marketValue / totalValue) * 100).toFixed(1);
                      // In the mockup they showed weird numbers like 112%, 74% - maybe intentional mockup glitch, we'll use exact %
                      return (
                        <li key={item.assetClass} className="flex items-center gap-[9px] text-parchment-dim">
                          <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: c.hex }}></span>
                          <span className="truncate">{item.assetClass}</span>
                          <b className="text-parchment font-mono font-medium ml-auto">{pct}%</b>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>

            <section id="holdings" className="bg-panel border border-line rounded-sm mb-[22px]" style={{ animationDelay: '0.2s', animationName: 'fadeUp', animationDuration: '0.6s', animationFillMode: 'both' }}>
              <div className="flex justify-between items-baseline p-6 pb-0 mb-[16px]">
                <h2 className="font-serif font-medium text-[16px] m-0">Holdings</h2>
                <span className="font-mono text-[10.5px] text-muted">{holdingsCount} POSITIONS</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-mono text-[10.5px] text-muted font-medium p-[0_10px_12px_24px] border-b border-line">Asset Class</th>
                    <th className="text-right font-mono text-[10.5px] text-muted font-medium p-[0_10px_12px] border-b border-line">Weight</th>
                    <th className="text-right font-mono text-[10.5px] text-muted font-medium p-[0_24px_12px_10px] border-b border-line">Market Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((item, i) => {
                    const c = colors[i % colors.length];
                    const pct = ((item.marketValue / totalValue) * 100).toFixed(1);
                    return (
                      <tr key={item.assetClass} className="hover:bg-white/[0.025] transition-colors border-b border-line last:border-b-0">
                        <td className="p-[14px_10px_14px_24px] text-[13.5px]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-[7px] h-[7px] rounded-[2px] shrink-0" style={{ background: c.hex }}></span>
                            <div>
                              <div className="text-parchment">{item.assetClass}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-[14px_10px] text-[13.5px] text-right font-mono text-parchment" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          <span className="w-[70px] h-1 bg-white/5 rounded-[2px] overflow-hidden inline-block mr-2.5 align-middle relative">
                            <span className="absolute top-0 left-0 h-full transition-all duration-1000 ease-[cubic-bezier(.16,.9,.3,1)]" style={{ width: `${pct}%`, background: c.hex }}></span>
                          </span>
                          {pct}%
                        </td>
                        <td className="p-[14px_24px_14px_10px] text-[13.5px] text-right font-mono text-parchment" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${formatCurrencyFull(item.marketValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          !loading && <div className="text-muted text-[13.5px] mb-8">No holdings data found. Upload a CSV below to get started.</div>
        )}

        <div id="upload" style={{ animationDelay: '0.25s', animationName: 'fadeUp', animationDuration: '0.6s', animationFillMode: 'both' }}>
          <div className="bg-panel border border-line p-6 rounded-sm mb-6">
            <div className="flex justify-between items-baseline mb-4">
              <h2 className="font-serif font-medium text-base text-parchment m-0">Upload portfolio data</h2>
              <span className="font-mono text-[10.5px] text-muted">CSV</span>
            </div>
            <p className="text-muted text-[12.5px] -mt-2 mb-5">
              Drop a statement export and we'll reconcile it against your current holdings.
              {' '}<a href="/sample_good.csv" download className="text-gold hover:underline">Download good CSV</a>
              {' · '}<a href="/sample_dirty.csv" download className="text-gold hover:underline">Download dirty CSV</a>
            </p>
            
            {uploadError && (
              <div className="mb-5 bg-coral/10 border border-coral/20 text-coral text-[13px] p-4 rounded-sm">
                {uploadError}
              </div>
            )}
            
            <form className="space-y-5" onSubmit={handleUpload}>
              <div className="w-full">
                <div className="relative group cursor-pointer">
                  <input 
                    id="fileInput" 
                    accept=".csv" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    required 
                    type="file"
                    ref={fileInputRef}
                    onChange={e => {
                      setFile(e.target.files?.[0] || null);
                      setUploadError(null);
                    }} 
                  />
                  <div className={`w-full border-[1.5px] border-dashed rounded-sm p-9 text-center transition-colors ${file ? 'border-gold bg-gold/5' : 'border-line hover:border-gold hover:bg-gold/5'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-up w-[30px] h-[30px] mx-auto mb-3 transition-colors text-gold" aria-hidden="true">
                      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                      <path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M12 12v6"></path><path d="m15 15-3-3-3 3"></path>
                    </svg>
                    <div className="font-serif text-base text-parchment mb-1">{file ? file.name : 'Drag your CSV here'}</div>
                    <div className="text-xs text-muted">{file ? 'File selected' : 'or click to browse · .csv up to 10MB'}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button type="submit" disabled={!file || uploading} className="font-sans text-[13px] font-semibold px-5 py-2.5 rounded-sm bg-parchment text-ink hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[160px] flex items-center justify-center border-none cursor-pointer">
                  {uploading ? 'Uploading...' : 'Upload & reconcile'}
                </button>
                <button type="button" onClick={clearFile} disabled={!file && !uploadError} className="font-sans text-[13px] font-semibold px-5 py-2.5 rounded-sm bg-transparent text-muted border border-line hover:text-parchment hover:border-line/30 transition-colors disabled:opacity-50 cursor-pointer">
                  Clear
                </button>
              </div>
            </form>
            
            <div className={`fixed bottom-6 right-6 bg-panel border border-line border-l-[3px] border-l-teal p-[14px_18px] rounded-sm text-[13px] shadow-[0_12px_30px_rgba(0,0,0,0.4)] max-w-[280px] transition-all duration-300 ease-out z-50 ${uploadSuccess ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0 pointer-events-none'}`}>
              <b className="block mb-0.5 font-serif font-medium text-[13.5px] text-parchment">Upload complete</b>
              <span className="text-parchment-dim">Holdings updated successfully.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
