import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/actions";

export const AdminLogin = ({ invalid }: { invalid: boolean }) => (
	<main className="flex min-h-svh items-center justify-center bg-background p-6 font-normal text-foreground">
		<Card className="w-full max-w-sm">
			<CardHeader>
				<div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted">
					<LockKeyhole />
				</div>
				<CardTitle>suk.kr admin</CardTitle>
				<CardDescription>관리자 비밀번호를 입력하세요.</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={login} className="space-y-4">
					<Field data-invalid={invalid}>
						<FieldLabel htmlFor="admin-password">비밀번호</FieldLabel>
						<Input
							id="admin-password"
							name="password"
							type="password"
							autoFocus
							required
							aria-invalid={invalid}
						/>
						{invalid && <FieldError>비밀번호가 올바르지 않습니다.</FieldError>}
					</Field>
					<Button className="w-full">로그인</Button>
				</form>
			</CardContent>
		</Card>
	</main>
);
