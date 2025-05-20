// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { BitcoinAnalyzerService }
from '@/app/services/bitcoinAnalyzerService';
import { getTransactionType }
from '@/app/utils/addressValidator';
import { BIP300Service }
from '@/app/services/bip300Service';
import {
  BITCOIN_NETWORKS,
  STACKS_NETWORKS
} from '@/app/config/blockchain';
import { StacksApiService, StacksTransaction } // Assuming StacksTransaction is correctly typed in StacksApiService
from '@/app/services/stacksApiService';
import { formatStacksTransaction } // Make sure this is correctly imported
from '@/app/utils/stacksFormatter';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are BitcoinInsightAI, an advanced AI-powered blockchain transaction analyzer specializing in Bitcoin, Stacks, sBTC, and BIP300 Sidechains. Provide deep insights about transactions or blocks in a specific format for the BitcoinInsightAI Explorer interface.

IMPORTANT FORMATTING RULES:
1. You MUST first create a Mermaid diagram visualization of the transaction or block structure if applicable.
2. You MUST use the exact section headers and format below.
3. Your response MUST start with a mermaid diagram inside triple backticks if a diagram is applicable. If not, start with the TRANSACTION OVERVIEW or BLOCK OVERVIEW.
4. For each field (e.g., Type, Chain, Block Height, Amount, Fee Paid), you MUST provide the actual data from the 'Data' JSON provided later in this prompt. If data for a field is not available or not applicable, state "Not available". DO NOT use generic placeholders like "[value]", "[number]", etc.
5. Ensure all monetary values are appropriately formatted with their currency (e.g., BTC, STX, sats/vB, µSTX).

\`\`\`mermaid
graph LR
    %% Node Styling
    classDef wallet fill:#f7931a,stroke:#c27214,stroke-width:2px;
    classDef contract fill:#5546FF,stroke:#3b30c9,stroke-width:2px;
    classDef blockDef fill:#8f8f8f,stroke:#555,stroke-width:2px;
    classDef value fill:#fff1e5,stroke:#b35900,stroke-width:2px;

    %% Create nodes for sender, receiver, and any contracts
    A[From: 0x123...] -->|transfer value| B[To: 0x456...]
    %% Replace this with actual transaction flow based on the provided 'Data' JSON
    %% For blocks, show block and its connections or key contents.
    
    %% Apply styling
    class A wallet;
    class B wallet;
\`\`\`

---Section---
TRANSACTION OVERVIEW: %% Or BLOCK OVERVIEW: if analyzing a block
- Type: (Include complexity score: Simple/Moderate/Complex/Very Complex for transactions)
- Brief summary of what occurred in 8-10 sentences.
- Number of inputs/outputs or contract interactions involved (for transactions), or transaction count (for blocks).
- Notable features or patterns.

---Section---
NETWORK DETAILS:
- Chain:
- Block Height:
- Timestamp:
- Confirmations:
- Network Status: (Mainnet/Testnet)

---Section---
TRANSFER ANALYSIS: %% Or BLOCK CONTENTS: for blocks
`;

const BITCOIN_ANALYSIS_FORMAT = `
For Bitcoin transactions:

---Sub Section---
Inputs:
- Address:
- Amount:
- Type:

---Sub Section---
Outputs:
- Address:
- Amount:
- Type:
- Spent:

---Section---
FEE ANALYSIS:
- Fee Paid:
- Fee Rate:
- Efficiency:
`;

const STACKS_ANALYSIS_FORMAT = `
For Stacks transactions:

---Sub Section---
STX Transfers:
- Amount:
- From:
- To:
- Memo:

---Sub Section---
sBTC Operations:
- Type:
- Amount:
- From:
- To:
- Status:
- Associated Bitcoin Transaction:

---Sub Section---
Contract Interactions:
- Contract:
- Function:
- Arguments:
- Purpose:

---Section---
FEE ANALYSIS:
- Fee Paid:
- Fee Rate:
- Efficiency:
- For sBTC transactions, explain both Bitcoin and Stacks fees if applicable:
`;

const SIDECHAIN_ANALYSIS_FORMAT = `
For BIP300 Sidechain transactions:

---Sub Section---
Transfers:
- Amount:
- From:
- To:
- Type:

---Sub Section---
Operations:
- Type:
- Description:
- Status:
- Associated Bitcoin Transaction:

---Sub Section---
Contract Interactions:
- Contract:
- Function:
- Arguments:
- Purpose:

---Section---
FEE ANALYSIS:
- Fee Paid:
- Fee Rate:
- Efficiency:
- Security considerations related to fee:
`;

const BLOCK_ANALYSIS_FORMAT_COMMON = `
---Sub Section---
Block Summary:
- Hash:
- Height:
- Timestamp:
- Transaction Count:
- Size:
- Miner/Proposer:
- Difficulty/Weight:
- Confirmations:
- Previous Block Hash:
- Merkle Root:

---Sub Section---
Key Transactions (Sample - list a few if many, providing TxID, primary amount/action, and key parties):
- TxID: Action: (e.g., Value: 0.5 BTC, From: ..., To: ...)
- TxID: Action: (e.g., Contract Call: someFunction by ...)

---Section---
FEE ANALYSIS: %% (If applicable to blocks, e.g. total fees collected)
- Total Fees in Block:
- Average Fee Rate in Block:
`;

const COMMON_COMPLETION_FORMAT = `
---Section---
SECURITY ASSESSMENT:
Risk Level: (Low/Medium/High for transactions)
- Contract verification status if applicable:
- Known risks or warnings for sBTC operations:
- Notable security considerations:

---Section---
ADDITIONAL INSIGHTS:
- Context about this transaction/block type in the ecosystem:
- How this transaction relates to sBTC and Bitcoin's programmability (if applicable):
- Recommendations for similar transactions or optimization (for transactions):
- For developers: relevant API endpoints or contract methods:
`;

export async function POST(req: Request) {
  try {
    const { messages, txHash, network, subNetwork } = await req.json();
    
    const userMessages = [...messages];
    let itemData: any = null; 
    let analysisType: 'transaction' | 'block' | 'address' | 'question' = 'question';
    let determinedNetwork = network || 'bitcoin'; 
    let determinedSubNetwork = subNetwork || 'mainnet'; 
    
    const lastUserMessageContent = userMessages.length > 0 && userMessages[userMessages.length - 1].role === 'user' 
                                   ? userMessages[userMessages.length - 1].content.toLowerCase() 
                                   : "";
    const isBlockAnalysisRequest = lastUserMessageContent.includes('block');

    if (txHash && typeof txHash === 'string' && txHash.trim() !== '') {
      analysisType = isBlockAnalysisRequest ? 'block' : 'transaction';
      const txTypeFromHash = getTransactionType(txHash);

      if (network && network.startsWith('sidechain-')) {
        determinedNetwork = network; 
        determinedSubNetwork = network.split('-')[1]; 
      } else if (network && (network === 'bitcoin' || network === 'stacks')) {
        determinedNetwork = network; 
        determinedSubNetwork = subNetwork || 'mainnet';
      } else if (txTypeFromHash === 'bitcoin') {
        determinedNetwork = 'bitcoin';
        determinedSubNetwork = subNetwork || 'mainnet';
      } else if (txTypeFromHash === 'stacks') {
        determinedNetwork = 'stacks';
        determinedSubNetwork = subNetwork || 'mainnet';
      }

      try {
        console.log(`Attempting to analyze ${determinedNetwork} ${analysisType}: ${txHash} on ${determinedSubNetwork}`);
        
        const normalizedId = 
          (determinedNetwork === 'stacks' && analysisType === 'transaction' && !txHash.startsWith('0x')) 
            ? `0x${txHash}` 
            : txHash;

        if (determinedNetwork.startsWith('sidechain-')) {
            const currentSidechainType = determinedSubNetwork;
            const bip300Service = new BIP300Service(currentSidechainType);
            if (analysisType === 'block') {
                itemData = await bip300Service.getBlock(normalizedId);
            } else {
                itemData = await bip300Service.getTransaction(normalizedId);
            }
        } else if (determinedNetwork === 'bitcoin') {
            const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            const networkConfig = BITCOIN_NETWORKS[determinedSubNetwork as 'mainnet' | 'testnet'] || BITCOIN_NETWORKS.mainnet;
            let itemApiUrl;
            if (analysisType === 'block') {
                 itemApiUrl = `${networkConfig.apiUrl}/block/${normalizedId}`;
            } else { 
                 itemApiUrl = `${networkConfig.apiUrl}/tx/${normalizedId}`;
            }
            console.log(`Workspaceing Bitcoin data from: ${itemApiUrl}`);
            const response = await fetch(`${origin}/api/blockchain-data?url=${encodeURIComponent(itemApiUrl)}`);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Failed to fetch Bitcoin ${analysisType} from ${itemApiUrl}: ${response.statusText}, Body: ${errorBody}`);
                throw new Error(`Failed to fetch Bitcoin ${analysisType}: ${response.statusText}`);
            }
            itemData = await response.json();
        } else if (determinedNetwork === 'stacks') {
            const stacksApi = new StacksApiService(determinedSubNetwork as 'mainnet' | 'testnet');
            if (analysisType === 'block') {
                itemData = await stacksApi.getBlock(normalizedId);
            } else { 
                const rawTxData = await stacksApi.getTransaction(normalizedId);
                itemData = formatStacksTransaction(rawTxData as StacksTransaction); // Cast to ensure type
            }
        }
        
        console.log(`${analysisType} analysis successful. Data (first 200 chars):`, itemData ? JSON.stringify(itemData).substring(0,200) : "No data");
        
        const lastMsg = userMessages[userMessages.length - 1];
        if (lastMsg.role === 'user' && !lastMsg.content.includes(txHash)) {
          userMessages[userMessages.length - 1] = {
            ...lastMsg,
            content: `${lastMsg.content} (Regarding ${determinedNetwork} ${analysisType}: ${txHash} on ${determinedSubNetwork})`
          };
        }
      } catch (error) {
        console.error(`Error analyzing ${determinedNetwork} ${analysisType} ${txHash}:`, error);
        itemData = null; 
        userMessages.push({ role: 'system', content: `Note: Failed to fetch complete data for ${txHash} on ${determinedNetwork} (${determinedSubNetwork}). Analyze based on the hash pattern and general knowledge if possible, or state that specific details could not be fetched. Error: ${error instanceof Error ? error.message : String(error)}`});
      }
    } else if (userMessages.length > 0 && userMessages[userMessages.length-1].role === 'user'){
        analysisType = 'question';
    }
    
    let fullSystemPrompt = SYSTEM_PROMPT;
    
    if (analysisType === 'block') {
        fullSystemPrompt = fullSystemPrompt.replace('TRANSACTION OVERVIEW:', 'BLOCK OVERVIEW:');
        fullSystemPrompt = fullSystemPrompt.replace('TRANSFER ANALYSIS:', 'BLOCK CONTENTS:');
        fullSystemPrompt += BLOCK_ANALYSIS_FORMAT_COMMON;
        fullSystemPrompt += COMMON_COMPLETION_FORMAT;
    } else if (determinedNetwork === 'bitcoin') {
      fullSystemPrompt += BITCOIN_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
    } else if (determinedNetwork === 'stacks') {
      fullSystemPrompt += STACKS_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
    } else if (determinedNetwork.startsWith('sidechain-')) {
      fullSystemPrompt += SIDECHAIN_ANALYSIS_FORMAT + COMMON_COMPLETION_FORMAT;
    } else { 
      fullSystemPrompt += `
You are a general blockchain assistant. The user has not specified a transaction/block type or it was unrecognized. Provide helpful information based on the query.
If data is provided below, use it. Otherwise, answer generally.
${COMMON_COMPLETION_FORMAT}`;
    }
    
    if (itemData) {
      fullSystemPrompt += `\n\nUse the following JSON data (referred to as 'Data' in instructions) to provide a detailed analysis. Ensure every field in your response is populated with actual data from this JSON, or state 'Not available' if a specific piece of data is missing. DO NOT use placeholders like "[value]", "[number]", etc. in your response.\n\nData: ${JSON.stringify(itemData, null, 2)}`;
      
      if (determinedNetwork === 'stacks' && analysisType === 'transaction') {
        // Escaped backticks for Data and sbtcDetails.amount
        fullSystemPrompt += `\n\nIMPORTANT STACKS TRANSACTION INSTRUCTIONS (using the provided Data JSON):

1.  Adhere strictly to the section headers: TRANSACTION OVERVIEW, NETWORK DETAILS, TRANSFER ANALYSIS (with sub-sections STX Transfers, sBTC Operations, Contract Interactions), FEE ANALYSIS, SECURITY ASSESSMENT, ADDITIONAL INSIGHTS.
2.  For "STX Transfers", find and detail 'Amount' (from the 'value' field in the Data JSON if it represents STX), 'From' (from 'senderFull' field), 'To' (from 'recipient' field), 'Memo' (from 'memo' field).
3.  For "sBTC Operations", use the 'sbtcDetails' object in the Data JSON, detailing 'Type', 'Amount', 'From', 'To', 'Status', 'Associated Bitcoin Transaction', 'Fee', 'Memo', 'Contract ID', 'Function Name', and 'Gas Cost Analysis' if available.
4.  For "Contract Interactions", use 'contractId', 'functionName', and 'args' from the Data JSON. Infer 'Purpose' based on these.
5.  All values (amounts, fees, addresses, names, IDs, statuses, timestamps, block heights, etc.) MUST come from the \\\`Data\\\` JSON. If a value is not present in the JSON or is null/undefined/empty, state 'Not available'.
6.  Pay close attention to the \\\`type\\\` field in the Data JSON (e.g., "STX Transfer", "Contract Call: some_function", "sBTC Deposit") to correctly categorize and describe the transaction in the TRANSACTION OVERVIEW and other relevant sections.
7.  The \\\`Data\\\` JSON is the source of truth. If specific details are nested (e.g., \\\`sbtcDetails.amount\\\`), extract them.
8.  For fee rates, use µSTX. For STX amounts, use STX. For sBTC amounts, use sBTC.`;
      }
    } else if (txHash) {
        fullSystemPrompt += `\n\nAnalysis for ${txHash} on ${determinedNetwork}(${determinedSubNetwork}): Data retrieval was unsuccessful or incomplete. Please provide general information about this type of ${analysisType} if possible, or state that specific details could not be fetched.`;
    }
    
    const apiMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...userMessages,
    ];
    
    // console.log("Full system prompt sent to OpenAI:", fullSystemPrompt); 
    // console.log("Last user message to OpenAI:", userMessages[userMessages.length -1]);
    // if (itemData) {
    //     console.log("Item data being sent to OpenAI (first 500 chars):", JSON.stringify(itemData, null, 2).substring(0, 500) + "...");
    // } else if (txHash) {
    //     console.log("No itemData, but txHash was present:", txHash);
    // }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', 
      messages: apiMessages,
      temperature: 0.2, 
      stream: true,
    });
    
    const stream = OpenAIStream(response);
    
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('API Error in POST handler:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred during API call', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export const maxDuration = 300;