import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function UploadForm({ token, onUploadSuccess }: { token: string, onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setErrorDetails([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/api/holdings/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Holdings uploaded successfully.');
      setFile(null);
      if (document.getElementById('fileInput')) {
        (document.getElementById('fileInput') as HTMLInputElement).value = '';
      }
      onUploadSuccess();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError('CSV validation failed');
        setErrorDetails(err.response.data.errors);
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">CSV Upload</h3>
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <div>
          <input 
            type="file" 
            id="fileInput"
            accept=".csv" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={!file || loading}
          className="bg-blue-600 text-white rounded px-4 py-2 w-fit disabled:bg-blue-300"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 font-medium mb-2">{error}</p>
          {errorDetails.length > 0 && (
            <ul className="list-disc list-inside text-sm text-red-600">
              {errorDetails.map((err, idx) => (
                <li key={idx}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {success && <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">{success}</div>}
    </div>
  );
}

export default UploadForm;
