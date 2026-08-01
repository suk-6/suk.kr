import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "server-only";

const client = new S3Client({
	region: process.env.S3_REGION,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY ?? "",
		secretAccessKey: process.env.S3_SECRET_KEY ?? "",
	},
});

export const signUpload = (objectKey: string, contentType: string) =>
	getSignedUrl(
		client,
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
			ContentType: contentType,
		}),
		{ expiresIn: 60 },
	);

export const deleteObject = (objectKey: string) =>
	client.send(
		new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
		}),
	);
