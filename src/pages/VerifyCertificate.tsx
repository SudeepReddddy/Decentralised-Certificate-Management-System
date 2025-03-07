import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, CheckCircle, XCircle, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { 
  isValidCertificateId, 
  verifyCertificateOnBlockchain, 
  initWeb3, 
  isWeb3Initialized 
} from '../lib/blockchain';
import BlockchainStatus from '../components/BlockchainStatus';

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState('');
  const [blockchainVerified, setBlockchainVerified] = useState<boolean | null>(null);
  const [blockchainData, setBlockchainData] = useState<any>(null);

  useEffect(() => {
    // Initialize Web3 when component mounts
    if (!isWeb3Initialized()) {
      initWeb3().catch(err => {
        console.error('Failed to initialize Web3:', err);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCertificate(null);
    setBlockchainVerified(null);
    setBlockchainData(null);

    try {
      // First validate the certificate ID format
      const trimmedCertId = certificateId.trim();
      
      if (!isValidCertificateId(trimmedCertId) && !trimmedCertId.startsWith('CERT-')) {
        throw new Error('Invalid certificate ID format. Please check and try again.');
      }

      // Use array() instead of single() to avoid the PGRST116 error
      const { data, error: searchError } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_id', trimmedCertId);

      if (searchError) throw searchError;

      if (data && data.length > 0) {
        setCertificate(data[0]);
        
        // Verify on blockchain
        try {
          // Initialize Web3 if not already initialized
          if (!isWeb3Initialized()) {
            await initWeb3();
          }
          
          const blockchainCertificate = await verifyCertificateOnBlockchain(trimmedCertId);
          
          if (blockchainCertificate) {
            setBlockchainVerified(true);
            setBlockchainData(blockchainCertificate);
          } else {
            setBlockchainVerified(false);
          }
        } catch (blockchainError) {
          console.error('Blockchain verification error:', blockchainError);
          setBlockchainVerified(false);
        }
      } else {
        setError('Certificate not found. Please check the ID and try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <Search className="h-12 w-12 text-green-600 mr-4" />
          <h1 className="text-3xl font-bold text-gray-900">Verify Certificate</h1>
        </div>

        <BlockchainStatus />

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter Certificate ID"
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
              required
            />
            <button
              type="submit"
              disabled={loading || !certificateId.trim()}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-6 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center text-red-700 mb-4">
              <XCircle className="h-8 w-8 mr-3" />
              <h2 className="text-xl font-semibold">Certificate Not Found</h2>
            </div>
            <p className="text-red-600 ml-11">{error}</p>
          </div>
        )}

        {certificate && (
          <div className="bg-green-50 p-8 rounded-lg border border-green-100">
            <div className="flex items-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-semibold text-green-800">Certificate Verified!</h2>
            </div>
            
            {/* Blockchain verification badge */}
            {blockchainVerified === true && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-800">Ethereum Blockchain Verified</h3>
                  <p className="text-sm text-blue-600">This certificate has been verified on the Ethereum blockchain</p>
                  {blockchainData && blockchainData.issuer && (
                    <p className="text-xs text-blue-500 mt-1">
                      Issued by: {blockchainData.issuer.substring(0, 6)}...{blockchainData.issuer.substring(blockchainData.issuer.length - 4)}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {blockchainVerified === false && (
              <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
                <div>
                  <h3 className="font-medium text-yellow-800">Database Verified Only</h3>
                  <p className="text-sm text-yellow-600">This certificate is verified in our database but not on the blockchain</p>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Certificate ID</h3>
                <p className="text-lg font-semibold text-gray-900">{certificate.certificate_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Student Name</h3>
                <p className="text-lg font-semibold text-gray-900">{certificate.student_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Student ID</h3>
                <p className="text-lg font-semibold text-gray-900">{certificate.student_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Course</h3>
                <p className="text-lg font-semibold text-gray-900">{certificate.course}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">University</h3>
                <p className="text-lg font-semibold text-gray-900">{certificate.university}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Issue Date</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(certificate.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {certificate.blockchain_tx_hash && (
              <div className="mt-6 pt-6 border-t border-green-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Blockchain Transaction</h3>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${certificate.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm"
                >
                  {certificate.blockchain_tx_hash}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;