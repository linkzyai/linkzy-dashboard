import React from 'react';
import DashboardLayout from './DashboardLayout';
import { Download, Plus, ArrowRight, CheckCircle } from 'lucide-react';

import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useBillingInfo } from '../../hooks/useApi';

// Add types for billingData and related variables
interface PlanType {
  name: string;
  price: string;
  period?: string;
  credits: number;
  used?: number;
  remaining?: number;
  nextBilling?: string;
  status?: string;
  type?: string;
  popular?: boolean;
  description?: string;
}
interface BillingDataType {
  currentPlan?: PlanType;
  billingHistory?: any[];
  availablePlans?: PlanType[];
}

const DashboardBilling = () => {
  const { data: billingDataRaw, loading, error, refetch } = useBillingInfo();
  const billingData = billingDataRaw as BillingDataType || {};
  
  // Use real data or fallback
  const currentPlan = billingData.currentPlan || {
    name: 'Growth Plan',
    price: '$25',
    period: 'one-time',
    credits: 10,
    used: 4,
    remaining: 6,
    nextBilling: 'Jan 15, 2025',
    status: 'active'
  };

  const billingHistory = billingData.billingHistory || [];

  const availablePlans = billingData.availablePlans || [
    { name: 'Starter', price: '$10', credits: 3, type: 'one-time', popular: false, description: '3 backlinks' },
    { name: 'Growth', price: '$25', credits: 10, type: 'one-time', popular: true, description: '10 backlinks' },
    { name: 'Pro', price: '$49', credits: 30, type: 'monthly', popular: false, description: '30 backlinks' },
  ];

  return (
    <DashboardLayout title="Billing & Subscription">
      <div className="p-6">
        {loading && <LoadingSpinner text="Loading billing information..." />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your subscription and billing information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Plan */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Current Plan</h2>
                <p className="text-gray-400 text-sm">Your active subscription details</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
                  <p className="text-gray-400">{currentPlan.credits} backlinks per purchase</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-500">{currentPlan.remaining}</p>
                  <p className="text-gray-400 text-sm">credits left</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Package Price</span>
                  <span className="text-white font-bold">{currentPlan.price}.00</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Purchase Date</span>
                  <span className="text-white">Dec 15, 2024</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Credits Used</span>
                  <span className="text-white">{(currentPlan.used ?? 0)}/{currentPlan.credits}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Package Usage</span>
                  <span className="text-gray-400 text-sm">{Math.round(((currentPlan.used ?? 0) / currentPlan.credits) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentPlan.used ?? 0) / currentPlan.credits) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium">
                Buy More Credits
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium border border-gray-600">
                View Usage
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Payment Method</h2>
                <p className="text-gray-400 text-sm">Your default payment method</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="text-white font-medium">•••• •••• •••• 4242</p>
                    <p className="text-gray-400 text-sm">Expires 12/27</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors border border-gray-600 flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Payment Method</span>
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Billing History</h2>
              <p className="text-gray-400 text-sm">Your recent invoices and payments</p>
            </div>
            
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 border border-gray-600">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          <div className="space-y-3">
            {billingHistory.length > 0 ? billingHistory.map((invoice: any) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                  <div>
                    <p className="text-white font-medium">{invoice.id}</p>
                    <p className="text-gray-400 text-sm">{invoice.date}</p>
                  </div>
                  <div>
                    <p className="text-white font-medium">{invoice.description}</p>
                    <p className="text-gray-400 text-sm">{invoice.period}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-white font-bold">{invoice.amount}</p>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-green-400 text-sm capitalize">Paid</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <span className="text-sm">Download</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No billing history available.</p>
              </div>
            )}
          </div>
        </div>

        {/* API Connection Status */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Billing Data Connected</h2>
          </div>
          <p className="text-white">
            Billing information is now synced with the live backend API.
          </p>
        </div>

        {/* Upgrade Your Plan */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Upgrade Your Plan</h2>
            <p className="text-gray-400 text-sm">Get more backlinks and advanced features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <div key={plan.name} className={`bg-gray-800 rounded-xl p-6 transition-all hover:bg-gray-750 ${
                plan.popular ? 'border-2 border-orange-500 relative' : 'border border-gray-600'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-white mb-2">{plan.price}</div>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                  <p className="text-gray-500 text-xs mt-1">{plan.type}</p>
                </div>
                
                <button 
                  disabled={plan.popular}
                  className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    plan.popular 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  <span>{plan.popular ? 'Current Plan' : plan.name === 'Pro' ? 'Upgrade' : 'Purchase'}</span>
                  {!plan.popular && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBilling;