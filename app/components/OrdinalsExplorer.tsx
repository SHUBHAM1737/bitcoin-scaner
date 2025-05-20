'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight,
  Hash,
  ImageIcon,
  Layers,
  Info,
  FileText,
  Code,
  ExternalLink
} from 'lucide-react';
import { formatAddress, formatDate } from '../utils/formatUtils';
import { RebarLabsService } from '@/app/services/rebarLabsService';

const OrdinalsExplorer: React.FC = () => {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [selectedInscription, setSelectedInscription] = useState<any | null>(null);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    mime_type: [] as string[],
    from_number: '',
    to_number: '',
  });
  
  const rebarService = new RebarLabsService();
  
  useEffect(() => {
    fetchInscriptions();
  }, []);
  
  const fetchInscriptions = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      // Filter params for inscriptions
      const params: any = {};
      if (searchParams.mime_type.length > 0) {
        params.mime_type = searchParams.mime_type;
      }
      if (searchParams.from_number) {
        params.from_number = searchParams.from_number;
      }
      if (searchParams.to_number) {
        params.to_number = searchParams.to_number;
      }
      
      const result = await rebarService.getInscriptions(params, 20, 0);
      
      if (result && result.results) {
        setInscriptions(result.results);
      } else {
        setError('Failed to fetch inscriptions data');
      }
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch inscriptions data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const fetchInscriptionDetail = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await rebarService.getInscription(id);
      
      if (result) {
        setSelectedInscription(result);
      } else {
        setError('Failed to fetch inscription data');
      }
    } catch (error) {
      console.error('Error fetching inscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch inscription data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchInscriptionContent = async (id: string) => {
    try {
      setIsLoadingContent(true);
      setError(null);
      
      const result = await rebarService.getInscriptionContent(id);
      
      if (result) {
        setSelectedContent(result);
      } else {
        setError('Failed to fetch inscription content');
      }
    } catch (error) {
      console.error('Error fetching inscription content:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch inscription content');
    } finally {
      setIsLoadingContent(false);
    }
  };
  
  const handleInscriptionClick = (inscription: any) => {
    setSelectedInscription(inscription);
    fetchInscriptionContent(inscription.id);
  };
  
  const handleSearch = () => {
    if (searchTerm) {
      // If search term looks like an inscription ID
      if (searchTerm.match(/^[a-fA-F0-9]{64}i[0-9]+$/)) {
        fetchInscriptionDetail(searchTerm);
      } 
      // If search term looks like an inscription number
      else if (/^\d+$/.test(searchTerm)) {
        setSearchParams({
          ...searchParams,
          from_number: searchTerm,
          to_number: searchTerm
        });
        fetchInscriptions();
      } else {
        // Search by other criteria
        fetchInscriptions();
      }
    } else {
      fetchInscriptions();
    }
  };
  
  const handleBackToList = () => {
    setSelectedInscription(null);
    setSelectedContent(null);
  };
  
  const handleRefresh = () => {
    if (selectedInscription) {
      const inscriptionId = selectedInscription.id;
      fetchInscriptionDetail(inscriptionId);
      fetchInscriptionContent(inscriptionId);
    } else {
      fetchInscriptions();
    }
  };
  
  const handleMimeTypeFilter = (mimeType: string) => {
    const updatedMimeTypes = [...searchParams.mime_type];
    const index = updatedMimeTypes.indexOf(mimeType);
    
    if (index > -1) {
      updatedMimeTypes.splice(index, 1);
    } else {
      updatedMimeTypes.push(mimeType);
    }
    
    setSearchParams({
      ...searchParams,
      mime_type: updatedMimeTypes
    });
  };
  
  // Filter inscriptions based on search term
  const filteredInscriptions = inscriptions.filter(inscription => 
    inscription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inscription.number.toString().includes(searchTerm) ||
    (inscription.content_type && inscription.content_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get inscription content type icon
  const getContentTypeIcon = (mimeType: string) => {
    if (!mimeType) return <FileText className="w-5 h-5 text-gray-500" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-green-500" />;
    } else if (mimeType.startsWith('text/')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    } else if (mimeType.startsWith('application/json') || mimeType.includes('javascript')) {
      return <Code className="w-5 h-5 text-purple-500" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Render content based on mime type
  const renderInscriptionContent = () => {
    if (!selectedInscription || !selectedContent) return null;
    
    const { mime_type, content_type } = selectedInscription;
    
    if (!mime_type) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No content available or unable to render content</p>
        </div>
      );
    }
    
    if (mime_type.startsWith('image/')) {
      // For images, create a data URL
      const contentData = JSON.stringify(selectedContent);
      return (
        <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
          <img 
            src={`https://ordinals.com/content/${selectedInscription.id}`} 
            alt="Inscription" 
            className="max-w-full max-h-96 object-contain rounded"
          />
        </div>
      );
    } else if (mime_type.startsWith('text/')) {
      // For text content
      const contentString = JSON.stringify(selectedContent, null, 2);
      return (
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{contentString}</pre>
        </div>
      );
    } else {
      // For other content types
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Content type: {mime_type}</p>
          <p className="text-gray-500 mt-2">View on Ordinals Explorer:</p>
          <a 
            href={`https://ordinals.com/inscription/${selectedInscription.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
          >
            <span>{selectedInscription.id.substring(0, 16)}...</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for an inscription by ID or number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2 pt-1">Filters:</span>
          <button
            onClick={() => handleMimeTypeFilter('image/png')}
            className={`px-3 py-1 text-xs rounded-full ${
              searchParams.mime_type.includes('image/png')
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            PNG
          </button>
          <button
            onClick={() => handleMimeTypeFilter('image/jpeg')}
            className={`px-3 py-1 text-xs rounded-full ${
              searchParams.mime_type.includes('image/jpeg')
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            JPEG
          </button>
          <button
            onClick={() => handleMimeTypeFilter('text/plain')}
            className={`px-3 py-1 text-xs rounded-full ${
              searchParams.mime_type.includes('text/plain')
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => handleMimeTypeFilter('application/json')}
            className={`px-3 py-1 text-xs rounded-full ${
              searchParams.mime_type.includes('application/json')
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inscription Details View */}
      {selectedInscription ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="flex items-center">
              {getContentTypeIcon(selectedInscription.mime_type)}
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                Inscription #{selectedInscription.number}
              </h2>
            </div>
            <button
              onClick={handleBackToList}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Inscription Information */}
            <div className="space-y-6">
              {/* Basic Inscription Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Inscription Details</h3>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">ID</span>
                    <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Number</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Content Type</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.content_type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MIME Type</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.mime_type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Content Size</span>
                    <span className="text-gray-900 font-medium">
                      {selectedInscription.content_length ? `${selectedInscription.content_length} bytes` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timestamp</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(selectedInscription.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Genesis Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Genesis Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genesis Block</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.genesis_block_height}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Genesis Transaction</span>
                    <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.genesis_tx_id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Genesis Address</span>
                    <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.genesis_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genesis Fee</span>
                    <span className="text-gray-900 font-medium">
                      {selectedInscription.genesis_fee ? `${parseInt(selectedInscription.genesis_fee) / 100000000} BTC` : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content and Satoshi Info */}
            <div className="space-y-6">
              {/* Satoshi Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Satoshi Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sat Ordinal</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.sat_ordinal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sat Rarity</span>
                    <span className="text-gray-900 font-medium capitalize">{selectedInscription.sat_rarity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coinbase Height</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.sat_coinbase_height}</span>
                  </div>
                </div>
              </div>

              {/* Current Location */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Current Location</h3>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Current Address</span>
                    <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.address}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">Output</span>
                    <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.output}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Offset</span>
                    <span className="text-gray-900 font-medium">{selectedInscription.offset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Value</span>
                    <span className="text-gray-900 font-medium">
                      {selectedInscription.value ? `${parseInt(selectedInscription.value) / 100000000} BTC` : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Properties */}
              {(selectedInscription.recursive || selectedInscription.curse_type || selectedInscription.parent) && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-3">Special Properties</h3>
                  <div className="space-y-3">
                    {selectedInscription.recursive && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recursive</span>
                        <span className="text-gray-900 font-medium">Yes</span>
                      </div>
                    )}
                    {selectedInscription.curse_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Curse Type</span>
                        <span className="text-gray-900 font-medium">{selectedInscription.curse_type}</span>
                      </div>
                    )}
                    {selectedInscription.parent && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Parent</span>
                        <span className="text-gray-900 font-mono text-sm break-all">{selectedInscription.parent}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div className="border-t">
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Content Preview</h3>
              
              {isLoadingContent ? (
                <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                  <span>Loading content...</span>
                </div>
              ) : (
                renderInscriptionContent()
              )}
              
              <div className="mt-4 flex justify-center">
                <a 
                  href={`https://ordinals.com/inscription/${selectedInscription.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <span>View on Ordinals Explorer</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Inscriptions List View */
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Ordinals Explorer</h2>
            <p className="text-gray-500 mt-1">Browse and explore Bitcoin Ordinals inscriptions powered by Rebar Labs</p>
          </div>

          {isLoading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredInscriptions.length > 0 ? (
            <div className="divide-y">
              {filteredInscriptions.map((inscription) => (
                <div 
                  key={inscription.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => handleInscriptionClick(inscription)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getContentTypeIcon(inscription.mime_type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Inscription #{inscription.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inscription.mime_type || 'Unknown type'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-2">
                        <div className="text-sm font-medium">
                          {formatDate(inscription.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {inscription.sat_rarity && `Rarity: ${inscription.sat_rarity}`}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No inscriptions found matching your search' : 'No inscriptions found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdinalsExplorer;