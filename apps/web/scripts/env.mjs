import { readFile } from "node:fs/promises";

export const readEnv = async () =>
	Object.fromEntries(
		(await readFile(new URL("../.env.local", import.meta.url), "utf8"))
			.split(/\r?\n/)
			.filter(Boolean)
			.map((line) => {
				const separator = line.indexOf("=");
				const value = line.slice(separator + 1);
				return [
					line.slice(0, separator),
					value.length > 1 && ['"', "'"].includes(value.at(0))
						? value.slice(1, -1)
						: value,
				];
			}),
	);
