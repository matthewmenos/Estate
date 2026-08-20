import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFBF3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <svg width="64" height="64" viewBox="0 0 100 100">
            <path
              d="M18 62 L18 40 L50 20 L82 40 L82 62"
              fill="none"
              stroke="#FF5A36"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="18" y1="62" x2="82" y2="62" stroke="#FF5A36" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#0C3B36" }}>Accra Rentals</div>
        </div>
        <div style={{ fontSize: 28, color: "#57636D", maxWidth: 760, textAlign: "center", display: "flex" }}>
          List your property. Get verified. Be found.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#FF5A36",
            letterSpacing: 4,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Accra, Ghana
        </div>
      </div>
    ),
    { ...size }
  );
}
