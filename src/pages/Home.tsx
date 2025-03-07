import React from 'react';
import { Link } from 'react-router-dom';
import { Award, FileCheck, Search, List, Shield } from 'lucide-react';
import BlockchainStatus from '../components/BlockchainStatus';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Certify
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A secure and efficient platform for generating, verifying, and managing blockchain-secured academic certificates.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <BlockchainStatus />
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Award className="h-12 w-12 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Generate Certificates</h2>
          <p className="text-gray-600 mb-4">
            Create secure, Ethereum blockchain-verified certificates with unique cryptographic IDs and QR codes.
          </p>
          <Link
            to="/generate"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Now
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <Search className="h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verify Certificates</h2>
          <p className="text-gray-600 mb-4">
            Instantly verify the authenticity of certificates using the Ethereum blockchain network.
          </p>
          <Link
            to="/verify"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Verify Now
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <List className="h-12 w-12 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">View All Certificates</h2>
          <p className="text-gray-600 mb-4">
            Access and manage all certificates issued through our Ethereum blockchain-secured system.
          </p>
          <Link
            to="/certificates"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            View All
          </Link>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg mb-12">
        <h2 className="text-2xl font-bold mb-6">How Blockchain Verification Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <FileCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Certificate Creation</h3>
            <p className="text-gray-600">
              When a certificate is created, a unique hash is generated using the certificate data and stored on the Ethereum blockchain.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Blockchain Registration</h3>
            <p className="text-gray-600">
              The certificate is registered on the Ethereum blockchain using a smart contract, creating an immutable record.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-purple-100 rounded-full p-4 mb-4">
              <Search className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Verification</h3>
            <p className="text-gray-600">
              Anyone can verify a certificate by checking its ID against the blockchain record, ensuring authenticity.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Why Choose Certify?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Ethereum Blockchain Security</h3>
              <p className="text-gray-600">
                Each certificate is secured with Ethereum blockchain technology, making them tamper-proof and permanently verifiable.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Award className="h-6 w-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Smart Contract Verification</h3>
              <p className="text-gray-600">
                Our Ethereum smart contracts ensure each certificate can be verified for authenticity at any time.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <FileCheck className="h-6 w-6 text-purple-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Easy Management</h3>
              <p className="text-gray-600">
                Efficiently manage and track all certificates in one centralized, blockchain-backed system.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Search className="h-6 w-6 text-orange-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Instant Verification</h3>
              <p className="text-gray-600">
                Verify any certificate instantly with our Ethereum blockchain verification system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;