import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AdminData } from "../data";

export const OverviewSection = ({ data }: { data: AdminData }) => {
	const counts = [
		["프로젝트", data.projects.length],
		["경력·활동", data.entries.length],
		["단축 URL", data.links.length],
		["관리 파일", data.files.length],
	];
	return (
		<>
			<header className="mb-8">
				<p className="text-base text-muted-foreground">Overview</p>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">
					안녕하세요, 우석님.
				</h1>
			</header>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{counts.map(([label, value]) => (
					<Card key={label}>
						<CardHeader>
							<p className="text-base text-muted-foreground">{label}</p>
						</CardHeader>
						<CardContent>
							<span className="text-3xl font-semibold tracking-tight">
								{value}
							</span>
						</CardContent>
					</Card>
				))}
			</div>
			<Card className="mt-6">
				<CardHeader>
					<h2 className="font-semibold">운영 구조</h2>
				</CardHeader>
				<CardContent className="grid gap-5 text-base text-muted-foreground md:grid-cols-3">
					<div>
						<span className="block font-medium text-foreground">suk.kr</span>
						Next.js · Vercel
						<br />
						렌더링과 모든 요청 처리
					</div>
					<div>
						<span className="block font-medium text-foreground">
							api.suk.kr
						</span>
						Cloudflare Workers · D1
						<br />
						상태와 관계 데이터
					</div>
					<div>
						<span className="block font-medium text-foreground">
							file.suk.kr
						</span>
						기존 SSFS · S3
						<br />
						파일 바이트 저장
					</div>
				</CardContent>
			</Card>
		</>
	);
};
