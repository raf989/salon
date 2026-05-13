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
};

export default nextConfig;
