/** @type {import('next').NextConfig} */

// Derive the allowed image hostname from R2_PUBLIC_URL itself, so this
// works whether you're using the raw R2.dev URL or a connected custom
// domain (e.g. media.yourapp.com) — hardcoding "**.r2.dev" here would
// silently break every image the moment a custom domain is connected.
function getR2Hostname() {
  try {
    return new URL(process.env.R2_PUBLIC_URL).hostname;
  } catch {
    return "**.r2.dev"; // fallback while R2_PUBLIC_URL isn't set yet (e.g. local setup)
  }
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: getR2Hostname(),
      },
    ],
  },
};

module.exports = nextConfig;
