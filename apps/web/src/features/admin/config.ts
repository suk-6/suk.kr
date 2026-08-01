import type { EntryKind } from "@suk/contracts";
import {
	Activity,
	Award,
	BriefcaseBusiness,
	FileText,
	FolderUp,
	GraduationCap,
	LayoutDashboard,
	Link2,
	Settings,
	Sparkles,
} from "lucide-react";

export const sections = [
	{ id: "overview", label: "대시보드", icon: LayoutDashboard },
	{ id: "settings", label: "기본 관리", icon: Settings },
	{ id: "projects", label: "프로젝트 관리", icon: Sparkles },
	{ id: "experience", label: "경력 관리", icon: BriefcaseBusiness },
	{ id: "education", label: "학력 관리", icon: GraduationCap },
	{ id: "activity", label: "활동 관리", icon: Activity },
	{ id: "award", label: "수상 관리", icon: Award },
	{ id: "certificate", label: "자격 관리", icon: FileText },
	{ id: "skills", label: "기술 관리", icon: Sparkles },
	{ id: "links", label: "단축 URL", icon: Link2 },
	{ id: "files", label: "파일 관리", icon: FolderUp },
] as const;

export type Section = (typeof sections)[number]["id"];
export const entrySections = new Set<EntryKind>([
	"experience",
	"education",
	"activity",
	"award",
	"certificate",
]);
