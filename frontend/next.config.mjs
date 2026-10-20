// The Spring Boot backend serves /api. Proxying it keeps the session cookie same-origin.
// Rewrites are fixed at build time, so set BACKEND_URL before `npm run build`.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Docker build sets NEXT_OUTPUT=standalone to ship only the files the server needs.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
