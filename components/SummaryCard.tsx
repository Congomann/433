import React, { useState, useEffect } from 'react';

// Custom hook for number animation using requestAnimationFrame for smoothness
const useCountUp = (end: number, duration: number = 1500) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let start = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            // Ease-out quint function for a more natural animation curve
            const easeOutProgress = 1 - Math.pow(1 - progress, 5);
            
            const currentCount = start + (end - start) * easeOutProgress;
            
            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure it ends on the exact number
            }
        };

        requestAnimationFrame(animate);

    }, [end, duration]);

    return count;
};

interface SummaryCardProps {
  title: React.ReactNode;
  value: string;
  change?: string;
  icon: React.ReactNode;
  style?: React.CSSProperties;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, change, icon, style }) => {
  const isPositive = change && change.startsWith('+');
  const changeColor = isPositive ? 'text-emerald-600' : 'text-rose-600';

  const [numericValue, setNumericValue] = useState(0);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  useEffect(() => {
    // Regex to parse value into prefix, number, and suffix (e.g., "$", "55.1", "k")
    const match = value.match(/^([^\d.]*)([\d.]+)(.*)$/);
    if (match) {
        const [, p, n, s] = match;
        setPrefix(p);
        setNumericValue(parseFloat(n));
        setSuffix(s);
    } else {
        // If no number is found, display the value as is without animation
        setPrefix(value);
        setNumericValue(0);
        setSuffix('');
    }
  }, [value]);

  const animatedValue = useCountUp(numericValue);

  const formatValue = (num: number) => {
    // Handle decimals for 'k' values
    if (suffix.toLowerCase().includes('k') && num < 1000) {
        return num.toFixed(1);
    }
    return Math.round(num).toLocaleString();
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg p-7 rounded-2xl border border-white/50 shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all card-enter" style={style}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {numericValue > 0 ? `${prefix}${formatValue(animatedValue)}${suffix}` : value}
          </p>
          {change && (
            <p className={`text-sm mt-2 font-semibold ${changeColor}`}>
              {change} this month
            </p>
          )}
        </div>
        <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;