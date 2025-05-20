// app/api/blockchain-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }
    
    // Decode the URL if it was encoded
    try {
      url = decodeURIComponent(url);
    } catch (error) {
      console.error('Error decoding URL:', error);
      // If decoding fails, continue with the original URL
    }
    
    console.log('Fetching from URL:', url);
    
    // Configure fetch request with appropriate headers and timeout
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add API key if present for Hiro endpoints
    const apiKey = process.env.HIRO_API_KEY;
    if (apiKey && (url.includes('hiro.so') || url.includes('stacks.co'))) {
      headers['x-api-key'] = apiKey;
    }
    
    // Set a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Fetch data from the target URL
      const response = await fetch(url, { 
        headers,
        signal: controller.signal,
        // Add cache control to avoid stale data
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: `Failed to fetch data: ${response.status} ${response.statusText}`,
          url: url
        }, { status: response.status });
      }
      
      const data = await response.json();
      
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? (error.cause ? String(error.cause) : undefined) : undefined
    }, { status: 500 });
  }
}

export const runtime = 'edge';