import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Badge = ({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) => (
	<span
		className={cn(
			"inline-flex rounded-full border border-zinc-300 px-2.5 py-1 text-xs",
			className,
		)}
		{...props}
	/>
);
