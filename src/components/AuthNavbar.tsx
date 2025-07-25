import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User, Building2 } from 'lucide-react';
import { authService } from '../lib/auth';

const AuthNavbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (!user) return null;

  const isUniversity = user.type === 'university';
  const userData = user.data as any;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isUniversity ? "/university/dashboard" : "/student/dashboard"} className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">EduCertify</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {isUniversity ? (
              <>
                <Link to="/university/dashboard" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Dashboard
                </Link>
                <Link to="/university/students" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Students
                </Link>
                <Link to="/university/certificates" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Certificates
                </Link>
                <Link to="/verify" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Verify
                </Link>
              </>
            ) : (
              <>
                <Link to="/student/dashboard" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Dashboard
                </Link>
                <Link to="/student/certificates" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  My Certificates
                </Link>
                <Link to="/verify" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors">
                  Verify
                </Link>
              </>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-white">
                {isUniversity ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {isUniversity ? userData.name : userData.name}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-white hover:text-indigo-200 px-3 py-2 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;