/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for better Netlify integration
  images: {
    unoptimized: true
  }
};

export default nextConfig;