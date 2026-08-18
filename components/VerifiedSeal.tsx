export default function VerifiedSeal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="select-none drop-shadow-sm"
      style={{ width: size, height: size }}
      aria-label="Verified owner"
      title="Verified owner"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Solid coral disc with a thin amber ring — a bold flat "trust
            badge" in the SaaS-verification-check tradition, replacing the
            old rotated stamp-style seal to match the brighter, bolder brand. */}
        <circle cx="50" cy="50" r="46" fill="#FF5A36" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#FFB627" strokeWidth="3" />
        <path
          d="M32 51 L44 63 L70 37"
          fill="none"
          stroke="#FFFBF3"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
