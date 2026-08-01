import { randomUUID } from "node:crypto";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "./env.mjs";

const types = {
	apk: "application/vnd.android.package-archive",
	avi: "video/x-msvideo",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	mov: "video/quicktime",
	mp4: "video/mp4",
	pdf: "application/pdf",
	png: "image/png",
	webp: "image/webp",
	zip: "application/zip",
};

const contentType = (key) =>
	types[key.split(".").at(-1)?.toLowerCase()] ?? "application/octet-stream";

const fitSlug = (key, suffix = "") => {
	const value = key.replaceAll("/", "-");
	const extension = value.includes(".") ? `.${value.split(".").at(-1)}` : "";
	const stem = extension ? value.slice(0, -extension.length) : value;
	return `${stem.slice(0, 160 - extension.length - suffix.length)}${suffix}${extension}`;
};

const uniqueSlug = (key, used) => {
	const base = fitSlug(key);
	let value = base;
	for (let index = 1; used.has(value); index += 1)
		value = fitSlug(key, `-file${index > 1 ? `-${index}` : ""}`);
	used.add(value);
	return value;
};

const request = async (env, path, init) => {
	const response = await fetch(`${env.API_BASE_URL}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${env.API_TOKEN}`,
			"content-type": "application/json",
			...init?.headers,
		},
	});
	if (!response.ok)
		throw new Error(`${init?.method ?? "GET"} ${path}: ${response.status}`);
	return response.status === 204 ? null : response.json();
};

const listObjects = async (client, bucket) => {
	const values = [];
	let ContinuationToken;
	do {
		const page = await client.send(
			new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }),
		);
		values.push(
			...(page.Contents ?? []).filter(({ Key }) => Key && !Key.endsWith("/")),
		);
		ContinuationToken = page.NextContinuationToken;
	} while (ContinuationToken);
	return values;
};

const main = async () => {
	const env = await readEnv();
	const client = new S3Client({
		region: env.S3_REGION,
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY,
			secretAccessKey: env.S3_SECRET_KEY,
		},
	});
	const [objects, files, links] = await Promise.all([
		listObjects(client, env.S3_BUCKET_NAME),
		request(env, "/files"),
		request(env, "/links"),
	]);
	const existingKeys = new Set(files.map(({ objectKey }) => objectKey));
	const usedSlugs = new Set(links.map(({ slug }) => slug));
	let migrated = 0;
	for (const object of objects) {
		if (existingKeys.has(object.Key)) continue;
		const slug = uniqueSlug(object.Key, usedSlugs);
		const encodedKey = object.Key.split("/").map(encodeURIComponent).join("/");
		await request(env, "/files", {
			method: "POST",
			body: JSON.stringify({
				id: randomUUID(),
				slug,
				fileName: object.Key.split("/").at(-1),
				objectKey: object.Key,
				contentType: contentType(object.Key),
				size: object.Size ?? 0,
				publicUrl: `${env.NEXT_PUBLIC_S3_URL}/${encodedKey}`,
				createdAt:
					object.LastModified?.toISOString() ?? new Date().toISOString(),
			}),
		});
		migrated += 1;
	}
	console.log(
		JSON.stringify({
			discovered: objects.length,
			migrated,
			skipped: objects.length - migrated,
		}),
	);
};

await main();
