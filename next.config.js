/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
  
  images: {
    // Fixed: Use remotePatterns instead of domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  typescript: {
    // Allow production builds even with TypeScript errors (optional)
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Allow production builds even with ESLint errors (optional)
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
