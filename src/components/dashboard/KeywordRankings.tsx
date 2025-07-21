import React, { useEffect, useState } from 'react';
// @ts-ignore
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Helper to group and sort rankings by keyword
// @ts-ignore
function processRankings(data) {
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.keyword]) grouped[row.keyword] = [];
    grouped[row.keyword].push(row);
  }
  // Sort each keyword's rankings by checked_at desc
  // @ts-ignore
  Object.values(grouped).forEach(arr => arr.sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at)));
  return grouped;
}

const KeywordRankings = ({ domain, apiKey, initialKeywords = [] }: any) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerError, setTriggerError] = useState('');
  const [keywords, setKeywords] = useState(initialKeywords);
  const { user } = useAuth();
  console.log('KeywordRankings user:', user);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      
      // Add a simple timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('No keyword rankings data available yet. Start by adding keywords to track.');
        setRankings([]);
      }, 8000); // 8 second timeout
      
      try {
        let query = supabase
          .from('keyword_rankings')
          .select('*')
          .eq('domain', domain)
          .order('checked_at', { ascending: false });
        if (apiKey) query = query.eq('api_key', apiKey);
        const { data, error } = await query;
        
        clearTimeout(timeout); // Clear timeout if request completes
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setRankings([]);
          setError('No keyword rankings found. Add some keywords to start tracking.');
          setLoading(false);
          return;
        }
        
        const grouped = processRankings(data);
        // For each keyword, get [current, previous]
        const rows = Object.entries(grouped).map(([keyword, arr]) => {
          const [current, previous] = arr;
          return {
            keyword,
            current: current?.position,
            previous: previous?.position,
            checked_at: current?.checked_at,
          };
        });
        setRankings(rows);
      } catch (err) {
        setError('Failed to load keyword rankings.');
      } finally {
        setLoading(false);
      }
    };
    if (domain) fetchRankings();
  }, [domain, apiKey, triggerSuccess]);

  const handleTriggerRanking = async () => {
    setTriggerLoading(true);
    setTriggerSuccess(false);
    setTriggerError('');
    try {
      if (!user || !user.id) throw new Error('User not authenticated');
      if (!keywords.length) throw new Error('No keywords provided');
      const response = await fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/keyword-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          domain,
          api_key: apiKey,
          user_id: user.id
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to trigger keyword ranking check');
      setTriggerSuccess(true);
      setTimeout(() => setTriggerSuccess(false), 3000);
    } catch (err) {
      setTriggerError(err.message || 'Error triggering keyword ranking check');
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading keyword rankings..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <h3 className="text-xl font-bold text-white">Live Keyword Rankings</h3>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            type="text"
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            placeholder="Enter keywords (comma separated)"
            value={keywords.join(', ')}
            onChange={e => setKeywords(e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
            style={{ minWidth: 220 }}
          />
          <button
            onClick={handleTriggerRanking}
            disabled={triggerLoading || !keywords.length}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {triggerLoading ? 'Checking...' : 'Run Keyword Ranking Check'}
          </button>
        </div>
      </div>
      {triggerSuccess && <div className="text-green-400 font-semibold mb-2">Keyword ranking check triggered successfully!</div>}
      {triggerError && <div className="text-red-400 font-semibold mb-2">{triggerError}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-gray-300">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-2 text-left">Keyword</th>
              <th className="px-4 py-2 text-left">Current Position</th>
              <th className="px-4 py-2 text-left">Previous Position</th>
              <th className="px-4 py-2 text-left">Change</th>
              <th className="px-4 py-2 text-left">Last Checked</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((row) => {
              let change = null;
              if (row.current && row.previous) {
                change = row.previous - row.current;
              }
              return (
                <tr key={row.keyword} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-2 font-bold text-orange-400">{row.keyword}</td>
                  <td className="px-4 py-2">{row.current ?? 'N/A'}</td>
                  <td className="px-4 py-2">{row.previous ?? 'N/A'}</td>
                  <td className="px-4 py-2">
                    {change === null ? (
                      <Minus className="inline w-4 h-4 text-gray-400" />
                    ) : change > 0 ? (
                      <span className="text-green-400 font-semibold flex items-center"><ArrowUp className="inline w-4 h-4 mr-1" />{change}</span>
                    ) : change < 0 ? (
                      <span className="text-red-400 font-semibold flex items-center"><ArrowDown className="inline w-4 h-4 mr-1" />{Math.abs(change)}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{row.checked_at ? new Date(row.checked_at).toLocaleString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeywordRankings; 