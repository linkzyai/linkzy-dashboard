import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  User,
  Bell,
  Shield,
  Globe,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  Building,
  Key,
  Eye,
  EyeOff,
  Clock,
  Palette,
  Download,
  Upload,
  Webhook,
  Zap,
  Target,
  FileText,
  Monitor,
  Smartphone,
  LogOut,
  Edit3
} from 'lucide-react';

const DashboardSettings = () => {
  const [profileData, setProfileData] = useState({
    name: 'Michael Carpenter',
    email: 'michael@example.com',
    company: 'Acme Corp',
    phone: '+1 (555) 123-4567',
    website: 'https://acmecorp.com',
    timezone: 'America/New_York',
    bio: 'Digital marketing specialist focused on SEO and content strategy.'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    backlinkAlerts: true,
    monthlyReports: true,
    weeklyDigest: false,
    apiAlerts: true,
    billingUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordLastChanged: '3 months ago'
  });

  const [integrations, setIntegrations] = useState({
    webhookUrl: 'https://your-site.com/webhook',
    slackNotifications: false,
    autoPlacement: true,
    defaultNiche: 'technology'
  });

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    defaultAnchorStyle: 'branded'
  });

  const [activeSessions] = useState([
    { device: 'MacBook Pro', location: 'New York, US', lastActive: '2 minutes ago', current: true },
    { device: 'iPhone 14', location: 'New York, US', lastActive: '1 hour ago', current: false },
    { device: 'Chrome Browser', location: 'Los Angeles, US', lastActive: '2 days ago', current: false }
  ]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProfileSave = () => {
    alert('Profile updated successfully!');
  };

  const handleNotificationSave = () => {
    alert('Notification preferences updated!');
  };

  const handleSecuritySave = () => {
    alert('Security settings updated!');
  };

  const handlePasswordChange = () => {
    alert('Password change process initiated! Check your email.');
  };

  const handleExportData = () => {
    alert('Data export started! You\'ll receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Import supabaseService
      const { default: supabaseService } = await import('../../services/supabaseService');
      
      // Get current user
      const user = await supabaseService.getCurrentUser();
      
      if (user) {
        // Delete user data from custom tables first
        const { supabase } = await import('../../lib/supabase');
        
        // Delete backlinks
        await supabase.from('backlinks').delete().eq('user_id', user.id);
        
        // Delete user record
        await supabase.from('users').delete().eq('id', user.id);
        
        // Delete auth user (this will sign them out)
        await supabase.auth.admin.deleteUser(user.id);
      }
      
      // Clear local storage
      supabaseService.clearApiKey();
      
      alert('Account deleted successfully! You will be redirected to the homepage.');
      
      // Redirect to homepage
      window.location.href = '/';
      
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Delete failed: ' + error.message + '\n\nFor testing purposes, you can also delete via Supabase Dashboard → Authentication → Users');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <DashboardLayout title="Account Settings">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and settings.</p>
        </div>

        <div className="space-y-16">
          {/* Profile Information */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Profile Information</h2>
                <p className="text-gray-400 text-sm">Update your personal information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-xs">Verified</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-gray-500 text-xs mt-1">Brief description for your profile</p>
            </div>

            <button 
              onClick={handleProfileSave}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <p className="text-gray-400 text-sm">Configure your notification preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">
                      {key === 'emailNotifications' && 'Email Notifications'}
                      {key === 'backlinkAlerts' && 'Backlink Alerts'}
                      {key === 'monthlyReports' && 'Monthly Reports'}
                      {key === 'weeklyDigest' && 'Weekly Digest'}
                      {key === 'apiAlerts' && 'API Usage Alerts'}
                      {key === 'billingUpdates' && 'Billing Updates'}
                      {key === 'securityAlerts' && 'Security Alerts'}
                      {key === 'marketingEmails' && 'Marketing Emails'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {key === 'emailNotifications' && 'Receive email notifications for important updates'}
                      {key === 'backlinkAlerts' && 'Get notified when backlinks are placed'}
                      {key === 'monthlyReports' && 'Monthly performance summaries'}
                      {key === 'weeklyDigest' && 'Weekly summary of your activity'}
                      {key === 'apiAlerts' && 'Notifications about API usage and limits'}
                      {key === 'billingUpdates' && 'Payment confirmations and billing changes'}
                      {key === 'securityAlerts' && 'Security-related notifications'}
                      {key === 'marketingEmails' && 'Product updates and promotional content'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              ))}
            </div>

            <button 
              onClick={handleNotificationSave}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>

          {/* Security Settings */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Security Settings</h2>
                <p className="text-gray-400 text-sm">Manage your account security and access</p>
              </div>
            </div>

            <div className="space-y-10">
              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Password</p>
                  <p className="text-gray-400 text-sm">Last changed {security.passwordLastChanged}</p>
                </div>
                <button 
                  onClick={handlePasswordChange}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${security.twoFactor ? 'text-green-400' : 'text-gray-400'}`}>
                    {security.twoFactor ? 'Enabled' : 'Disabled'}
                  </span>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    {security.twoFactor ? 'Disable' : 'Enable'} 2FA
                  </button>
                </div>
              </div>

              {/* Login Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Login Alerts</p>
                  <p className="text-gray-400 text-sm">Get notified of new login attempts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginAlerts}
                    onChange={(e) => setSecurity({...security, loginAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Session Timeout */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">Session Timeout</p>
                    <p className="text-gray-400 text-sm">Automatically log out after inactivity</p>
                  </div>
                </div>
                <select 
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSecuritySave}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Security Settings</span>
            </button>
          </div>

          {/* Active Sessions */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Active Sessions</h2>
                <p className="text-gray-400 text-sm">Manage your logged-in devices</p>
              </div>
            </div>

            <div className="space-y-4">
              {activeSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      {session.device.includes('MacBook') ? <Monitor className="w-5 h-5 text-gray-400" /> : 
                       session.device.includes('iPhone') ? <Smartphone className="w-5 h-5 text-gray-400" /> :
                       <Globe className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium flex items-center space-x-2">
                        <span>{session.device}</span>
                        {session.current && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs border border-green-500/30">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-sm">{session.location} • {session.lastActive}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="text-red-400 hover:text-red-300 transition-colors text-sm">
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Integration Settings */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Integration Settings</h2>
                <p className="text-gray-400 text-sm">Configure webhooks and automation preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <div className="relative">
                  <Webhook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={integrations.webhookUrl}
                    onChange={(e) => setIntegrations({...integrations, webhookUrl: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="https://your-site.com/webhook"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Receive notifications when backlinks are placed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Niche
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={integrations.defaultNiche}
                    onChange={(e) => setIntegrations({...integrations, defaultNiche: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="technology">Technology</option>
                    <option value="business">Business</option>
                    <option value="health">Health & Wellness</option>
                    <option value="finance">Finance</option>
                    <option value="travel">Travel</option>
                    <option value="food">Food & Recipes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Auto-Placement</p>
                  <p className="text-gray-400 text-sm">Automatically accept suitable backlink placements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrations.autoPlacement}
                    onChange={(e) => setIntegrations({...integrations, autoPlacement: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Data & Privacy</h2>
                <p className="text-gray-400 text-sm">Manage your data and privacy settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleExportData}
                className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3 border border-gray-600"
              >
                <Download className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium">Export Data</p>
                  <p className="text-gray-400 text-sm">Download all your data</p>
                </div>
              </button>

              <button className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3 border border-gray-600">
                <Upload className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium">Import Data</p>
                  <p className="text-gray-400 text-sm">Import from CSV file</p>
                </div>
              </button>
            </div>
          </div>

          {/* Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-red-500 rounded-2xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Delete Account</h2>
                  <p className="text-gray-300">This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-2">What will be deleted:</h4>
                    <ul className="text-red-300 text-sm space-y-1">
                      <li>• Your account and profile data</li>
                      <li>• All backlink requests and history</li>
                      <li>• Analytics and performance data</li>
                      <li>• API keys and access tokens</li>
                      <li>• Billing history and preferences</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Forever</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                <p className="text-gray-400 text-sm">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Delete Account</p>
                  <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;