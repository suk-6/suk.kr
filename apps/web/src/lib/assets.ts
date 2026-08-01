import "server-only";

const baseUrl = (
	process.env.NEXT_PUBLIC_S3_URL ?? "https://file.suk.kr"
).replace(/\/$/, "");

export const assetUrl = (path: string) =>
	`${baseUrl}/assets/${path.replace(/^\/+/, "")}`;
