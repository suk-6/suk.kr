import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createElement } from "react";
import satori from "satori";
import sharp from "sharp";

const font = fs.readFile(
	path.join(process.cwd(), "public/Pretendard-Bold.woff"),
);

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	if (!slug) return new NextResponse("Not found", { status: 404 });
	const element = createElement(
		"div",
		{
			style: {
				alignItems: "center",
				background: "#f3f0e8",
				color: "#121212",
				display: "flex",
				fontFamily: "Pretendard",
				fontSize: 112,
				height: "100%",
				justifyContent: "center",
				padding: 48,
				textAlign: "center",
				width: "100%",
			},
		},
		decodeURIComponent(slug),
	);
	const svg = await satori(element, {
		width: 1200,
		height: 630,
		fonts: [{ name: "Pretendard", data: await font, weight: 700 }],
	});
	return new NextResponse(await sharp(Buffer.from(svg)).png().toBuffer(), {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}
