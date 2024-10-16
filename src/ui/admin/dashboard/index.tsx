import { BiLogOut } from "react-icons/bi";

export const Dashboard = () => {
	return (
		<main className="relative w-screen h-screen">
			<nav className="px-4 py-2 border-b-2 flex justify-between">
				<h2 className="text-2xl font-semibold">Dashboard</h2>
				<BiLogOut className="h-full text-3xl text-gray-700" />
			</nav>
		</main>
	);
};
