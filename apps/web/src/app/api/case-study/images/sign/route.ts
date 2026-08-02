import { signUpload } from "@/features/files/s3";
import { isAdmin } from "@/lib/auth/session";

const imageTypes = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

export async function POST(request: Request) {
	if (!(await isAdmin()))
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	const value = (await request.json().catch(() => null)) as {
		fileName?: unknown;
		contentType?: unknown;
		size?: unknown;
	} | null;
	if (
		!value ||
		typeof value.fileName !== "string" ||
		value.fileName.length === 0 ||
		value.fileName.length > 240 ||
		typeof value.contentType !== "string" ||
		!imageTypes.has(value.contentType) ||
		typeof value.size !== "number" ||
		!Number.isInteger(value.size) ||
		value.size <= 0 ||
		value.size > 10 * 1024 * 1024
	)
		return Response.json(
			{
				error: "10MB 이하의 JPG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.",
			},
			{ status: 400 },
		);
	const safeName = value.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
	const objectKey = `assets/case-studies/${crypto.randomUUID()}-${safeName}`;
	return Response.json({
		uploadUrl: await signUpload(objectKey, value.contentType),
		publicUrl: `${process.env.NEXT_PUBLIC_S3_URL}/${objectKey}`,
	});
}
