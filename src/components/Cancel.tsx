import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

const Cancel = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
          
          <p className="text-gray-300 mb-6">
            No worries! Your payment was cancelled and no charges were made.
          </p>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">Still Interested?</p>
            <p className="text-gray-300 text-sm">
              You can always come back and purchase credits when you're ready to boost your SEO with quality backlinks.
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/#pricing'}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pricing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cancel;