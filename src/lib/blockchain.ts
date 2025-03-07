import { ethers } from 'ethers';
import keccak256 from 'keccak256';

// ABI for the Certificate smart contract
const certificateContractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "certificateId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "course",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "university",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "certificates",
    "outputs": [
      {
        "internalType": "string",
        "name": "certificateId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "studentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "course",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "university",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "certificateId",
        "type": "string"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "certificateId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "studentId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "studentName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "course",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "university",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "issuer",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct CertificateContract.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "certificateId",
        "type": "string"
      }
    ],
    "name": "isCertificateValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "certificateId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "studentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "course",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "university",
        "type": "string"
      }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address on Sepolia testnet
const CONTRACT_ADDRESS = '0xD2afa4f1a7D4Bd0b8Aff8496dDFa5332DA423ee2';

const PUBLIC_RPC_ENDPOINTS = [
  'https://eth-sepolia.public.blastapi.io',
  'https://rpc.sepolia.org',
  'https://rpc2.sepolia.org',
  'https://sepolia.gateway.tenderly.co'
];

let provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;
let metamaskInstalled = false;
let pendingRequest = false;

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.ethereum !== undefined;
};

export const initWeb3 = async (): Promise<boolean> => {
  try {
    metamaskInstalled = isMetaMaskInstalled();
    
    if (metamaskInstalled) {
      provider = new ethers.BrowserProvider(window.ethereum);
      
      try {
        if (pendingRequest) {
          console.log('A request is already pending. Please check MetaMask.');
          return false;
        }
        
        pendingRequest = true;
        
        try {
          await Promise.race([
            provider.send("eth_requestAccounts", []),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timed out. Please check MetaMask extension.')), 5000)
            )
          ]);
        } catch (timeoutError) {
          console.warn('MetaMask connection timed out or was rejected:', timeoutError);
          pendingRequest = false;
          return await initFallbackProvider();
        }
        
        pendingRequest = false;
        
        const signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, certificateContractABI, signer);
        
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111n) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
            window.location.reload();
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0xaa36a7',
                      chainName: 'Sepolia Test Network',
                      nativeCurrency: {
                        name: 'Sepolia ETH',
                        symbol: 'ETH',
                        decimals: 18
                      },
                      rpcUrls: PUBLIC_RPC_ENDPOINTS,
                      blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }
                  ],
                });
              } catch (addError) {
                console.error('Error adding Sepolia network to MetaMask:', addError);
              }
            }
            console.error('Error switching to Sepolia network:', switchError);
          }
        }
        
        return true;
      } catch (error) {
        console.error('User denied account access or other MetaMask error:', error);
        pendingRequest = false;
        return await initFallbackProvider();
      }
    } else {
      return await initFallbackProvider();
    }
  } catch (error) {
    console.error('Error initializing Web3:', error);
    return await initFallbackProvider();
  }
};

const initFallbackProvider = async (): Promise<boolean> => {
  try {
    console.log('Using fallback provider for read-only access');
    
    for (const rpcUrl of PUBLIC_RPC_ENDPOINTS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber(); // Test the connection
        
        // Initialize contract with provider
        contract = new ethers.Contract(CONTRACT_ADDRESS, certificateContractABI, provider);
        
        // Verify contract exists and has code
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
          console.warn(`No contract found at ${CONTRACT_ADDRESS} on ${rpcUrl}`);
          continue;
        }
        
        console.log(`Connected to Sepolia via ${rpcUrl}`);
        return true;
      } catch (err) {
        console.warn(`Failed to connect to ${rpcUrl}, trying next endpoint...`);
        continue;
      }
    }
    
    console.error('All RPC endpoints failed');
    provider = null;
    contract = null;
    return false;
  } catch (error) {
    console.error('Error initializing fallback provider:', error);
    return false;
  }
};

export const isWeb3Initialized = (): boolean => {
  return provider !== null && contract !== null;
};

export const getCurrentAccount = async (): Promise<string | null> => {
  if (!provider) return null;
  
  try {
    if (provider instanceof ethers.BrowserProvider) {
      const accounts = await provider.send("eth_accounts", []);
      return accounts[0] || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

export const generateCertificateId = (
  studentId: string,
  studentName: string,
  course: string,
  university: string,
  timestamp: number = Date.now()
): string => {
  if (!studentId || !studentName || !course || !university) {
    throw new Error('All certificate fields are required');
  }

  try {
    const payload = {
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      course: course.trim(),
      university: university.trim(),
      timestamp,
      nonce: Math.floor(Math.random() * 1000000)
    };

    const payloadBytes = ethers.toUtf8Bytes(JSON.stringify(payload));
    const hash = ethers.keccak256(payloadBytes);
    const formattedHash = `${hash.substring(2, 10)}`.toUpperCase();
    
    return formattedHash;
  } catch (error) {
    console.error('Error generating certificate ID:', error);
    const fallbackInput = `${studentId}-${studentName}-${course}-${university}-${timestamp}-${Math.random()}`;
    const fallbackHash = ethers.keccak256(ethers.toUtf8Bytes(fallbackInput));
    return `${fallbackHash.substring(2, 14).toUpperCase()}`;
  }
};

export const issueCertificateOnBlockchain = async (
  certificateId: string,
  studentId: string,
  studentName: string,
  course: string,
  university: string
): Promise<any> => {
  if (!provider || !contract) {
    const initialized = await initWeb3();
    if (!initialized || !provider || !contract) {
      throw new Error('Web3 or contract not initialized');
    }
  }
  
  try {
    if (provider instanceof ethers.BrowserProvider) {
      const signer = await provider.getSigner();
      
      if (!signer) {
        throw new Error('No Ethereum account connected');
      }
      
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.issueCertificate(
        certificateId,
        studentId,
        studentName,
        course,
        university
      );
      await tx.wait();
      const receipt = await tx.wait();
      return receipt;
    } else {
      throw new Error('Read-only provider cannot issue certificates. Please connect with MetaMask.');
    }
  } catch (error) {
    console.error('Error issuing certificate on blockchain:', error);
    throw error;
  }
};

export const verifyCertificateOnBlockchain = async (certificateId: string): Promise<any> => {
  if (!provider || !contract) {
    const initialized = await initWeb3();
    if (!initialized || !provider || !contract) {
      throw new Error('Failed to initialize Web3');
    }
  }
  
  try {
    // Try to get certificate data directly instead of using isCertificateValid
    const certificateData = await contract.certificates(certificateId);
    
    if (!certificateData || !certificateData.exists) {
      return null;
    }
    
    return {
      certificateId: certificateData.certificateId,
      studentId: certificateData.studentId,
      studentName: certificateData.studentName,
      course: certificateData.course,
      university: certificateData.university,
      timestamp: certificateData.timestamp,
      issuer: certificateData.issuer,
      exists: certificateData.exists
    };
  } catch (error) {
    console.error('Error verifying certificate on blockchain:', error);
    throw error;
  }
};

export const isValidCertificateId = (certificateId: string): boolean => {
  const certIdRegex = /^[0-9A-F]{8}$/;
  return certIdRegex.test(certificateId);
};

export const extractCertificateMetadata = (certificateId: string) => {
  if (!isValidCertificateId(certificateId)) {
    return null;
  }
  
  const parts = certificateId.split('-');
  
  return {
    prefix: parts[0],
    blockchainPrefix: parts[1],
    segmentA: parts[2],
    segmentB: parts[3]
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}