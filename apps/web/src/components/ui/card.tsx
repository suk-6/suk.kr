import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
			className,
		)}
		{...props}
	/>
);
export const CardHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("grid gap-1.5 px-6", className)} {...props} />
);
export const CardContent = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("px-6", className)} {...props} />
);
