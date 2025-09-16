import fs from 'fs/promises'
import path from 'path';
import satori from 'satori';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

const fontFile = await fs.readFile(
  path.resolve("./public/Pretendard-Bold.woff"),
);

const options = {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "Pretendard",
      data: fontFile,
    },
  ],
};

type Params = {
  slug: string;
}

export async function GET(_: Request, {params}: { params: Params }) {
  if (!params.slug) return new NextResponse("Not found", { status: 404 });

  const svg = await satori(
    //@ts-expect-error
    {
      type: "div",
      props: {
        children: decodeURIComponent(params.slug),
        style: {
          width: "100%",
          height: "100%",
          color: "black",
          textAlign: "center",
          fontSize: 120,
          fontFamily: "Pretendard",
          backgroundColor: "white",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    options,
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
}