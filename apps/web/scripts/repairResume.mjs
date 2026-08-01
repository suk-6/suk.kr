import { randomUUID } from "node:crypto";
import {
	CopyObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from "@aws-sdk/client-s3";
import { readEnv } from "./env.mjs";

const env = await readEnv();
const headers = {
	authorization: `Bearer ${env.API_TOKEN}`,
	"content-type": "application/json",
};
const request = async (path, init) => {
	const response = await fetch(`${env.API_BASE_URL}${path}`, {
		...init,
		headers,
	});
	if (!response.ok)
		throw new Error(`${init?.method ?? "GET"} ${path}: ${response.status}`);
	return response.json();
};

const link = await request("/links/resume");
const objectKey = "resume.pdf";
const publicUrl = `${env.NEXT_PUBLIC_S3_URL}/${objectKey}`;
const client = new S3Client({
	region: env.S3_REGION,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY,
		secretAccessKey: env.S3_SECRET_KEY,
	},
});
const { Contents } = await client.send(
	new ListObjectsV2Command({ Bucket: env.S3_BUCKET_NAME }),
);
const sourceKey = Contents?.find(
	({ Key }) => Key?.normalize("NFC").includes("이력서") && Key.endsWith(".pdf"),
)?.Key;
if (!sourceKey) throw new Error("이력서 원본을 찾지 못했습니다.");

await client.send(
	new CopyObjectCommand({
		Bucket: env.S3_BUCKET_NAME,
		CopySource: `${env.S3_BUCKET_NAME}/${encodeURIComponent(sourceKey)}`,
		Key: objectKey,
		ContentType: "application/pdf",
		MetadataDirective: "REPLACE",
	}),
);
const object = await client.send(
	new HeadObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: objectKey }),
);
const files = await request("/files");
if (!files.some((file) => file.objectKey === objectKey))
	await request("/files", {
		method: "POST",
		body: JSON.stringify({
			id: randomUUID(),
			slug: objectKey,
			fileName: objectKey,
			objectKey,
			contentType: "application/pdf",
			size: object.ContentLength ?? 0,
			publicUrl,
			createdAt: object.LastModified?.toISOString() ?? new Date().toISOString(),
		}),
	});
await request("/links/resume", {
	method: "PUT",
	body: JSON.stringify({
		slug: "resume",
		targetUrl: publicUrl,
		passwordHash: link.passwordHash,
	}),
});
const settings = await request("/settings");
await request("/settings", {
	method: "PUT",
	body: JSON.stringify({ ...settings, resumeUrl: "https://suk.kr/resume" }),
});
console.log(JSON.stringify({ copied: objectKey, size: object.ContentLength }));
