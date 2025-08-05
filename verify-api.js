#!/usr/bin/env node

// Simple API verification script for track-content function
// Usage: node verify-api.js YOUR_API_KEY

const API_URL = 'https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/track-content';

async function testTrackContentAPI(apiKey) {
  if (!apiKey) {
    console.error('❌ Please provide an API key: node verify-api.js YOUR_API_KEY');
    process.exit(1);
  }

  console.log('🧪 Testing track-content API...');
  console.log(`📡 URL: ${API_URL}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);

  const testData = {
    apiKey: apiKey,
    url: 'https://example.com/test-verification',
    title: 'API Verification Test Page',
    referrer: 'https://linkzy.ai',
    timestamp: new Date().toISOString(),
    content: 'This is a test page for verifying the track-content API. It contains keywords like JavaScript, React, Node.js, web development, and API testing.'
  };

  try {
    console.log('\n📤 Sending test data...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Test SUCCESSFUL!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
      console.log('\n🔍 Next steps:');
      console.log('1. Check your Supabase dashboard: https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr/editor');
      console.log('2. Look for the tracked_content table');
      console.log('3. Verify your test data appears in the table');
      return true;
    } else {
      console.log('❌ API Test FAILED');
      console.log('📊 Error Response:', JSON.stringify(result, null, 2));
      console.log('🔧 Common issues:');
      console.log('- Invalid API key (check your users table)');
      console.log('- tracked_content table not created');
      console.log('- Edge Function deployment issues');
      return false;
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('🔧 This could indicate:');
    console.log('- CORS issues');
    console.log('- Edge Function not deployed');
    console.log('- Network connectivity problems');
    return false;
  }
}

// Get API key from command line argument
const apiKey = process.argv[2];
testTrackContentAPI(apiKey); 