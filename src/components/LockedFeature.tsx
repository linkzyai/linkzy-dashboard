import React from 'react';

interface LockedFeatureProps {
  featureName?: string;
  onUpgrade?: () => void;
}

const LockedFeature: React.FC<LockedFeatureProps> = ({ featureName = 'This feature', onUpgrade }) => {
  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: 8,
      padding: 24,
      textAlign: 'center',
      background: '#fafbfc',
      margin: '24px 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{ fontSize: 40, color: '#bbb', marginBottom: 12 }}>
        <span role="img" aria-label="locked">🔒</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
        {featureName} is a Pro feature
      </div>
      <div style={{ color: '#666', marginBottom: 16 }}>
        Upgrade to Pro to unlock unlimited access to this feature and more!
      </div>
      <button
        onClick={onUpgrade}
        style={{
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '10px 24px',
          fontSize: 16,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
};

export default LockedFeature; 