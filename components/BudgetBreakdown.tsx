
import React, { useState } from 'react';
import { BudgetPlan } from '../types';
import { DollarSign, TrendingUp, AlertCircle, AlertTriangle, CheckCircle, ExternalLink, Clock, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface BudgetBreakdownProps {
  plan: BudgetPlan;
  userBudget: number;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ plan, userBudget }) => {
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Group by category for the chart
  const categoryTotals: Record<string, number> = {};
  let totalChartCost = 0;
  
  plan.items.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.cost;
      totalChartCost += item.cost;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Calculate top cost drivers for advice
  const topCosts = sortedCategories.slice(0, 3);

  const colors = [
    '#3b82f6', // Blue 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#ec4899', // Pink 500
    '#06b6d4', // Cyan 500
    '#8b5cf6', // Violet 500
    '#f43f5e', // Rose 500
    '#64748b', // Slate 500
  ];

  // SVG Pie Chart Math
  let cumulativePercent = 0;
  
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = sortedCategories.map((cat, index) => {
    const percent = cat.value / totalChartCost;
    const startP = cumulativePercent;
    const endP = cumulativePercent + percent;
    cumulativePercent += percent;

    const [startX, startY] = getCoordinatesForPercent(startP);
    const [endX, endY] = getCoordinatesForPercent(endP);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    // SVG Path Data
    const pathData = [
      `M 0 0`, // Move to center
      `L ${startX} ${startY}`, // Line to start
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc to end
      `Z` // Close path
    ].join(' ');

    // Calculate middle angle for explode effect
    const midAngle = 2 * Math.PI * (startP + percent / 2);
    const explodeDistance = 0.1; // Distance to move out
    const explodeX = Math.cos(midAngle) * explodeDistance;
    const explodeY = Math.sin(midAngle) * explodeDistance;

    return {
      pathData,
      color: colors[index % colors.length],
      name: cat.name,
      value: cat.value,
      percent,
      explodeStyle: {
        transform: hoveredIndex === index ? `translate(${explodeX}px, ${explodeY}px)` : 'translate(0,0)',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }
    };
  });

  return (
    <div className="space-y-6">
        
        {/* Feasibility Alert - Enhanced */}
        {!plan.isFeasible && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm mb-6">
                {/* Header Section */}
                <div className="p-6 bg-red-50 border-b border-red-100">
                    <div className="flex gap-4 items-start">
                        <div className="bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                             <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-red-900 font-bold text-lg mb-1">Budget Critical Warning</h3>
                            <p className="text-red-700 text-sm mb-4 leading-relaxed">
                                Your budget of <span className="font-mono font-bold text-red-950">{formatMoney(userBudget)}</span> is insufficient for this location. 
                                Market data suggests a minimum of <span className="font-bold text-red-950">{formatMoney(plan.suggestedMinimumBudget)}</span> is required to launch safely.
                            </p>
                            
                            <div className="flex items-center gap-3 text-sm mb-2">
                                <span className="text-red-600 font-medium">Funding Gap:</span>
                                <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">{formatMoney(plan.missingBudget)}</span>
                            </div>

                            <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-red-200 shadow-inner">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((userBudget / plan.suggestedMinimumBudget) * 100, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-red-500 uppercase font-bold tracking-wider">
                                <span>Current: {formatMoney(userBudget)}</span>
                                <span>Target: {formatMoney(plan.suggestedMinimumBudget)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actionable Strategy Section */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-b from-white to-red-50/30">
                     
                     {/* Advice Column */}
                     <div>
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Strategic Adjustments
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-red-100 text-sm text-slate-700 italic leading-relaxed shadow-sm relative">
                             <span className="absolute top-2 left-2 text-4xl text-red-100 font-serif leading-none -z-10">"</span>
                             {plan.advice}
                        </div>
                     </div>

                     {/* Cost Drivers Column */}
                     <div>
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" /> Top Cost Drivers
                        </h4>
                        <div className="space-y-2">
                            {topCosts.map((cat, idx) => (
                                <div key={cat.name} className="flex items-center justify-between bg-white p-2.5 rounded border border-red-100 text-sm shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-300 font-bold text-xs">0{idx + 1}</span>
                                        <span className="font-medium text-slate-700">{cat.name}</span>
                                    </div>
                                    <div className="text-red-600 font-mono text-xs bg-red-50 px-1.5 py-0.5 rounded">
                                        {((cat.value / totalChartCost) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-red-500 mt-2 text-center">
                            *Review these categories first to reduce capital requirements.
                        </p>
                     </div>
                </div>
            </div>
        )}

        {plan.isFeasible && (
             <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl flex gap-4 items-center shadow-sm">
                <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0" />
                 <div>
                    <h3 className="text-teal-900 font-bold">Budget Looks Viable</h3>
                    <p className="text-teal-700 text-sm">Your capital appears sufficient for a standard launch in this market.</p>
                 </div>
            </div>
        )}

        {/* Profitability & Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Projected Profitability</div>
                <div className="text-3xl font-bold text-slate-900">{plan.breakEvenMonths} Months</div>
                <div className="text-xs text-teal-600 font-medium mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Estimated Break-Even Point
                </div>
                 <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    With est. monthly revenue of <span className="font-semibold text-slate-700">{formatMoney(plan.estimatedMonthlyRevenue)}</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Startup Capital</div>
                <div className="text-3xl font-bold text-slate-900">{formatMoney(plan.totalOneTimeStartup)}</div>
                <div className="text-xs text-blue-600 font-medium mt-2 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" /> One-time investment
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Monthly Burn</div>
                <div className="text-3xl font-bold text-slate-900">{formatMoney(plan.totalEstimatedMonthly)}</div>
                 <div className="text-xs text-orange-600 font-medium mt-2 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" /> Recurring OpEx
                </div>
            </div>
        </div>

        {/* Interactive Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                
                <div className="relative w-64 h-64 flex-shrink-0 group">
                    <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90 overflow-visible">
                        {slices.map((slice, i) => (
                            <path
                                key={i}
                                d={slice.pathData}
                                fill={slice.color}
                                stroke="white"
                                strokeWidth="0.02"
                                style={slice.explodeStyle}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        ))}
                    </svg>
                    {/* Center Text Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-lg border border-slate-100 transition-all duration-200">
                             <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                                {hoveredIndex !== null ? 'Category' : 'Total'}
                             </span>
                             <span className="text-sm font-bold text-slate-800 text-center leading-tight px-1">
                                {hoveredIndex !== null ? slices[hoveredIndex].name : 'Budget'}
                             </span>
                             <span className="text-xs font-mono text-blue-600 mt-0.5">
                                {hoveredIndex !== null 
                                    ? formatMoney(slices[hoveredIndex].value) 
                                    : formatMoney(totalChartCost)
                                }
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                     <h4 className="col-span-full text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide border-b border-slate-100 pb-2">
                        Capital Allocation Strategy
                    </h4>
                    {sortedCategories.map((cat, index) => (
                        <div 
                            key={cat.name} 
                            className={`flex items-center justify-between text-sm p-2 rounded-lg transition-colors cursor-default ${hoveredIndex === index ? 'bg-slate-50' : ''}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" 
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                ></div>
                                <span className={`font-medium ${hoveredIndex === index ? 'text-slate-900' : 'text-slate-600'}`}>{cat.name}</span>
                            </div>
                            <span className="font-mono text-slate-500 text-xs">{formatMoney(cat.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4 text-right">Cost</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {plan.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">{item.item}</span>
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium border border-slate-200">{item.category}</span>
                                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ml-1 ${item.frequency === 'One-time' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                        {item.frequency}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">{item.reasoning}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                {formatMoney(item.cost)}
                            </td>
                            <td className="px-6 py-4 text-right">
                               {item.searchQuery && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.searchQuery || '')}`, '_blank')}
                                        icon={<ExternalLink className="w-3 h-3" />}
                                    >
                                        Find Listing
                                    </Button>
                               )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {plan.isFeasible && (
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Consultant Advice</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{plan.advice}</p>
                </div>
            </div>
        )}
    </div>
  );
};
