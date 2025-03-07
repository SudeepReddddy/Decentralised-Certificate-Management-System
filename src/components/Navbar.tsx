import React from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Certify</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/generate" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Generate
            </Link>
            <Link to="/verify" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Verify
            </Link>
            <Link to="/certificates" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Certificates
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;