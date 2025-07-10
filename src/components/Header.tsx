import React from 'react';
import { useState } from 'react';
import { Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import RegistrationModal from './RegistrationModal';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'signin'>('signup');

  return (
    <>
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Linkzy</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="/dashboard" className="text-gray-300 hover:text-orange-500 transition-colors font-semibold">Dashboard</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setModalMode('signin'); setIsModalOpen(true); }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      </header>
      
      <RegistrationModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} mode={modalMode} setMode={setModalMode} />
    </>
  );
};

export default Header;