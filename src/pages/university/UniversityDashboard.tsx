import React, { useEffect, useState } from 'react';
import { Users, Award, TrendingUp, Calendar, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/auth';

const UniversityDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    recentCertificates: 0,
    activeStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const universityData = user?.data as any;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', user.id);

      // Fetch active students count
      const { count: activeStudentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', user.id)
        .eq('status', 'active');

      // Fetch certificates count
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', user.id);

      // Fetch recent certificates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentCertificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch recent activity
      const { data: recentCerts } = await supabase
        .from('certificates')
        .select(`
          *,
          students (name, roll_number)
        `)
        .eq('university_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalStudents: studentsCount || 0,
        totalCertificates: certificatesCount || 0,
        recentCertificates: recentCertificatesCount || 0,
        activeStudents: activeStudentsCount || 0,
      });

      setRecentActivity(recentCerts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Certificates',
      value: stats.totalCertificates,
      icon: Award,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Recent Certificates',
      value: stats.recentCertificates,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      title: 'Active Students',
      value: stats.activeStudents,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '+5%',
    },
  ];

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
            Welcome back, {universityData?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your certificates and students today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/university/students/add"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
                <p className="text-gray-600">Register a new student</p>
              </div>
            </div>
          </Link>

          <Link
            to="/university/certificates/generate"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Generate Certificate</h3>
                <p className="text-gray-600">Issue a new certificate</p>
              </div>
            </div>
          </Link>

          <Link
            to="/university/students"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">View Students</h3>
                <p className="text-gray-600">Manage your students</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Certificates</h2>
            <p className="text-gray-600 mt-1">Latest certificates issued by your university</p>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Award className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">
                          {cert.students?.name || 'Unknown Student'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {cert.course} • Roll: {cert.students?.roll_number || cert.student_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{cert.certificate_id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(cert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No certificates issued yet</p>
                <Link
                  to="/university/certificates/generate"
                  className="text-indigo-600 hover:text-indigo-500 font-medium mt-2 inline-block"
                >
                  Issue your first certificate
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityDashboard;