import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FileCheck, Eye, Loader2, AlertCircle, CheckCircle, Shield, ExternalLink } from 'lucide-react';
import {
  generateCertificateId,
  issueCertificateOnBlockchain,
  initWeb3,
  isWeb3Initialized,
  isMetaMaskInstalled
} from '../lib/blockchain';
import BlockchainStatus from '../components/BlockchainStatus';
import MetaMaskGuide from '../components/MetaMaskGuide';

const GenerateCertificate = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    university: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    const metaMaskInstalled = isMetaMaskInstalled();
    setHasMetaMask(metaMaskInstalled);

    // Show MetaMask guide if not installed
    setShowMetaMaskGuide(!metaMaskInstalled);

    // Initialize Web3 when component mounts
    if (!isWeb3Initialized()) {
      initWeb3().catch(err => {
        console.error('Failed to initialize Web3:', err);
      });
    }
  }, []);

  const checkDuplicateCertificate = async (studentId: string, course: string) => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_id', studentId)
        .eq('course', course);

      if (error) throw error;
      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking duplicate:', err);
      return false;
    }
  };

  const generateCertificatePDF = async (certId: string) => {
    try {
      const qrData = `Certificate ID: ${certId}
          Student ID: ${formData.studentId}
          Student Name: ${formData.studentName}
          Course: ${formData.course}
          University: ${formData.university}`;

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
      pdf.text(formData.studentName, pageWidth / 2, contentStartY + 10, { align: 'center' });

      // Course completion text
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text('has successfully completed the course', pageWidth / 2, contentStartY + 25, { align: 'center' });

      // Course name with emphasis
      pdf.setFontSize(28);
      pdf.setTextColor(41, 128, 185);
      pdf.setFont(undefined, 'bold');
      pdf.text(formData.course, pageWidth / 2, contentStartY + 45, { align: 'center' });

      // University name
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text(`at ${formData.university}`, pageWidth / 2, contentStartY + 60, { align: 'center' });

      // Issue date with improved formatting
      const issueDate = new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      pdf.setFontSize(14);
      pdf.text(`Issued on ${issueDate}`, pageWidth / 2, contentStartY + 75, { align: 'center' });

      // Certificate ID with improved styling
      pdf.setFontSize(12);
      pdf.setTextColor(41, 128, 185);
      pdf.text(`Certificate ID: ${certId}`, pageWidth / 2, contentStartY + 90, { align: 'center' });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setPreviewUrl(null);
    setBlockchainStatus(null);
    setBlockchainTxHash(null);

    try {
      // Check if Web3 is initialized
      if (!isWeb3Initialized()) {
        const initialized = await initWeb3();
        if (!initialized) {
          console.warn('Using fallback provider in read-only mode');
        }
      }

      const isDuplicate = await checkDuplicateCertificate(formData.studentId, formData.course);
      if (isDuplicate) {
        throw new Error('A certificate for this student and course already exists.');
      }

      // Generate blockchain-based certificate ID
      const newCertificateId = generateCertificateId(
        formData.studentId,
        formData.studentName,
        formData.course,
        formData.university
      );

      setCertificateId(newCertificateId);

      // Generate PDF preview
      const pdf = await generateCertificatePDF(newCertificateId);
      const pdfBlob = pdf.output('blob');
      const previewUrl = URL.createObjectURL(pdfBlob);
      setPreviewUrl(previewUrl);

      // Issue certificate on blockchain if MetaMask is connected
      if (hasMetaMask) {
        setBlockchainStatus('pending');
        try {
          const receipt = await issueCertificateOnBlockchain(
            newCertificateId,
            formData.studentId,
            formData.studentName,
            formData.course,
            formData.university
          );

          setBlockchainStatus('success');
          setBlockchainTxHash(receipt.transactionHash);

          // Save certificate data to the database with blockchain transaction hash
          const { error: dbError } = await supabase.from('certificates').insert({
            certificate_id: newCertificateId,
            student_id: formData.studentId,
            student_name: formData.studentName,
            course: formData.course,
            university: formData.university,
            blockchain_tx_hash: receipt.transactionHash,
            blockchain_verified: true
          });

          if (dbError) {
            console.error('Database error:', dbError);
            throw new Error('Failed to save certificate to database: ' + dbError.message);
          }

          setSuccess(true);
        } catch (blockchainError: any) {
          console.error('Blockchain error:', blockchainError);
          setBlockchainStatus('error');

          // Still save to database but mark as not blockchain verified
          const { error: dbError } = await supabase.from('certificates').insert({
            certificate_id: newCertificateId,
            student_id: formData.studentId,
            student_name: formData.studentName,
            course: formData.course,
            university: formData.university,
            blockchain_verified: false
          });

          if (dbError) {
            console.error('Database error:', dbError);
            throw new Error('Failed to save certificate to database: ' + dbError.message);
          }

          // Still mark as success since we saved to database
          setSuccess(true);
        }
      } else {
        // Save to database without blockchain verification
        const { error: dbError } = await supabase.from('certificates').insert({
          certificate_id: newCertificateId,
          student_id: formData.studentId,
          student_name: formData.studentName,
          course: formData.course,
          university: formData.university,
          blockchain_verified: false
        });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error('Failed to save certificate to database: ' + dbError.message);
        }

        setSuccess(true);
        setBlockchainStatus('error'); // Not really an error, but we're not using blockchain
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {!previewUrl ? (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-8">
            <FileCheck className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Generate Blockchain Certificate</h1>
          </div>

          <BlockchainStatus />

          {showMetaMaskGuide && <MetaMaskGuide />}

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <input
                  type="text"
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                  Student Name
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                  Course
                </label>
                <input
                  type="text"
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                  University
                </label>
                <input
                  type="text"
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Generate Certificate
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Certificate generated successfully!
            </div>
          )}

          {blockchainStatus === 'pending' && (
            <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Registering certificate on Ethereum blockchain...
            </div>
          )}

          {blockchainStatus === 'success' && (
            <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 mr-2" />
                <span className="font-medium">Certificate registered on Ethereum blockchain!</span>
              </div>
              {blockchainTxHash && (
                <div className="text-sm mt-1">
                  <p>Transaction Hash:</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${blockchainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {blockchainTxHash}
                  </a>
                </div>
              )}
            </div>
          )}

          {blockchainStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {!hasMetaMask ? (
                <div>
                  <p className="font-medium">Certificate saved without blockchain verification</p>
                  <p className="text-sm mt-1">Install MetaMask to enable blockchain verification for future certificates.</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Failed to register certificate on blockchain</p>
                  <p className="text-sm mt-1">The certificate is still valid and stored in our database.</p>
                </div>
              )}
            </div>
          )}

          <div className="aspect-[1.414] w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="Certificate Preview"
            />
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setSuccess(false);
                setBlockchainStatus(null);
                setBlockchainTxHash(null);
                setFormData({
                  studentId: '',
                  studentName: '',
                  course: '',
                  university: ''
                });
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Generate Another Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateCertificate;