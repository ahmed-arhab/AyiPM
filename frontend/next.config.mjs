// The Spring Boot backend serves /api. Proxying it keeps the session cookie same-origin.
// Rewrites are fixed at build time, so set BACKEND_URL before `npm run build`.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
