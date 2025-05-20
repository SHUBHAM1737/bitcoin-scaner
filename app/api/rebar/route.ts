// app/api/rebar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { REBAR_API_URL } from '@/app/config/blockchain';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.REBAR_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Rebar API key not configured' }, { status: 500 });
    }
    
    // Construct the full URL
    const url = `${REBAR_API_URL}${endpoint}`;
    
    // Forward query parameters except 'endpoint'
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        queryParams.append(key, value);
      }
    });
    
    const requestUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    // Make the request to Rebar API
    const response = await fetch(requestUrl, {
      headers: {
        'Accept': '*/*',
        'X-Api-Key': apiKey,
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch data from Rebar API: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Rebar API proxy:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Rebar API',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge';