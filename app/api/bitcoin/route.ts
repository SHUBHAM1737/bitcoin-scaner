import { NextRequest, NextResponse } from 'next/server';
import { BITCOIN_NETWORKS, DEFAULT_BITCOIN_NETWORK } from '@/app/config/blockchain';

// Function to fetch Bitcoin transaction data
async function fetchBitcoinTransaction(txid: string, network = DEFAULT_BITCOIN_NETWORK) {
  const networkConfig = BITCOIN_NETWORKS[network];
  
  try {
    const response = await fetch(`${networkConfig.txUrl}${txid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }
    
    const txData = await response.json();
    return txData;
  } catch (error) {
    console.error('Error fetching Bitcoin transaction:', error);
    throw error;
  }
}

// Function to fetch Bitcoin address data
async function fetchBitcoinAddress(address: string, network = DEFAULT_BITCOIN_NETWORK) {
  const networkConfig = BITCOIN_NETWORKS[network];
  
  try {
    const response = await fetch(`${networkConfig.addressUrl}${address}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch address data: ${response.statusText}`);
    }
    
    const addressData = await response.json();
    return addressData;
  } catch (error) {
    console.error('Error fetching Bitcoin address:', error);
    throw error;
  }
}

// Function to fetch Bitcoin block data
async function fetchBitcoinBlock(blockHash: string, network = DEFAULT_BITCOIN_NETWORK) {
  const networkConfig = BITCOIN_NETWORKS[network];
  
  try {
    const response = await fetch(`${networkConfig.blockUrl}${blockHash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch block data: ${response.statusText}`);
    }
    
    const blockData = await response.json();
    return blockData;
  } catch (error) {
    console.error('Error fetching Bitcoin block:', error);
    throw error;
  }
}

// API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const network = searchParams.get('network') || DEFAULT_BITCOIN_NETWORK;
  
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }
  
  try {
    let data;
    
    switch (type) {
      case 'transaction':
        data = await fetchBitcoinTransaction(id, network as any);
        break;
      case 'address':
        data = await fetchBitcoinAddress(id, network as any);
        break;
      case 'block':
        data = await fetchBitcoinBlock(id, network as any);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error processing ${type} request:`, error);
    return NextResponse.json({ error: `Failed to fetch ${type} data` }, { status: 500 });
  }
}

export const runtime = 'edge';