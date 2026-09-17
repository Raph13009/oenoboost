import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.join(__dirname, "../..");

function supabaseImageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  // Keep file tracing rooted at the monorepo so Next does not guess wrong
  // when multiple lockfiles exist.
  outputFileTracingRoot: workspaceRoot,
  // Temporary: lint/tsc remain separate gates until dual-types debt is cleared.
  // Kept so pnpm migration builds stay green without fixing product types here.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // No React webpack aliases: pnpm isolates React 19 for this app; forcing
  // aliases against Next's compiled React breaks hooks under SSR.
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/favicon/favicon.ico" },
      { source: "/site.webmanifest", destination: "/favicon/site.webmanifest" },
    ];
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
