/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Replace with your R2 custom domain once connected, e.g. media.yourapp.com
        hostname: "**.r2.dev",
      },
    ],
  },
};

module.exports = nextConfig;
