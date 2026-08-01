import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = ({
	className,
	...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
	<textarea
		className={cn(
			"min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500",
			className,
		)}
		{...props}
	/>
);
