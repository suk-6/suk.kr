import { logoutAdmin } from "@/lib/actions/admin/logout";
import { BiLogOut } from "react-icons/bi";

export const Logout = () => (
	<button
		onClick={() => {
			logoutAdmin();
		}}
	>
		<BiLogOut className="h-full text-3xl text-gray-700" />
	</button>
);
