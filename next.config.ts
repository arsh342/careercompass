import type { NextConfig } from "next";

// Security headers configuration
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      // Default to self
      "default-src 'self'",
      // Scripts: self, inline for Next.js, and specific CDNs
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com https://*.firebaseapp.com",
      // Styles: self and inline for component libraries
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self and allowed image hosts
      "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://i.postimg.cc https://*.googleusercontent.com https://*.google.com",
      // Fonts: self and Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect: API endpoints
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.stripe.com wss://*.firebaseio.com https://firestore.googleapis.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      // Frame ancestors: prevent clickjacking
      "frame-ancestors 'self'",
      // Form actions
      "form-action 'self'",
      // Frames: Stripe and Firebase auth iframes
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
      // Base URI
      "base-uri 'self'",
      // Upgrade insecure requests in production
      process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: [
    "https://6000-firebase-studio-1753536684062.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev",
  ],
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

