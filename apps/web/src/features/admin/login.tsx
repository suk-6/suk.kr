import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/actions";

export const AdminLogin = ({ invalid }: { invalid: boolean }) => (
	<main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
		<form
			action={login}
			className="w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
		>
			<div className="mb-6 flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
				<LockKeyhole size={20} />
			</div>
			<h1 className="text-xl font-semibold tracking-tight">suk.kr admin</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				관리자 비밀번호를 입력하세요.
			</p>
			<Input
				name="password"
				type="password"
				autoFocus
				required
				className="mt-6"
			/>
			{invalid && (
				<p className="mt-3 text-sm text-red-400">
					비밀번호가 올바르지 않습니다.
				</p>
			)}
			<Button className="mt-4 w-full">로그인</Button>
		</form>
	</main>
);
