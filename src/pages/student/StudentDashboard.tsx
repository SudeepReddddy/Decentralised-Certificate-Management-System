import React, { useEffect, useState } from 'react';
import { Award, Download, Calendar, User, GraduationCap, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/auth';

const StudentDashboard = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const studentData = user?.data as any;

  useEffect(() => {
    fetchStudentCertificates();
  }, []);

  const fetchStudentCertificates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          universities (name, email)
        `)
        .eq('student_uuid', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalCertificates: certificates.length,
    recentCertificates: certificates.filter(cert => {
      const certDate = new Date(cert.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return certDate >= thirtyDaysAgo;
    }).length,
    blockchainVerified: certificates.filter(cert => cert.blockchain_verified).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {studentData?.name}
          </h1>
          <div className="mt-2 flex items-center text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>Roll Number: {studentData?.roll_number}</span>
            <span className="mx-2">•</span>
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>{studentData?.universities?.name}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCertificates}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Certificates</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recentCertificates}</p>
                <p className="text-sm text-green-600 mt-1">Last 30 days</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blockchain Verified</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.blockchainVerified}</p>
                <p className="text-sm text-purple-600 mt-1">Secure certificates</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Student Profile</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-lg text-gray-900">{studentData?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Roll Number</label>
                <p className="mt-1 text-lg text-gray-900">{studentData?.roll_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">University</label>
                <p className="mt-1 text-lg text-gray-900">{studentData?.universities?.name}</p>
              </div>
              {studentData?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-lg text-gray-900">{studentData.email}</p>
                </div>
              )}
              {studentData?.course && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Course</label>
                  <p className="mt-1 text-lg text-gray-900">{studentData.course}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  studentData?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : studentData?.status === 'graduated'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {studentData?.status?.charAt(0).toUpperCase() + studentData?.status?.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">My Certificates</h2>
              <p className="text-gray-600 mt-1">All certificates issued to you</p>
            </div>
            <Link
              to="/student/certificates"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </div>
          <div className="p-6">
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.slice(0, 5).map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Award className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{cert.course}</h4>
                        <p className="text-sm text-gray-600">
                          Certificate ID: {cert.certificate_id}
                        </p>
                        <div className="flex items-center mt-1">
                          {cert.blockchain_verified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Blockchain Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Database Only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(cert.created_at).toLocaleDateString()}
                      </p>
                      <button className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 hover:text-indigo-500">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
                {certificates.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/student/certificates"
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      View {certificates.length - 5} more certificates
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No certificates found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Certificates issued by your university will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;