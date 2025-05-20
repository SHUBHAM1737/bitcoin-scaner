'use client';
import React, { useState, useEffect } from 'react';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';
import { Loader2, Bitcoin, ArrowRight, Hash, AlertTriangle, Info } from 'lucide-react';
import { RebarLabsService } from '@/app/services/rebarLabsService';

interface AddressActivityProps {
  address: string;
  type?: 'runes' | 'brc20';
}

const AddressActivity: React.FC<AddressActivityProps> = ({ 
  address, 
  type = 'runes' 
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const rebarService = new RebarLabsService();
  
  useEffect(() => {
    if (!address) return;
    
    fetchActivityData();
  }, [address, type]);
  
  const fetchActivityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result;
      if (type === 'runes') {
        result = await rebarService.getAddressActivity(address);
      } else {
        result = await rebarService.getBrc20Activity({ address });
      }
      
      if (result && result.results) {
        setActivities(result.results);
      } else {
        setError(`Failed to fetch ${type} activity data`);
      }
    } catch (error) {
      console.error(`Error fetching ${type} activity:`, error);
      setError(error instanceof Error ? error.message : `Failed to fetch ${type} activity data`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatAmount = (amount: string, divisibility: number = 2) => {
    if (!amount) return '0';
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum)) return '0';
    
    if (divisibility === 0) return amountNum.toString();
    
    const factor = Math.pow(10, divisibility);
    return (amountNum / factor).toFixed(divisibility);
  };
  
  // Format activity type for display
  const getActivityType = (operation: string, rune?: any) => {
    if (type === 'runes') {
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          operation === 'etching' ? 'bg-green-100 text-green-800 border border-green-200' :
          operation === 'transfer' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
          'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {operation.charAt(0).toUpperCase() + operation.slice(1)}
        </span>
      );
    } else {
      // BRC-20 activity
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          operation === 'deploy' ? 'bg-green-100 text-green-800 border border-green-200' :
          operation === 'mint' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
          operation === 'transfer' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
          operation === 'transfer_send' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
          'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {operation === 'transfer_send' ? 'Transfer Send' : operation.charAt(0).toUpperCase() + operation.slice(1)}
        </span>
      );
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900">
          Recent {type === 'runes' ? 'Runes' : 'BRC-20'} Activity
        </h3>
        <span className="text-sm text-gray-500">Powered by Rebar Labs</span>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
          <span>Loading activity...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg">
          <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No {type === 'runes' ? 'Runes' : 'BRC-20'} activity found for this address</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0 mt-1">
                    <Bitcoin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    {type === 'runes' ? (
                      <>
                        <div className="font-medium text-gray-900">
                          {activity.rune?.name || 'Unknown Rune'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatAmount(activity.amount, activity.rune?.divisibility || 2)} {activity.rune?.name || ''}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-gray-900">
                          {activity.ticker || 'Unknown Token'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {activity.mint?.amount || activity.transfer?.amount || '0'} {activity.ticker || ''}
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono">{formatAddress(activity.location?.tx_id || activity.tx_id)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {getActivityType(activity.operation, activity.rune)}
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(activity.location?.timestamp || activity.timestamp)}
                  </div>
                </div>
              </div>
              
              {(activity.address && activity.receiver_address) && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <div className="font-mono">
                    {formatAddress(activity.address)}
                  </div>
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                  <div className="font-mono">
                    {formatAddress(activity.receiver_address)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressActivity;