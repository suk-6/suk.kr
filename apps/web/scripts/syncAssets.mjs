import { readFile } from "node:fs/promises";
import {
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { readEnv } from "./env.mjs";

const sources = [
	{
		key: "assets/profile.png",
		contentType: "image/png",
		file: "../src/app/icon.png",
	},
	{
		key: "assets/og.png",
		contentType: "image/png",
		file: "../public/og.png",
	},
	{
		key: "assets/projects/zioform.webp",
		contentType: "image/webp",
		url: "https://storage.surfit.io/thumbs/career/portfolio/cover/3a77Y/5259420456a11460acb96c-png/cover.webp",
	},
	{
		key: "assets/projects/adego.webp",
		contentType: "image/webp",
		url: "https://storage.surfit.io/thumbs/career/portfolio/cover/3a77Y/21091325936608d3e07afd6-png/cover.webp",
	},
	{
		key: "assets/projects/walkability.webp",
		contentType: "image/webp",
		url: "https://storage.surfit.io/thumbs/career/portfolio/cover/3a77Y/9047427926a1146998b25c-png/cover.webp",
	},
	{
		key: "assets/projects/water-safety.webp",
		contentType: "image/webp",
		url: "https://storage.surfit.io/thumbs/career/portfolio/cover/3a77Y/6029183706608d4c0bd0b9-png/cover.webp",
	},
];

const load = async (source) => {
	if (source.file) return readFile(new URL(source.file, import.meta.url));
	const response = await fetch(source.url);
	if (!response.ok) throw new Error(`${source.url}: ${response.status}`);
	return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
	const env = await readEnv();
	const force = process.argv.includes("--force");
	const client = new S3Client({
		region: env.S3_REGION,
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY,
			secretAccessKey: env.S3_SECRET_KEY,
		},
	});
	const uploaded = [];
	const skipped = [];
	for (const source of sources) {
		if (!force) {
			try {
				await client.send(
					new HeadObjectCommand({
						Bucket: env.S3_BUCKET_NAME,
						Key: source.key,
					}),
				);
				skipped.push(source.key);
				continue;
			} catch (error) {
				if (error?.$metadata?.httpStatusCode !== 404) throw error;
			}
		}
		await client.send(
			new PutObjectCommand({
				Bucket: env.S3_BUCKET_NAME,
				Key: source.key,
				Body: await load(source),
				ContentType: source.contentType,
				CacheControl: "public, max-age=86400",
			}),
		);
		uploaded.push(source.key);
	}
	const baseUrl = env.NEXT_PUBLIC_S3_URL.replace(/\/$/, "");
	console.log(
		JSON.stringify({
			uploaded,
			skipped,
			assets: sources.map(({ key }) => `${baseUrl}/${key}`),
		}),
	);
};

await main();
