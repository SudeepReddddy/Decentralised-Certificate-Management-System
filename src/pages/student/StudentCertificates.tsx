import React, { useEffect, useState } from 'react';
import { Award, Download, Search, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/auth';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const user = authService.getCurrentUser();

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
    cert.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cert.grade && cert.grade.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-2">All certificates issued to you</p>
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

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Award className="h-6 w-6 text-indigo-600" />
                  </div>
                  {certificate.blockchain_verified ? (
                    <div className="flex items-center text-green-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Blockchain Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Database Only</span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{certificate.course}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Certificate ID:</span>
                    <span className="font-medium text-gray-900">{certificate.certificate_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Grade:</span>
                    <span className={`font-medium ${
                      certificate.grade?.startsWith('A') ? 'text-green-600' :
                      certificate.grade?.startsWith('B') ? 'text-blue-600' :
                      certificate.grade?.startsWith('C') ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {certificate.grade || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">University:</span>
                    <span className="font-medium text-gray-900">{certificate.universities?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Issue Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(certificate.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadCertificate(certificate)}
                  disabled={downloadingId === certificate.certificate_id}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {downloadingId === certificate.certificate_id ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No certificates found</p>
            <p className="text-sm text-gray-500 mt-1">
              Certificates issued by your university will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCertificates;