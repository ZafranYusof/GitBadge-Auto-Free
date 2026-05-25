export default function Skeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-[#1a3a1a] rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  );
}
