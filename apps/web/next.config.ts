import type { NextConfig } from "next";

export default {
	experimental: { useTypeScriptCli: true },
	serverExternalPackages: ["sharp"],
	typedRoutes: true,
} satisfies NextConfig;
