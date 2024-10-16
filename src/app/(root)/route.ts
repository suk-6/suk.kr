import { PF_SITE } from "@/constants";
import { redirect } from "next/navigation";

export async function GET() {
	return redirect(PF_SITE);
}
