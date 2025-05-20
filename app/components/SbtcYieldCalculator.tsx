    'use client';
    import React, { useState, useEffect } from 'react';
    import { 
    TrendingUp, 
    Calculator, 
    DollarSign, 
    Calendar, 
    Clock, 
    Shield, 
    PieChart,
    Loader2,
    Info,
    ExternalLink,
    Bitcoin
    } from 'lucide-react';
    import { DefiProtocolService, YieldOpportunity } from '@/app/services/defiProtocolService';
    import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

    interface SbtcYieldCalculatorProps {
    network: 'mainnet' | 'testnet';
    }

    const SbtcYieldCalculator: React.FC<SbtcYieldCalculatorProps> = ({ network = 'mainnet' }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
    const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>('0.1');
    const [months, setMonths] = useState<number>(12);
    const [btcPrice, setBtcPrice] = useState<number>(55000);
    const [yieldResult, setYieldResult] = useState<{
        profit: number;
        total: number;
        monthly: number[];
    } | null>(null);
    
    // Fetch opportunities on load
    useEffect(() => {
        const fetchOpportunities = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const defiService = new DefiProtocolService(network);
            const opportunities = await defiService.getYieldOpportunities();
            
            setOpportunities(opportunities);
            
            // Set the first opportunity as selected
            if (opportunities.length > 0) {
            setSelectedOpportunity(opportunities[0].protocolId);
            }
            
            // Fetch BTC price
            try {
            const priceResponse = await fetch('/api/blockchain-data?url=' + 
                encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'));
            
            if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                if (priceData.bitcoin?.usd) {
                setBtcPrice(priceData.bitcoin.usd);
                }
            }
            } catch (priceError) {
            console.error('Error fetching BTC price:', priceError);
            // Continue with default price
            }
            
        } catch (error) {
            console.error('Error fetching yield opportunities:', error);
            setError('Failed to fetch yield opportunities. Please try again.');
        } finally {
            setIsLoading(false);
        }
        };
        
        fetchOpportunities();
    }, [network]);
    
    // Calculate yield when inputs change
    useEffect(() => {
        const calculateYield = () => {
        if (!selectedOpportunity || isNaN(parseFloat(amount))) return;
        
        try {
            const opportunity = opportunities.find(op => op.protocolId === selectedOpportunity);
            if (!opportunity) return;
            
            const principal = parseFloat(amount);
            const defiService = new DefiProtocolService(network);
            const result = defiService.calculateYield(principal, opportunity.apy, months);
            
            setYieldResult(result);
        } catch (error) {
            console.error('Error calculating yield:', error);
        }
        };
        
        calculateYield();
    }, [selectedOpportunity, amount, months, opportunities, network]);
    
    // Format chart data
    const chartData = yieldResult ? yieldResult.monthly.map((value, index) => ({
        month: index + 1,
        balance: value,
        valueUsd: value * btcPrice
    })) : [];
    
    // Get the selected opportunity
    const selectedOpp = opportunities.find(op => op.protocolId === selectedOpportunity);

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-6 border-b">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <Calculator className="w-5 h-5 text-amber-500 mr-2" />
            sBTC Yield Calculator
            </h3>
            <p className="text-gray-500 mt-1">
            Calculate potential returns from sBTC DeFi strategies
            </p>
        </div>
        
        {isLoading ? (
            <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
            <span>Loading yield opportunities...</span>
            </div>
        ) : error ? (
            <div className="p-6 text-center">
            <div className="text-red-500 mb-2">{error}</div>
            <p className="text-gray-500">Unable to load yield opportunities</p>
            </div>
        ) : (
            <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input controls */}
                <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Strategy
                    </label>
                    <div className="space-y-2">
                    {opportunities.map((op) => (
                        <div
                        key={op.protocolId}
                        className={`border ${
                            op.protocolId === selectedOpportunity
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        } rounded-lg p-4 cursor-pointer transition-colors`}
                        onClick={() => setSelectedOpportunity(op.protocolId)}
                        >
                        <div className="flex justify-between mb-2">
                            <div className="font-medium">{op.name}</div>
                            <div className="text-amber-600 font-bold">{op.apy}% APY</div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div className="text-gray-500">TVL: {op.tvl}</div>
                            <div className="text-gray-500">
                            {op.lockupPeriod ? `Lock: ${op.lockupPeriod}` : 'No lockup'}
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    sBTC Amount
                    </label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Bitcoin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="amount"
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.1"
                    />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                    Current BTC price: ${btcPrice.toLocaleString()}
                    </p>
                </div>
                
                <div>
                    <label htmlFor="months" className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Period (Months)
                    </label>
                    <div className="flex items-center space-x-2">
                    <input
                        id="months"
                        type="range"
                        min="1"
                        max="36"
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-gray-700 font-medium">{months}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 month</span>
                    <span>3 years</span>
                    </div>
                </div>
                
                {/* Strategy details */}
                {selectedOpp && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Strategy Details</h4>
                    
                    <div className="space-y-3 text-sm">
                        <div>
                        <div className="text-gray-500">Description</div>
                        <div className="text-gray-800">{selectedOpp.strategy}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-gray-500 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            <span>Risks</span>
                            </div>
                            <ul className="list-disc list-inside text-gray-800">
                            {selectedOpp.risks.map((risk, index) => (
                                <li key={index}>{risk}</li>
                            ))}
                            </ul>
                        </div>
                        
                        <div>
                            <div className="text-gray-500 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>Rewards</span>
                            </div>
                            <ul className="list-disc list-inside text-gray-800">
                            {selectedOpp.rewards.map((reward, index) => (
                                <li key={index}>{reward}</li>
                            ))}
                            </ul>
                        </div>
                        </div>
                        
                        <div className="flex justify-end">
                        <a
                            href={selectedOpp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                            <span>View on {selectedOpp.protocolId}</span>
                            <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                        </div>
                    </div>
                    </div>
                )}
                </div>
                
                {/* Results and chart */}
                <div className="space-y-6">
                {/* Yield summary */}
                {yieldResult && selectedOpp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-4">Projected Returns</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <div className="text-sm text-gray-500">Initial Investment</div>
                        <div className="text-xl font-bold text-gray-800">
                            {parseFloat(amount).toFixed(8)} sBTC
                        </div>
                        <div className="text-sm text-gray-600">
                            ${(parseFloat(amount) * btcPrice).toLocaleString()}
                        </div>
                        </div>
                        
                        <div>
                        <div className="text-sm text-gray-500">Final Value</div>
                        <div className="text-xl font-bold text-amber-600">
                            {yieldResult.total.toFixed(8)} sBTC
                        </div>
                        <div className="text-sm text-amber-600">
                            ${(yieldResult.total * btcPrice).toLocaleString()}
                        </div>
                        </div>
                        
                        <div>
                        <div className="text-sm text-gray-500">Profit</div>
                        <div className="text-lg font-medium text-green-600">
                            +{yieldResult.profit.toFixed(8)} sBTC
                        </div>
                        <div className="text-sm text-green-600">
                            +${(yieldResult.profit * btcPrice).toLocaleString()}
                        </div>
                        </div>
                        
                        <div>
                        <div className="text-sm text-gray-500">APY</div>
                        <div className="text-lg font-medium text-amber-600">
                            {selectedOpp.apy}%
                        </div>
                        <div className="text-sm text-amber-600">
                            Compounded monthly
                        </div>
                        </div>
                    </div>
                    </div>
                )}
                
                {/* Chart */}
                {chartData.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Growth Projection</h4>
                        <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{months} months</span>
                        </div>
                    </div>
                    
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                            dataKey="month" 
                            label={{ 
                                value: 'Month', 
                                position: 'insideBottom', 
                                offset: -5 
                            }} 
                            />
                            <YAxis 
                            yAxisId="left"
                            orientation="left"
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => value.toFixed(4)}
                            label={{ 
                                value: 'sBTC', 
                                angle: -90, 
                                position: 'insideLeft' 
                            }}
                            />
                            <YAxis 
                            yAxisId="right"
                            orientation="right"
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => `${Math.round(value)}`}
                            label={{ 
                                value: 'USD', 
                                angle: 90, 
                                position: 'insideRight' 
                            }}
                            />
                            <Tooltip
                            formatter={(value, name) => {
                                if (name === 'balance') return [`${value.toFixed(8)} sBTC`, 'sBTC Balance'];
                                if (name === 'valueUsd') return [`${value.toLocaleString()}`, 'USD Value'];
                                return [value, name];
                            }}
                            labelFormatter={(month) => `Month ${month}`}
                            />
                            <Legend />
                            <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#f7931a" 
                            activeDot={{ r: 8 }} 
                            name="sBTC Balance"
                            />
                            <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="valueUsd" 
                            stroke="#5546FF" 
                            name="USD Value" 
                            />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </div>
                )}
                
                {/* Disclaimer */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Disclaimer</p>
                    <p>These calculations are estimates only. Actual returns may vary based on market conditions, protocol changes, and other factors. Do your own research before investing.</p>
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
    };

    export default SbtcYieldCalculator;