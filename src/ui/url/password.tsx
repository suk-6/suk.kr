"use client";

import { checkPassword } from "@/lib/actions/item/check";
import { useParams } from "next/navigation";
import { PasswordInput } from "../components/input/password";

export const RequiresPassword = () => {
	const { slug } = useParams<{ slug: string }>();

	return (
		<main className="relative w-screen h-screen flex justify-center items-center bg-gray-1">
			<PasswordInput checkPassword={checkPassword} args={[slug]} />
		</main>
	);
};
