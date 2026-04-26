interface RiskBadgeProps {
  score: number;
}

function getRiskLevel(score: number): { label: string; className: string } {
  if (score <= 25) return { label: 'Low risk', className: 'bg-green-500' };
  if (score <= 50) return { label: 'Moderate', className: 'bg-yellow-500' };
  if (score <= 75) return { label: 'Suspicious', className: 'bg-orange-500' };
  return { label: 'High risk', className: 'bg-red-500' };
}

export function RiskBadge({ score }: RiskBadgeProps) {
  const { label, className } = getRiskLevel(score);

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white ${className}`}
    >
      <span className="font-bold">{score}</span>
      <span>— {label}</span>
    </span>
  );
}
