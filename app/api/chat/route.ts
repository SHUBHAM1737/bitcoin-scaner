// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { BitcoinAnalyzerService } from '@/app/services/bitcoinAnalyzerService';
import { getTransactionType } from '@/app/utils/addressValidator';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// System prompt for general transaction analysis
const SYSTEM_PROMPT = `You are BitcoinInsightAI, an advanced AI-powered blockchain transaction analyzer specializing in Bitcoin and sBTC on the Stacks blockchain. Provide deep insights about transactions in a specific format for the BitcoinInsightAI Explorer interface.

IMPORTANT FORMATTING RULES:
1. You MUST first create a Mermaid diagram visualization of the transaction.
2. You MUST use the exact section headers and format below.
3. Your response MUST start with a mermaid diagram inside triple backticks.

Format your entire response exactly as follows:

\`\`\`mermaid
graph LR
    %% Node Styling
    classDef wallet fill:#f7931a,stroke:#c27214,stroke-width:2px;
    classDef contract fill:#5546FF,stroke:#3b30c9,stroke-width:2px;
    classDef value fill:#fff1e5,stroke:#b35900,stroke-width:2px;

    %% Create nodes for sender, receiver, and any contracts
    A[From: 0x123...] -->|transfer value| B[To: 0x456...]
    %% Replace this with actual transaction flow
    
    %% Apply styling
    class A wallet;
    class B wallet;
\`\`\`

---Section---
TRANSACTION OVERVIEW:
- Type: [Transaction Type] (Complexity score: Simple/Moderate/Complex/Very Complex)
- Brief summary of what occurred in 8-10 sentences.
- Number of inputs/outputs or contract interactions involved
- Notable features or patterns

---Section---
NETWORK DETAILS:
- Chain: [Chain Name] (Bitcoin or Stacks)
- Block Height: [number]
- Timestamp: [date and time]
- Confirmations: [number]
- Network Status: [Mainnet/Testnet]

---Section---
TRANSFER ANALYSIS:`;

// Bitcoin-specific analysis format
const BITCOIN_ANALYSIS_FORMAT = `
For Bitcoin transactions:

---Sub Section---
Inputs:
- Address: [address]
- Amount: [value] BTC
- Type: [P2PKH, P2SH, etc.]

---Sub Section---
Outputs:
- Address: [address]
- Amount: [value] BTC
- Type: [P2PKH, P2SH, etc.]
- Spent: [Yes/No/Unknown]

---Section---
FEE ANALYSIS:
- Fee Paid: [value] BTC
- Fee Rate: [value] sats/vB
- Efficiency: [comparison to network average]
`;

// Stacks-specific analysis format
const STACKS_ANALYSIS_FORMAT = `
For Stacks transactions:

---Sub Section---
STX Transfers:
- Amount: [value] STX
- From: [address]
- To: [address]
- Memo: [if available]

---Sub Section---
sBTC Operations:
- Type: [Deposit, Withdrawal, Transfer, etc.]
- Amount: [value] sBTC
- From: [address]
- To: [address]
- Status: [Completed, Pending, etc.]
- Associated Bitcoin Transaction: [hash if available]

---Sub Section---
Contract Interactions:
- Contract: [contract name and address]
- Function: [function name]
- Arguments: [simplified function arguments]
- Purpose: [brief description of function purpose]

---Section---
FEE ANALYSIS:
- Fee Paid: [value] STX
- Fee Rate: [value] µSTX
- Efficiency: [comparison to network average]
- For sBTC transactions, explain both Bitcoin and Stacks fees if applicable
`;

// BIP300 Sidechain analysis format
const SIDECHAIN_ANALYSIS_FORMAT = `
For BIP300 Sidechain transactions:

---Sub Section---
Transfers:
- Amount: [value] BTC
- From: [address]
- To: [address]
- Type: [transfer, deposit, withdrawal, etc.]

---Sub Section---
Operations:
- Type: [operation type]
- Description: [detailed description of the operation]
- Status: [Completed, Pending, etc.]
- Associated Bitcoin Transaction: [hash if available]

---Sub Section---
Contract Interactions:
- Contract: [contract name and address]
- Function: [function name]
- Arguments: [simplified function arguments]
- Purpose: [brief description of function purpose]

---Section---
FEE ANALYSIS:
- Fee Paid: [value] BTC
- Fee Rate: [value] sats/byte
- Efficiency: [comparison to network average]
- Security considerations related to fee
`;

// Common completion format for both chains
const COMMON_COMPLETION_FORMAT = `
---Section---
SECURITY ASSESSMENT:
Risk Level: [Low/Medium/High]
- Contract verification status if applicable
- Known risks or warnings for sBTC operations
- Notable security considerations

---Section---
ADDITIONAL INSIGHTS:
- Context about this transaction type in the Bitcoin/Stacks ecosystem
- How this transaction relates to sBTC and Bitcoin's programmability
- Recommendations for similar transactions or optimization
- For developers: relevant API endpoints or contract methods`;

// POST handler for chat API
export async function POST(req) {
  try {
    // Parse request
    const { messages, txHash, network, subNetwork } = await req.json();
    
    // Add transaction hash info to the last message if provided
    const userMessages = [...messages];
    let transactionData = null;
    let transactionNetwork = network || 'bitcoin';
    let selectedSubNetwork = subNetwork || 'mainnet';
    
    if (txHash && typeof txHash === 'string' && txHash.trim() !== '') {
      // Determine transaction type
      const txType = getTransactionType(txHash);
      if (txType === 'bitcoin') {
        transactionNetwork = 'bitcoin';
      } else if (txType === 'stacks') {
        transactionNetwork = 'stacks';
      }
      
      try {
        console.log(`Analyzing ${transactionNetwork} transaction: ${txHash}`);
        
        // Ensure Stacks txs always have 0x prefix
        const normalizedTxHash = 
          transactionNetwork === 'stacks' && !txHash.startsWith('0x') 
            ? `0x${txHash}` 
            : txHash;
        
        // Fetch transaction data
        const analysis = await BitcoinAnalyzerService.analyzeTransaction(
          normalizedTxHash, 
          transactionNetwork as 'bitcoin' | 'stacks', 
          selectedSubNetwork as 'mainnet' | 'testnet'
        );
        
        transactionData = analysis.data;
        
        console.log('Transaction analysis successful, data:', 
          JSON.stringify(transactionData, null, 2).substring(0, 200) + '...');
        
        // If the last message doesn't include the transaction hash, append it
        const lastMsg = userMessages[userMessages.length - 1];
        if (lastMsg.role === 'user' && !lastMsg.content.includes(txHash)) {
          userMessages[userMessages.length - 1] = {
            ...lastMsg,
            content: `Analyze this ${transactionNetwork} transaction in detail: ${txHash}`
          };
        }
      } catch (error) {
        console.error('Error analyzing transaction:', error);
      }
    }
    
    // Construct the appropriate system prompt based on the transaction type
    let fullSystemPrompt = SYSTEM_PROMPT;
    
    if (transactionNetwork === 'bitcoin') {
      fullSystemPrompt += BITCOIN_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
    } else if (transactionNetwork === 'stacks') {
      fullSystemPrompt += STACKS_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
    } else if (transactionNetwork.startsWith('sidechain-')) {
      const sidechainType = transactionNetwork.split('-')[1];
      
      console.log(`Analyzing ${sidechainType} sidechain transaction: ${txHash}`);
      
      // Add the sidechain-specific system prompt
      fullSystemPrompt += SIDECHAIN_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
      
      try {
        // Initialize the BIP300Service
        const bip300Service = new BIP300Service(sidechainType);
        
        // Try to fetch transaction data
        const txData = await bip300Service.getTransaction(txHash);
        
        // Add transaction data to the prompt
        transactionData = txData;
        
        console.log('Sidechain transaction analysis successful, data:', 
          JSON.stringify(transactionData, null, 2).substring(0, 200) + '...');
        
        // Make sure the last message includes the transaction hash
        const lastMsg = userMessages[userMessages.length - 1];
        if (lastMsg.role === 'user' && !lastMsg.content.includes(txHash)) {
          userMessages[userMessages.length - 1] = {
            ...lastMsg,
            content: `Analyze this ${sidechainType} sidechain transaction in detail: ${txHash}`
          };
        }
      } catch (error) {
        console.error('Error analyzing sidechain transaction:', error);
      }
      
      // Check if this is a block analysis request
      if (userMessages[userMessages.length - 1].content.includes('block')) {
        const sidechainType = transactionNetwork.split('-')[1];
        
        console.log(`Analyzing ${sidechainType} sidechain block: ${txHash}`);
        
        try {
          // Initialize the BIP300Service
          const bip300Service = new BIP300Service(sidechainType);
          
          // Try to fetch block data
          const blockData = await bip300Service.getBlock(txHash);
          
          // Add block data to the prompt
          transactionData = blockData;
          
          console.log('Sidechain block analysis successful, data:', 
            JSON.stringify(transactionData, null, 2).substring(0, 200) + '...');
          
          // Update the system prompt to include block specific information
          fullSystemPrompt += `\n\nYou are analyzing a BIP300 sidechain block. Include details about the block's structure, included transactions, and relationship to the main Bitcoin chain.`;
        } catch (error) {
          console.error('Error analyzing sidechain block:', error);
        }
      }
    } else {
      // If no specific transaction type, use both formats
      fullSystemPrompt += `
For Bitcoin transactions:
${BITCOIN_ANALYSIS_FORMAT}

For Stacks transactions:
${STACKS_ANALYSIS_FORMAT}
${COMMON_COMPLETION_FORMAT}`;
    }
    
    // Add any transaction data we fetched
    if (transactionData) {
      fullSystemPrompt += `\n\nHere is the transaction data, use it to enrich your analysis: ${JSON.stringify(transactionData, null, 2)}`;
      
      // Add special handling for Stacks transactions
      if (transactionNetwork === 'stacks') {
        fullSystemPrompt += `\n\nIMPORTANT STACKS TRANSACTION INSTRUCTIONS:

1. DO NOT use placeholder text like "[value] STX" or "[number]" in your response. Instead, use actual values from the transaction data.

2. If any data fields are missing, say "Not available" instead of using placeholders.

3. For Stacks transactions, always include these specific details:
   - Sender address: "${transactionData?.senderFull || transactionData?.sender || 'Not available'}"
   - Transaction status: "${transactionData?.status || 'Not available'}"
   - Transaction type: "${transactionData?.type || 'Not available'}"
   - Block height: ${transactionData?.blockHeight || 'Not available'}
   - Timestamp: "${transactionData?.timestamp || 'Not available'}"
   - Fee paid: ${transactionData?.fee || 'Not available'} STX
   
4. For token transfers, include:
   - Amount: ${transactionData?.value || 'Not available'} STX
   - Recipient: "${transactionData?.recipient || 'Not available'}"
   - Memo: "${transactionData?.memo || 'Not available'}"
   
5. For contract calls, include:
   - Contract ID: "${transactionData?.contractId || 'Not available'}"
   - Function name: "${transactionData?.functionName || 'Not available'}"
   
6. For sBTC operations, include all details from: ${JSON.stringify(transactionData?.sbtcDetails || {}, null, 2)}

This data is the source of truth - use it to fill in all relevant sections of your analysis.`;
      }
    }
    
    // Prepare messages array with system prompt
    const apiMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...userMessages,
    ];
    
    // Request to OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: apiMessages,
      temperature: 0.7,
      stream: true,
    });
    
    // Create a stream from the response
    const stream = OpenAIStream(response);
    
    // Return streaming response
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred during API call' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export const maxDuration = 300; // 5 minutes max duration
