import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const DeleteAccountTool = () => {
  const [email, setEmail] = useState('hello@creativize.net');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      console.log('🗑️ Deleting account for:', email);
      
      // Note: This would need a custom function or admin access
      // For now, we'll show the SQL commands they need to run
      
      setMessage(`Account deletion initiated for ${email}. Please run the SQL commands shown below in your Supabase dashboard.`);
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Delete failed:', error.message);
        setMessage('Delete failed: ' + error.message);
      } else {
        console.error('❌ Delete failed:', error);
        setMessage('Delete failed: An unknown error occurred');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 border border-gray-700 rounded-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Delete Test Account</h2>
          <p className="text-gray-400 text-sm">Clean up your account to test registration again</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email to Delete
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            placeholder="hello@creativize.net"
          />
        </div>

        {message && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-sm">{message}</p>
          </div>
        )}

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Confirm Deletion</span>
              </div>
              <p className="text-white text-sm">
                This will permanently delete the account for <strong>{email}</strong>. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SQL Commands to Run */}
      <div className="mt-8 bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span>Run These SQL Commands in Supabase</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">1. Go to Supabase Dashboard → SQL Editor</p>
            <div className="bg-gray-900 rounded p-3 font-mono text-sm text-green-400">
              <div className="text-gray-500">-- Delete from custom users table</div>
              <div>DELETE FROM users WHERE email = 'hello@creativize.net';</div>
              
              <div className="text-gray-500 mt-3">-- Delete from auth.users table</div>
              <div>DELETE FROM auth.users WHERE email = 'hello@creativize.net';</div>
              
              <div className="text-gray-500 mt-3">-- Clean up any backlinks</div>
              <div>DELETE FROM backlinks WHERE user_id IN (</div>
              <div>&nbsp;&nbsp;SELECT id FROM users WHERE email = 'hello@creativize.net'</div>
              <div>);</div>
            </div>
          </div>
          
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">Alternative: Use Auth Dashboard</span>
            </div>
            <p className="text-orange-300 text-sm">
              Go to Supabase → Authentication → Users → Find your email → Delete user
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => window.open('https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr/editor', '_blank')}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Open Supabase SQL Editor
        </button>
        <button
          onClick={() => window.open('https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr/auth/users', '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Open Auth Dashboard
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountTool;