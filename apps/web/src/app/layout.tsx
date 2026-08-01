import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { assetUrl } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL("https://suk.kr"),
	title: { default: "남우석 — Software Engineer", template: "%s — 남우석" },
	description:
		"제품의 첫 구조부터 운영의 마지막 오류까지 책임지는 소프트웨어 엔지니어 남우석입니다.",
	openGraph: {
		title: "남우석 — Software Engineer",
		description: "Software Engineer based in Seoul.",
		type: "website",
		locale: "ko_KR",
		images: assetUrl("og.png"),
	},
	twitter: {
		card: "summary_large_image",
		title: "남우석 — Software Engineer",
		images: assetUrl("og.png"),
	},
};

export const viewport: Viewport = {
	colorScheme: "dark",
	themeColor: "#09090b",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="ko">
			<body>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
