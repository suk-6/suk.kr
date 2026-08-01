import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = cva(
	"inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-zinc-950 text-white hover:bg-zinc-800",
				outline: "border border-zinc-200 bg-white hover:bg-zinc-50",
				destructive: "bg-red-600 text-white hover:bg-red-500",
				ghost: "hover:bg-zinc-100",
				link: "h-auto px-0 underline underline-offset-4",
			},
			size: { default: "h-9", sm: "h-8 px-3 text-xs", lg: "h-11 px-6" },
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export const Button = ({
	className,
	variant,
	size,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>) => (
	<button className={cn(variants({ variant, size }), className)} {...props} />
);
