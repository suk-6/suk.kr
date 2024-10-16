import { createItem } from "@/lib/edge-config";
import { CreateItemInput } from "@/ui/components/input/dashboard";
import { useState } from "react";

export const CreateView = () => {
	const [slug, setSlug] = useState("");
	const [redirectURL, setRedirectURL] = useState("");
	const [password, setPassword] = useState("");

	const clear = () => {
		setSlug("");
		setRedirectURL("");
		setPassword("");
	};

	return (
		<div className="w-full h-20 border-2 border-gray-300">
			<div className="w-full h-full p-3 flex flex-row gap-2 *:bg-gray-100 *:rounded-md *:flex *:justify-center *:items-center *:px-3">
				<div className="w-1/6">
					<CreateItemInput value={slug} setValue={setSlug} placeholder="Slug" />
				</div>
				<div className="w-3/6">
					<CreateItemInput
						value={redirectURL}
						setValue={setRedirectURL}
						placeholder="Redirect URL"
					/>
				</div>
				<div className="w-1/6">
					<CreateItemInput
						value={password}
						setValue={setPassword}
						placeholder="Password"
					/>
				</div>
				<div className="w-1/6">
					<button
						className="font-semibold bg-gray-100"
						onClick={() => {
							createItem({
								slug,
								redirectURL,
								password: password === "" ? null : password,
							}).then(() => clear());
						}}
					>
						Submit
					</button>
				</div>
			</div>
		</div>
	);
};
