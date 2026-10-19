const COLUMNS = [
  { x: 24, label: 'To Do', cards: [52, 38, 46] },
  { x: 156, label: 'In Progress', cards: [44, 56] },
  { x: 288, label: 'Done', cards: [40, 50, 34] },
];

const PRIORITY_COLORS = ['#353E4E', '#8C97A8', '#B4BECC', '#4B5567', '#677386', '#D5DCE6', '#8C97A8', '#353E4E'];

export function AuthIllustration({ className }: { className?: string }) {
  let colorIndex = 0;
  return (
    <svg viewBox="0 0 432 300" preserveAspectRatio="xMinYMid meet" className={className} aria-hidden focusable="false">
      <rect x="4" y="4" width="424" height="292" rx="20" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.22" />
      <circle cx="28" cy="26" r="4" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="42" cy="26" r="4" fill="#ffffff" fillOpacity="0.35" />
      <circle cx="56" cy="26" r="4" fill="#ffffff" fillOpacity="0.2" />

      {COLUMNS.map((column) => {
        let y = 70;
        return (
          <g key={column.label}>
            <rect x={column.x} y="44" width="120" height="236" rx="12" fill="#ffffff" fillOpacity="0.08" />
            <text x={column.x + 12} y="61" fill="#ffffff" fillOpacity="0.85" fontSize="10" fontWeight="700" letterSpacing="0.6">
              {column.label.toUpperCase()}
            </text>
            {column.cards.map((width, i) => {
              const cardY = y;
              y += 62;
              const color = PRIORITY_COLORS[colorIndex++ % PRIORITY_COLORS.length];
              return (
                <g key={i}>
                  <rect x={column.x + 8} y={cardY} width="104" height="54" rx="9" fill="#ffffff" fillOpacity="0.95" />
                  <rect x={column.x + 16} y={cardY + 10} width={width} height="6" rx="3" fill="#111827" fillOpacity="0.72" />
                  <rect x={column.x + 16} y={cardY + 22} width={width + 22} height="5" rx="2.5" fill="#111827" fillOpacity="0.2" />
                  <rect x={column.x + 16} y={cardY + 36} width="22" height="9" rx="4.5" fill={color} />
                  <circle cx={column.x + 100} cy={cardY + 40} r="6" fill="#677386" fillOpacity="0.85" />
                </g>
              );
            })}
          </g>
        );
      })}

      <g transform="translate(298 240)">
        <rect width="118" height="44" rx="12" fill="#ffffff" />
        <circle cx="22" cy="22" r="11" fill="#111827" />
        <path d="m17 22 3.5 3.5L27 19" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="14" width="58" height="6" rx="3" fill="#111827" fillOpacity="0.75" />
        <rect x="40" y="26" width="40" height="5" rx="2.5" fill="#111827" fillOpacity="0.25" />
      </g>
    </svg>
  );
}
