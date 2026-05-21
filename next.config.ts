import type { NextConfig } from "next";

// Supabase Storage public URLs look like
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// Without the remotePattern below, any future <Image> for a bucket asset
// would crash unless the call site set `unoptimized`. The gallery uploader
// already opts out via `unoptimized`, but new callers shouldn't need to
// remember that gotcha.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Baseline security headers applied to every response. (A full CSP is
  // intentionally omitted — the app's inline styles + Firebase/Supabase/
  // reCAPTCHA origins make a correct policy fragile; these four are the
  // safe, high-value wins.)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
