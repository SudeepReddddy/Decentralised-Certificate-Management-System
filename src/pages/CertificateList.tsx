import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { List, Download, Search, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import BlockchainStatus from '../components/BlockchainStatus';

const CertificateList = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCertificates(data || []);
    } catch (err) {
      setError('Failed to fetch certificates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatePDF = async (certificate: any) => {
    try {
      const qrData = `Certificate ID: ${certificate.certificate_id}
Student ID: ${certificate.student_id}
Student Name: ${certificate.student_name}
Course: ${certificate.course}
University: ${certificate.university}`;

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Enhanced background with radial gradient effect
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      const maxRadius = Math.max(pageWidth, pageHeight);
      
      for (let r = maxRadius; r > 0; r -= 1) {
        const ratio = r / maxRadius;
        const color = {
          r: Math.floor(240 + (255 - 240) * ratio),
          g: Math.floor(240 + (255 - 240) * ratio),
          b: Math.floor(250 + (255 - 250) * ratio)
        };
        pdf.setFillColor(color.r, color.g, color.b);
        pdf.circle(centerX, centerY, r, 'F');
      }

      // Elegant border design
      pdf.setDrawColor(41, 128, 185);
      pdf.setLineWidth(0.5);
      
      // Outer border
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      // Inner border with decorative corners
      pdf.setLineWidth(0.3);
      const margin = 15;
      pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

      // Decorative corners
      const cornerSize = 15;
      const cornerMargin = margin + 5;
      
      // Top left corner decorations
      pdf.line(cornerMargin, cornerMargin, cornerMargin + cornerSize, cornerMargin);
      pdf.line(cornerMargin, cornerMargin, cornerMargin, cornerMargin + cornerSize);
      
      // Top right corner decorations
      pdf.line(pageWidth - cornerMargin - cornerSize, cornerMargin, pageWidth - cornerMargin, cornerMargin);
      pdf.line(pageWidth - cornerMargin, cornerMargin, pageWidth - cornerMargin, cornerMargin + cornerSize);
      
      // Bottom left corner decorations
      pdf.line(cornerMargin, pageHeight - cornerMargin - cornerSize, cornerMargin, pageHeight - cornerMargin);
      pdf.line(cornerMargin, pageHeight - cornerMargin, cornerMargin + cornerSize, pageHeight - cornerMargin);
      
      // Bottom right corner decorations
      pdf.line(pageWidth - cornerMargin - cornerSize, pageHeight - cornerMargin, pageWidth - cornerMargin, pageHeight - cornerMargin);
      pdf.line(pageWidth - cornerMargin, pageHeight - cornerMargin - cornerSize, pageWidth - cornerMargin, pageHeight - cornerMargin);

      // Certificate title
      pdf.setTextColor(41, 128, 185);
      pdf.setFontSize(36);
      pdf.setFont(undefined, 'bold');
      pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 45, { align: 'center' });

      // Decorative line under title
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 4, 55, (pageWidth * 3) / 4, 55);

      // Certificate content with improved typography and spacing
      const contentStartY = 85;
      
      pdf.setTextColor(44, 62, 80);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text('This is to certify that', pageWidth / 2, contentStartY - 10, { align: 'center' });

      // Student name with larger, bold font
      pdf.setFontSize(32);
      pdf.setTextColor(41, 128, 185);
      pdf.setFont(undefined, 'bold');
      pdf.text(certificate.student_name, pageWidth / 2, contentStartY + 10, { align: 'center' });

      // Course completion text
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text('has successfully completed the course', pageWidth / 2, contentStartY + 25, { align: 'center' });

      // Course name with emphasis
      pdf.setFontSize(28);
      pdf.setTextColor(41, 128, 185);
      pdf.setFont(undefined, 'bold');
      pdf.text(certificate.course, pageWidth / 2, contentStartY + 45, { align: 'center' });

      // University name
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text(`at ${certificate.university}`, pageWidth / 2, contentStartY + 60, { align: 'center' });

      // Issue date with improved formatting
      const issueDate = new Date(certificate.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      pdf.setFontSize(14);
      pdf.text(`Issued on ${issueDate}`, pageWidth / 2, contentStartY + 75, { align: 'center' });

      // Certificate ID with improved styling
      pdf.setFontSize(12);
      pdf.setTextColor(41, 128, 185);
      pdf.text(`Certificate ID: ${certificate.certificate_id}`, pageWidth / 2, contentStartY + 90, { align: 'center' });

      // Enhanced QR code presentation
      const qrSize = 35;
      const qrX = 25;
      const qrY = pageHeight - 60;
      
      // QR code background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 3, 3, 'F');
      
      // Add QR code
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add blockchain verification text
      // pdf.setFontSize(10);
      // pdf.setTextColor(44, 62, 80);
      // pdf.text('Ethereum Blockchain Verified', qrX, qrY + qrSize + 10);

      // Add Ethereum logo
      // pdf.setFillColor(41, 128, 185);
      // pdf.circle(qrX + qrSize + 15, qrY + qrSize / 2, 5, 'F');
      // pdf.setTextColor(41, 128, 185);
      // pdf.setFontSize(8);
      // pdf.text('ETH', qrX + qrSize + 15, qrY + qrSize / 2 + 10, { align: 'center' });

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
    cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <List className="h-10 w-10 text-purple-600 mr-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Certificates</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-80 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <BlockchainStatus />

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading certificates...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.certificate_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{certificate.student_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{certificate.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{certificate.university}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(certificate.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {certificate.blockchain_verified ? (
                        <div className="flex items-center text-green-600">
                          <Shield className="h-4 w-4 mr-1" />
                          <span className="text-sm">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Database Only</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => downloadCertificate(certificate)}
                        disabled={downloadingId === certificate.certificate_id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-600 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        {downloadingId === certificate.certificate_id ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        {downloadingId === certificate.certificate_id ? 'Downloading...' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCertificates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No certificates found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateList;