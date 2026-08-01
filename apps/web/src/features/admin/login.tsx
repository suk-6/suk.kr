import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/actions";

export const AdminLogin = ({ invalid }: { invalid: boolean }) => (
	<main className="flex min-h-svh items-center justify-center bg-zinc-950 p-6 text-white">
		<form
			action={login}
			className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl"
		>
			<div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
				<LockKeyhole size={20} />
			</div>
			<h1 className="text-2xl font-semibold tracking-tight">suk.kr admin</h1>
			<p className="mt-2 text-sm text-zinc-400">
				관리자 비밀번호를 입력하세요.
			</p>
			<Input
				name="password"
				type="password"
				autoFocus
				required
				className="mt-7 border-zinc-700 bg-zinc-950 text-white"
			/>
			{invalid && (
				<p className="mt-3 text-sm text-red-400">
					비밀번호가 올바르지 않습니다.
				</p>
			)}
			<Button className="mt-4 w-full bg-white text-zinc-950 hover:bg-zinc-200">
				로그인
			</Button>
		</form>
	</main>
);
