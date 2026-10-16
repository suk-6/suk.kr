import { S3ServiceException } from "@aws-sdk/client-s3";
import { ApiError } from "@/lib/api/client";

export const fileError = (error: unknown) => {
	if (
		error instanceof SyntaxError ||
		(error instanceof Error && error.name === "ZodError")
	)
		return Response.json(
			{ error: "잘못된 요청입니다. 파일명과 단축 링크를 확인하세요." },
			{ status: 400 },
		);
	if (error instanceof ApiError)
		return Response.json({ error: error.message }, { status: error.status });
	if (error instanceof S3ServiceException) {
		const status = error.$metadata.httpStatusCode;
		return Response.json(
			{
				error:
					status === 409 || status === 412
						? "S3 객체가 변경되었거나 이미 존재합니다. 목록을 새로고침하여 다시 확인하세요."
						: status === 404
							? "S3 객체를 찾을 수 없습니다. 목록을 새로고침하세요."
							: status === 403
								? "S3 접근이 거부되었습니다. 서버 자격 증명과 버킷 권한을 확인하세요."
								: "S3 요청에 실패했습니다. 잠시 후 다시 시도하세요.",
			},
			{
				status:
					status === 404 ? 404 : status === 409 || status === 412 ? 409 : 502,
			},
		);
	}
	const message =
		error instanceof Error ? error.message : "파일 작업에 실패했습니다.";
	return Response.json(
		{
			error: message.includes("환경 변수")
				? message
				: "파일 서버 요청에 실패했거나 시간이 초과되었습니다. 다시 시도하세요.",
		},
		{ status: 502 },
	);
};
