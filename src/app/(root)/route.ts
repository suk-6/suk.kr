import { PF_SITE } from "@/lib/constants";
import { redirect } from "next/navigation";

export async function GET() {
	return redirect(PF_SITE);
}
