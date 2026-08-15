export default function VerifiedSeal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="select-none"
      style={{ width: size, height: size, transform: "rotate(-8deg)" }}
      aria-label="Verified owner"
      title="Verified owner"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#B4880B"
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#B4880B" strokeWidth="1.5" />
        {/* Simplified gate/roofline mark — the platform's core motif */}
        <path
          d="M32 58 L32 42 L50 30 L68 42 L68 58"
          fill="none"
          stroke="#B4880B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="32" y1="58" x2="68" y2="58" stroke="#B4880B" strokeWidth="3" strokeLinecap="round" />
        <path id="sealArc" d="M 12 50 A 38 38 0 0 1 88 50" fill="none" />
        <text fontSize="9" fill="#B4880B" letterSpacing="2" fontWeight="600">
          <textPath href="#sealArc" startOffset="50%" textAnchor="middle">
            VERIFIED OWNER
          </textPath>
        </text>
      </svg>
    </div>
  );
}
