import {
	DeleteObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
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

export const objectExists = async (objectKey: string) => {
	try {
		await client.send(
			new HeadObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: objectKey,
			}),
		);
		return true;
	} catch (error) {
		if (
			error instanceof S3ServiceException &&
			error.$metadata.httpStatusCode === 404
		)
			return false;
		throw error;
	}
};

export const deleteObject = (objectKey: string) =>
	client.send(
		new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: objectKey,
		}),
	);
