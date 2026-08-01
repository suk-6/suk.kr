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
				<p className="text-sm text-zinc-500">Overview</p>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">
					안녕하세요, 우석님.
				</h1>
			</header>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{counts.map(([label, value]) => (
					<Card key={label}>
						<CardHeader>
							<p className="text-sm text-zinc-500">{label}</p>
						</CardHeader>
						<CardContent>
							<strong className="text-4xl tracking-tight">{value}</strong>
						</CardContent>
					</Card>
				))}
			</div>
			<Card className="mt-6">
				<CardHeader>
					<h2 className="font-semibold">운영 구조</h2>
				</CardHeader>
				<CardContent className="grid gap-5 text-sm text-zinc-600 md:grid-cols-3">
					<div>
						<b className="block text-zinc-950">suk.kr</b>Next.js · Vercel
						<br />
						렌더링과 모든 요청 처리
					</div>
					<div>
						<b className="block text-zinc-950">api.suk.kr</b>Cloudflare Workers
						· D1
						<br />
						상태와 관계 데이터
					</div>
					<div>
						<b className="block text-zinc-950">file.suk.kr</b>기존 SSFS · S3
						<br />
						파일 바이트 저장
					</div>
				</CardContent>
			</Card>
		</>
	);
};
