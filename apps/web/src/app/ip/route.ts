import { userAgent } from "next/server";

export const dynamic = "force-dynamic";

type Location = {
	ip: string;
	city: string | null;
	region: string | null;
	country: string | null;
	loc: string | null;
	org: string | null;
	postal: string | null;
	timezone: string | null;
};

const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#039;",
			})[character]!,
	);

export const GET = async (request: Request) => {
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"Unknown";
	const country = request.headers.get("x-vercel-ip-country") || "Unknown";
	const isBrowser = Boolean(userAgent(request).browser.name);

	if (!isBrowser) {
		const vercelLocation: Location = {
			ip,
			city: request.headers.get("x-vercel-ip-city"),
			region: request.headers.get("x-vercel-ip-country-region"),
			country: country === "Unknown" ? null : country,
			loc:
				request.headers.get("x-vercel-ip-latitude") &&
				request.headers.get("x-vercel-ip-longitude")
					? `${request.headers.get("x-vercel-ip-latitude")},${request.headers.get("x-vercel-ip-longitude")}`
					: null,
			org: null,
			postal: null,
			timezone: request.headers.get("x-vercel-ip-timezone"),
		};
		let location = vercelLocation;

		if (ip !== "Unknown") {
			try {
				const response = await fetch(
					`https://ipinfo.io/${encodeURIComponent(ip)}/json`,
					{ cache: "no-store", signal: AbortSignal.timeout(1500) },
				);
				if (response.ok) {
					const value = (await response.json()) as Partial<
						Record<keyof Location, string>
					>;
					location = {
						ip,
						city: value.city ?? vercelLocation.city,
						region: value.region ?? vercelLocation.region,
						country: value.country ?? vercelLocation.country,
						loc: value.loc ?? vercelLocation.loc,
						org: value.org ?? null,
						postal: value.postal ?? null,
						timezone: value.timezone ?? vercelLocation.timezone,
					};
				}
			} catch {
				// Vercel headers still provide the available location fields.
			}
		}

		return Response.json(location, {
			headers: { "cache-control": "no-store" },
		});
	}

	const safeIp = escapeHtml(ip);
	const safeCountry = escapeHtml(country);
	return new Response(
		`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#090909">
<title>IP — suk.kr</title>
<style>
*{box-sizing:border-box}html{color-scheme:dark;background:#090909}body{margin:0;min-height:100svh;background:#090909;color:#fff;font-family:Inter,Pretendard,"Apple SD Gothic Neo",Arial,sans-serif;font-size:16px;font-weight:500;letter-spacing:-.01em}main{display:flex;min-height:100svh;flex-direction:column;justify-content:space-between;padding:30px 20px}@media(min-width:761px){main{padding:40px}}header{display:flex;align-items:center;justify-content:space-between;color:#999}a{color:inherit;text-decoration:none;transition:color .15s}a:hover{color:#fff}.eyebrow{margin:0;color:#999}.ip{max-width:100%;margin:22px 0 0;font-size:clamp(3.25rem,12vw,8.5rem);font-weight:500;line-height:.88;letter-spacing:-.065em;overflow-wrap:anywhere}.content{margin:auto 0;padding:80px 0}.details{display:grid;grid-template-columns:1fr;gap:20px;margin-top:48px;padding-top:20px;border-top:1px solid #262626;color:#999}@media(min-width:761px){.details{grid-template-columns:1fr 1fr}}.value{display:block;margin-top:8px;color:#ecece8;font-size:1.25rem}footer{color:#999}</style>
</head>
<body>
<main>
<header><a href="/">suk.kr</a><span>Network</span></header>
<section class="content"><p class="eyebrow">요청자의 IP 주소</p><h1 class="ip">${safeIp}</h1><div class="details"><div>IP address<span class="value">${safeIp}</span></div><div>Country<span class="value">${safeCountry}</span></div></div></section>
<footer>Vercel Function에서 확인한 요청 정보입니다.</footer>
</main>
</body>
</html>`,
		{
			headers: {
				"cache-control": "no-store",
				"content-type": "text/html; charset=utf-8",
			},
		},
	);
};
