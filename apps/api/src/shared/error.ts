export class ApiError extends Error {
	constructor(
		readonly status: 404 | 409,
		message: string,
	) {
		super(message);
	}
}
