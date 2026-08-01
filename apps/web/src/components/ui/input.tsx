import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = ({
	className,
	...props
}: InputHTMLAttributes<HTMLInputElement>) => (
	<input
		className={cn(
			"h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-500",
			className,
		)}
		{...props}
	/>
);
