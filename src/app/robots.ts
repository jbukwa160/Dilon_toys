import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/kolichka", "/porachka", "/lyubimi", "/tarsene", "/api/"] },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
