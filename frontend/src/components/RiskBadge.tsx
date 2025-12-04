interface RiskBadgeProps {
  score: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  let colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let label = 'Low Risk';
  
  if (score >= 0.8) {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
    label = 'Critical';
  } else if (score >= 0.5) {
    colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
    label = 'Warning';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label} ({score.toFixed(2)})
    </span>
  );
};

