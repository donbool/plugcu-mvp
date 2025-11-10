/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now the default in Next.js 15, no need for experimental flag
  images: {
    domains: ['supabase.com'],
    // Add image optimization for faster loads
    formats: ['image/avif', 'image/webp'],
  },
  // Performance optimizations for Next.js 15
  reactStrictMode: true,
  // Compress static assets
  compress: true,
}

module.exports = nextConfig