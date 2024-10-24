import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
	title: "URL Shortener",
	description: "Suk's URL Shortener",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
