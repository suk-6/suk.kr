import { checkAdmin } from "@/lib/actions/admin/check";
import { Dashboard } from "@/ui/admin/dashboard";
import { Login } from "@/ui/admin/login";

export default async function Admin() {
	return checkAdmin() ? <Dashboard /> : <Login />;
}
