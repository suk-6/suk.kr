"use client";

import { loginAdmin } from "@/lib/actions/admin/login";
import { PasswordInput } from "../components/input/password";

export const Login = () => {
	return (
		<main className="relative w-screen h-screen flex justify-center items-center">
			<PasswordInput checkPassword={loginAdmin} args={[]} />
		</main>
	);
};
