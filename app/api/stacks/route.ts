// app/api/stacks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StacksApiService } from '@/app/services/stacksApiService';

// API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const network = searchParams.get('network') || 'mainnet';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  // Validate network parameter
  if (network !== 'mainnet' && network !== 'testnet') {
    return NextResponse.json({ error: 'Invalid network parameter' }, { status: 400 });
  }
  
  try {
    const stacksApi = new StacksApiService(network as 'mainnet' | 'testnet');
    let data;
    
    switch (type) {
      case 'transaction':
        if (!id) {
          return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }
        data = await stacksApi.getTransaction(id);
        break;
        
      case 'address':
        if (!id) {
          return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }
        data = await stacksApi.getAddressData(id, limit);
        break;
        
      case 'block':
        if (!id) {
          return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }
        data = await stacksApi.getBlock(id);
        break;
        
      case 'recent-blocks':
        data = await stacksApi.getRecentBlocks(limit);
        break;
        
      case 'recent-transactions':
        data = await stacksApi.getRecentTransactions(limit);
        break;
        
      case 'sbtc':
        data = await stacksApi.getSbtcOperations(limit);
        break;
        
      case 'mempool':
        data = await stacksApi.getMempoolInfo();
        break;
        
      case 'fee-estimate':
        data = await stacksApi.getFeeEstimate();
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error processing ${type} request:`, error);
    return NextResponse.json({ 
      error: `Failed to fetch ${type} data`, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const runtime = 'edge';