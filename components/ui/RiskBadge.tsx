interface RiskBadgeProps {
  score: number;
}

function getRiskLevel(score: number): { label: string; className: string } {
  if (score <= 25) {
    return { label: 'Low risk', className: 'bg-green-50 text-green-800 border border-green-200' };
  }
  if (score <= 50) {
    return { label: 'Moderate', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
  }
  if (score <= 75) {
    return { label: 'Suspicious', className: 'bg-orange-50 text-orange-800 border border-orange-200' };
  }
  return { label: 'High risk', className: 'bg-red-50 text-red-800 border border-red-200' };
}

export function RiskBadge({ score }: RiskBadgeProps) {
  const { label, className } = getRiskLevel(score);

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <span className="font-semibold">{score}</span>
      <span>— {label}</span>
    </span>
  );
}
