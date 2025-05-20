'use client';
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import SbtcPositionTracker from './SbtcPositionTracker';
import SbtcOperationsList from './SbtcOperationsList';
import SbtcOperationViewer from './SbtcOperationViewer';
import { Bitcoin, List, Activity } from 'lucide-react';
import { formatAddress } from '@/app/utils/formatUtils';

interface SbtcAnalyticsTabProps {
  address?: string;
  txId?: string;
  network: 'mainnet' | 'testnet';
}

const SbtcAnalyticsTab: React.FC<SbtcAnalyticsTabProps> = ({ 
  address, 
  txId, 
  network = 'mainnet' 
}) => {
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('position');
  
  const handleSelectOperation = (operation: any) => {
    setSelectedOperation(operation);
    setActiveTab('details');
  };
  
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="flex items-center text-xl font-semibold text-gray-900">
          <Bitcoin className="w-6 h-6 text-amber-500 mr-2" />
          sBTC Analytics
        </h2>
        <p className="text-gray-500 mt-1">
          Track and analyze sBTC operations for {address ? formatAddress(address) : 'this address'}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="position" className="flex-1 flex items-center justify-center">
              <Activity className="w-4 h-4 mr-2" />
              <span>Position</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-1 flex items-center justify-center">
              <List className="w-4 h-4 mr-2" />
              <span>Operations</span>
            </TabsTrigger>
            {(selectedOperation || txId) && (
              <TabsTrigger value="details" className="flex-1 flex items-center justify-center">
                <Bitcoin className="w-4 h-4 mr-2" />
                <span>Details</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="position" className="p-6">
          <SbtcPositionTracker address={address} network={network} />
        </TabsContent>
        
        <TabsContent value="operations" className="p-6">
          <SbtcOperationsList 
            address={address} 
            network={network} 
            onSelectOperation={handleSelectOperation}
            limit={20}
          />
        </TabsContent>
        
        <TabsContent value="details" className="p-6">
          {selectedOperation ? (
            <SbtcOperationViewer txId={selectedOperation.txid} network={network} />
          ) : txId ? (
            <SbtcOperationViewer txId={txId} network={network} />
          ) : (
            <div className="bg-gray-50 p-6 text-center rounded-lg">
              <p>Select an operation to view details</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SbtcAnalyticsTab;