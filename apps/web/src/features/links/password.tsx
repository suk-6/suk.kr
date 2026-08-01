import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlock } from "./actions";

export const Password = ({
	slug,
	invalid,
}: {
	slug: string;
	invalid: boolean;
}) => (
	<main className="flex min-h-svh items-center justify-center bg-zinc-950 p-6 text-white">
		<form
			action={unlock.bind(null, slug)}
			className="w-full max-w-sm rounded-2xl border border-zinc-800 p-7"
		>
			<LockKeyhole className="mb-8" />
			<p className="text-sm text-zinc-400">suk.kr/{slug}</p>
			<h1 className="mt-1 text-2xl font-semibold">보호된 링크</h1>
			<Input
				name="password"
				type="password"
				placeholder="비밀번호"
				autoFocus
				required
				className="mt-6 border-zinc-700 bg-zinc-900 text-white"
			/>
			{invalid && (
				<p className="mt-2 text-sm text-red-400">
					비밀번호가 올바르지 않습니다.
				</p>
			)}
			<Button className="mt-4 w-full bg-white text-zinc-950">계속</Button>
		</form>
	</main>
);
