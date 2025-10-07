import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure webpack to handle TensorFlow.js properly
  webpack: (config, { isServer }) => {
    // Handle TensorFlow.js for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs': 'commonjs @tensorflow/tfjs',
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
      });
    }

    // Handle canvas for server-side image processing
    if (isServer) {
      config.externals.push('canvas');
    }

    return config;
  },
  
  // External packages for server components
  serverExternalPackages: ['@tensorflow/tfjs', 'canvas'],
};

export default nextConfig;
