import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0C3B36",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100">
          <path
            d="M18 62 L18 40 L50 20 L82 40 L82 62"
            fill="none"
            stroke="#FF5A36"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="18" y1="62" x2="82" y2="62" stroke="#FF5A36" strokeWidth="9" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
