import React from 'react';
import DashboardLayout from './DashboardLayout';
import WebsiteScanner from './WebsiteScanner';

const DashboardWebsiteScanner: React.FC = () => {
  return (
    <DashboardLayout title="Website Scanner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Website Scanner</h1>
          <p className="text-gray-400">
            Analyze your website to discover backlink opportunities and optimize content for the Linkzy ecosystem.
          </p>
        </div>
        
        <WebsiteScanner />
      </div>
    </DashboardLayout>
  );
};

export default DashboardWebsiteScanner; 