import React, { useEffect, useState } from 'react';
import { Award, Plus, Search, Download, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/auth';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { generateCertificateId, issueCertificateOnBlockchain, initWeb3 } from '../../lib/blockchain';

const UniversityCertificates = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    course: '',
    grade: 'A',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const user = authService.getCurrentUser();
  const universityData = user?.data as any;

  useEffect(() => {
    fetchCertificates();
    fetchStudents();
  }, []);

  const fetchCertificates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          students (name, roll_number)
        `)
        .eq('university_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('university_id', user.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const generateCertificatePDF = async (certificate: any) => {
    try {
      const qrData = `Certificate ID: ${certificate.certificate_id}
Student: ${certificate.student_name}
Course: ${certificate.course}
Grade: ${certificate.grade}
University: ${certificate.university}
Verify at: ${window.location.origin}/verify`;

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Modern gradient background
      const gradient = pdf.internal.pageSize.getWidth();
      for (let i = 0; i < pageHeight; i += 2) {
        const opacity = 0.05 + (i / pageHeight) * 0.1;
        pdf.setFillColor(79, 70, 229, opacity);
        pdf.rect(0, i, pageWidth, 2, 'F');
      }

      // Modern border design
      pdf.setDrawColor(79, 70, 229);
      pdf.setLineWidth(3);
      pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
      
      pdf.setLineWidth(1);
      pdf.setDrawColor(165, 180, 252);
      pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

      // Header section with modern typography
      pdf.setTextColor(79, 70, 229);
      pdf.setFontSize(42);
      pdf.setFont(undefined, 'bold');
      pdf.text('CERTIFICATE', pageWidth / 2, 50, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'normal');
      pdf.text('OF ACHIEVEMENT', pageWidth / 2, 65, { align: 'center' });

      // Decorative line
      pdf.setLineWidth(2);
      pdf.setDrawColor(165, 180, 252);
      pdf.line(pageWidth / 4, 75, (pageWidth * 3) / 4, 75);

      // Certificate content
      const contentY = 100;
      
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text('This certifies that', pageWidth / 2, contentY, { align: 'center' });

      // Student name with emphasis
      pdf.setFontSize(36);
      pdf.setTextColor(79, 70, 229);
      pdf.setFont(undefined, 'bold');
      pdf.text(certificate.student_name, pageWidth / 2, contentY + 20, { align: 'center' });

      // Achievement text
      pdf.setFontSize(16);
      pdf.setTextColor(55, 65, 81);
      pdf.setFont(undefined, 'normal');
      pdf.text('has successfully completed the course', pageWidth / 2, contentY + 35, { align: 'center' });

      // Course name
      pdf.setFontSize(28);
      pdf.setTextColor(79, 70, 229);
      pdf.setFont(undefined, 'bold');
      pdf.text(certificate.course, pageWidth / 2, contentY + 55, { align: 'center' });

      // Grade display
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Grade: ${certificate.grade}`, pageWidth / 2, contentY + 75, { align: 'center' });

      // University name
      pdf.setFontSize(16);
      pdf.setTextColor(55, 65, 81);
      pdf.setFont(undefined, 'normal');
      pdf.text(`at ${certificate.university}`, pageWidth / 2, contentY + 90, { align: 'center' });

      // Date
      const issueDate = new Date(certificate.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      pdf.setFontSize(14);
      pdf.text(`Issued on ${issueDate}`, pageWidth / 2, contentY + 105, { align: 'center' });

      // Certificate ID
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text(`Certificate ID: ${certificate.certificate_id}`, pageWidth / 2, contentY + 120, { align: 'center' });

      // QR Code with modern styling
      const qrSize = 40;
      const qrX = 30;
      const qrY = pageHeight - 70;
      
      // QR code background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5, 'F');
      pdf.setDrawColor(79, 70, 229);
      pdf.setLineWidth(1);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5, 'S');
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Verification text
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Scan to verify', qrX + qrSize/2, qrY + qrSize + 15, { align: 'center' });

      // Signature area
      pdf.setDrawColor(107, 114, 128);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth - 120, pageHeight - 40, pageWidth - 40, pageHeight - 40);
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Authorized Signature', pageWidth - 80, pageHeight - 30, { align: 'center' });

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const selectedStudent = students.find(s => s.id === formData.student_id);
      if (!selectedStudent) {
        throw new Error('Please select a student');
      }

      // Check for duplicate certificate
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_uuid', formData.student_id)
        .eq('course', formData.course)
        .single();

      if (existingCert) {
        throw new Error('A certificate for this student and course already exists');
      }

      // Generate certificate ID
      const certificateId = generateCertificateId(
        selectedStudent.roll_number,
        selectedStudent.name,
        formData.course,
        universityData.name
      );

      // Save to database
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          student_id: selectedStudent.roll_number,
          student_name: selectedStudent.name,
          course: formData.course,
          grade: formData.grade,
          university: universityData.name,
          university_id: user?.id,
          student_uuid: formData.student_id,
          blockchain_verified: false
        });

      if (dbError) throw dbError;

      setSuccess('Certificate generated successfully!');
      setShowGenerateModal(false);
      setFormData({ student_id: '', course: '', grade: 'A' });
      fetchCertificates();
    } catch (error: any) {
      setError(error.message || 'Failed to generate certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCertificate = async (certificate: any) => {
    try {
      setDownloadingId(certificate.certificate_id);
      const pdf = await generateCertificatePDF(certificate);
      pdf.save(`${certificate.student_name.replace(/\s+/g, '_')}_${certificate.course.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
            <p className="text-gray-600 mt-2">Manage and generate certificates for your students</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Certificate
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-80 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Certificates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.certificate_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{certificate.student_name}</div>
                        <div className="text-sm text-gray-500">Roll: {certificate.students?.roll_number || certificate.student_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {certificate.course}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        certificate.grade?.startsWith('A') ? 'bg-green-100 text-green-800' :
                        certificate.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        certificate.grade?.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {certificate.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(certificate.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadCertificate(certificate)}
                        disabled={downloadingId === certificate.certificate_id}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        {downloadingId === certificate.certificate_id ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCertificates.length === 0 && (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No certificates found</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Generate your first certificate
              </button>
            </div>
          )}
        </div>

        {/* Generate Certificate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Certificate</h3>
                <form onSubmit={handleGenerateCertificate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student *</label>
                    <select
                      required
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.roll_number})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course *</label>
                    <input
                      type="text"
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter course name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grade *</label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="B-">B-</option>
                      <option value="C+">C+</option>
                      <option value="C">C</option>
                      <option value="C-">C-</option>
                      <option value="D+">D+</option>
                      <option value="D">D</option>
                      <option value="F">F</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Distinction">Distinction</option>
                      <option value="Merit">Merit</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                          Generating...
                        </>
                      ) : (
                        'Generate Certificate'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityCertificates;