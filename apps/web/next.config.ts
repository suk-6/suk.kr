import path from "node:path";
import type { NextConfig } from "next";

export default {
	experimental: { useTypeScriptCli: true },
	outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
	outputFileTracingIncludes: {
		"/i/*": [
			"../../node_modules/.pnpm/sharp@*/node_modules/sharp/**/*",
			"../../node_modules/.pnpm/@img+colour@*/node_modules/@img/colour/**/*",
			"../../node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*",
			"../../node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*",
		],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "file.suk.kr",
				pathname: "/assets/**",
			},
		],
	},
	serverExternalPackages: ["sharp"],
	typedRoutes: true,
} satisfies NextConfig;
