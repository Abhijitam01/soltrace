import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@coral-xyz/anchor', '@solana/web3.js'],
  },
};

export default nextConfig;
