import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import UploadForm from '../components/UploadForm';

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
          <div>
            <h1 className="text-2xl font-bold">Northstar Portfolio</h1>
            <p className="text-gray-600">{user?.tenantName} | {user?.email}</p>
          </div>
          <button onClick={handleLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            Log Out
          </button>
        </header>

        <UploadForm token={token} onUploadSuccess={fetchDashboard} />

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading portfolio...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded shadow">{error}</div>
        ) : !data?.hasData ? (
          <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
            {data?.message || 'No holdings uploaded yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Portfolio Overview</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Period / Date Range</p>
                <p className="font-medium">{data.startDate} to {data.endDate}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Start Value</p>
                <p className="font-medium">${data.startMarketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">End Value</p>
                <p className="font-medium text-lg">${data.endMarketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Period Return</p>
                <div className={`text-3xl font-bold ${data.periodReturn && data.periodReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.periodReturn && data.periodReturn > 0 ? '+' : ''}
                  {data.periodReturn ? (data.periodReturn * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Market Value by Asset Class</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-2 px-4">Asset Class</th>
                      <th className="py-2 px-4 text-right">Market Value ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assetClassBreakdown?.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 px-4">{item.assetClass}</td>
                        <td className="py-2 px-4 text-right">
                          {item.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:col-span-3 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Asset Class Chart</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.assetClassBreakdown}>
                    <XAxis dataKey="assetClass" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="marketValue" name="Market Value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
