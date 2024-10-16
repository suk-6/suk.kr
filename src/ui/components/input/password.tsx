import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

interface PasswordInputProps<T extends string[] = []> {
	checkPassword: (password: string, ...args: T) => void;
	args: T;
}

export const PasswordInput = <T extends string[]>({
	checkPassword,
	args,
}: PasswordInputProps<T>) => {
	const [blink, setBlink] = useState(false);
	const [password, setPassword] = useState("");

	return (
		<div className=" flex flex-col gap-5 text-center bg-gray-950 p-3 rounded-xl">
			<div className="relative w-[22rem] h-10 border border-slate-100 rounded-md overflow-hidden flex flex-row gap-1 px-2">
				<input
					type={blink ? "text" : "password"}
					className="w-full h-full text-white bg-gray-950 outline-none"
					placeholder="Enter password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					onKeyDown={(e) =>
						e.key === "Enter" && checkPassword(password, ...args)
					}
				/>
				<button
					onClick={() => setBlink(!blink)}
					className="text-2xl h-full text-gray-200"
				>
					{blink ? <IoMdEye /> : <IoMdEyeOff />}
				</button>
			</div>
		</div>
	);
};
