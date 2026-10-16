import { objectKeySchema } from "@suk/contracts";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import { operationPlan } from "@/features/files/operations";

export const maxDuration = 300;

export async function GET(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const key = objectKeySchema.parse(
			new URL(request.url).searchParams.get("objectKey"),
		);
		return Response.json(await operationPlan(key));
	} catch (error) {
		return fileError(error);
	}
}
