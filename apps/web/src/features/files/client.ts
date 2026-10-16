"use client";

export class FileRequestError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "FileRequestError";
	}
}

export const fileRequest = async <T>(
	url: string,
	method = "GET",
	value?: unknown,
	timeout = 60_000,
): Promise<T> => {
	try {
		const response = await fetch(url, {
			method,
			cache: "no-store",
			headers:
				value === undefined
					? undefined
					: { "Content-Type": "application/json" },
			body: value === undefined ? undefined : JSON.stringify(value),
			signal: AbortSignal.timeout(timeout),
		});
		if (response.status === 204) return undefined as T;
		const body = await response.json().catch(() => null);
		if (!response.ok)
			throw new FileRequestError(
				typeof body?.error === "string"
					? body.error
					: `파일 요청에 실패했습니다. (${response.status})`,
				response.status,
			);
		if (!body) throw new Error("파일 서버가 올바른 응답을 보내지 않았습니다.");
		return body as T;
	} catch (error) {
		if (
			error instanceof Error &&
			["TimeoutError", "AbortError"].includes(error.name)
		)
			throw new Error(
				"요청 시간이 초과되었습니다. 목록을 새로고침해 결과를 확인하세요.",
			);
		throw error;
	}
};

export const uploadBytes = (
	url: string,
	file: File,
	contentType: string,
	headers: Record<string, string>,
	progress: (percent: number) => void,
) =>
	new Promise<void>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open("PUT", url);
		request.timeout = 10 * 60_000;
		if (
			!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
		)
			request.setRequestHeader("Content-Type", contentType);
		for (const [name, value] of Object.entries(headers))
			request.setRequestHeader(name, value);
		request.upload.onprogress = (event) => {
			if (event.lengthComputable)
				progress(Math.round((event.loaded / event.total) * 100));
		};
		request.onload = () => {
			if (request.status >= 200 && request.status < 300) resolve();
			else
				reject(
					new FileRequestError(
						`S3 업로드 실패 (${request.status}). 같은 경로로 다시 시도하세요.`,
						request.status,
					),
				);
		};
		request.onerror = () =>
			reject(
				new Error(
					"S3에 연결할 수 없습니다. 네트워크와 버킷 CORS 설정을 확인하세요.",
				),
			);
		request.ontimeout = () =>
			reject(
				new Error(
					"S3 업로드 시간이 초과되었습니다. 목록을 새로고침해 업로드 여부를 확인하세요.",
				),
			);
		request.onabort = () => reject(new Error("업로드가 취소되었습니다."));
		request.send(file);
	});
