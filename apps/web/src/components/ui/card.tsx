import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("rounded-xl border border-zinc-200 bg-white", className)}
		{...props}
	/>
);
export const CardHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("border-b border-zinc-100 p-5", className)} {...props} />
);
export const CardContent = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("p-5", className)} {...props} />
);
