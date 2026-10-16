import {
	CopyObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "server-only";

const storage = () => {
	for (const name of [
		"S3_REGION",
		"S3_BUCKET_NAME",
		"S3_ACCESS_KEY",
		"S3_SECRET_KEY",
	]) {
		if (!process.env[name]) throw new Error(`${name} 환경 변수를 설정하세요.`);
	}
	return new S3Client({
		region: process.env.S3_REGION,
		endpoint: process.env.S3_ENDPOINT || undefined,
		forcePathStyle: Boolean(process.env.S3_ENDPOINT),
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY!,
			secretAccessKey: process.env.S3_SECRET_KEY!,
		},
		requestChecksumCalculation: "WHEN_REQUIRED",
		maxAttempts: 2,
		requestHandler: { connectionTimeout: 5_000, requestTimeout: 15_000 },
	});
};
const options = () => ({ abortSignal: AbortSignal.timeout(20_000) });
export const publicObjectUrl = (key: string) =>
	`${(process.env.NEXT_PUBLIC_S3_URL || "https://file.suk.kr").replace(/\/+$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;

export const signUpload = (
	objectKey: string,
	contentType: string,
	overwrite = true,
	etag?: string,
) =>
	getSignedUrl(
		storage(),
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
			ContentType: contentType,
			IfNoneMatch: overwrite ? undefined : "*",
			IfMatch: overwrite ? etag : undefined,
		}),
		{
			expiresIn: 600,
			signableHeaders: new Set(["content-type", "if-none-match", "if-match"]),
		},
	);

export const headObject = (objectKey: string) =>
	storage().send(
		new HeadObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
		}),
		options(),
	);
export const findObject = async (objectKey: string) => {
	try {
		return await headObject(objectKey);
	} catch (error) {
		if (
			error instanceof S3ServiceException &&
			error.$metadata.httpStatusCode === 404
		)
			return null;
		throw error;
	}
};

export const listObjects = (
	prefix: string,
	token?: string,
	delimiter: string | undefined = "/",
	maxKeys = 50,
) =>
	storage().send(
		new ListObjectsV2Command({
			Bucket: process.env.S3_BUCKET_NAME,
			Prefix: prefix,
			Delimiter: delimiter,
			MaxKeys: maxKeys,
			ContinuationToken: token,
		}),
		options(),
	);

// Recursive operations page through S3; they never infer inventory from D1.
export async function* folderObjects(prefix: string) {
	let token: string | undefined;
	do {
		const page = await listObjects(prefix, token, "", 1000);
		for (const object of page.Contents ?? []) if (object.Key) yield object;
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
}
export const createFolder = (prefix: string) =>
	storage().send(
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: prefix,
			Body: "",
			ContentType: "application/x-directory",
			IfNoneMatch: "*",
		}),
		options(),
	);
export const deleteObject = (objectKey: string, etag?: string) =>
	storage().send(
		new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
			IfMatch: etag,
		}),
		options(),
	);
export const copyObject = (
	source: string,
	destination: string,
	etag?: string,
) =>
	storage().send(
		new CopyObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: destination,
			CopySource: `${process.env.S3_BUCKET_NAME}/${source.split("/").map(encodeURIComponent).join("/")}`,
			CopySourceIfMatch: etag,
			IfNoneMatch: "*",
		}),
		options(),
	);
