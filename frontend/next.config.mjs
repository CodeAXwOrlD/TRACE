/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sigma.js / graphology ship browser-only WebGL code; keep them out of the RSC server bundle.
  transpilePackages: ["sigma", "graphology", "graphology-layout", "graphology-layout-forceatlas2"],
};

export default nextConfig;
