import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0C3B36",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 100">
          <path
            d="M18 62 L18 40 L50 20 L82 40 L82 62"
            fill="none"
            stroke="#FF5A36"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="18" y1="62" x2="82" y2="62" stroke="#FF5A36" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
