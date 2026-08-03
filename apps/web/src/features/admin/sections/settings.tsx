import type { Settings } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "../actions";

export const SettingsSection = ({ settings }: { settings: Settings }) => (
	<>
		<header className="mb-8">
			<p className="text-base text-muted-foreground">Profile</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">기본 관리</h1>
		</header>
		<Card className="max-w-4xl">
			<CardHeader>
				<h2 className="font-semibold">공개 프로필</h2>
			</CardHeader>
			<CardContent>
				<form action={saveSettings} className="grid gap-4 md:grid-cols-2">
					<label className="text-base" htmlFor="settings-name">
						이름
						<Input
							id="settings-name"
							name="name"
							defaultValue={settings.name}
							className="mt-1.5"
							required
						/>
					</label>
					<label className="text-base" htmlFor="settings-title">
						직함
						<Input
							id="settings-title"
							name="title"
							defaultValue={settings.title}
							className="mt-1.5"
							required
						/>
					</label>
					<label className="text-base md:col-span-2" htmlFor="settings-intro">
						소개
						<Textarea
							id="settings-intro"
							name="intro"
							defaultValue={settings.intro}
							className="mt-1.5"
							required
						/>
					</label>
					<label className="text-base" htmlFor="settings-email">
						이메일
						<Input
							id="settings-email"
							name="email"
							type="email"
							defaultValue={settings.email}
							className="mt-1.5"
							required
						/>
					</label>
					<label className="text-base" htmlFor="settings-location">
						위치
						<Input
							id="settings-location"
							name="location"
							defaultValue={settings.location}
							className="mt-1.5"
						/>
					</label>
					<label className="text-base" htmlFor="settings-resume">
						이력서 URL
						<Input
							id="settings-resume"
							name="resumeUrl"
							defaultValue={settings.resumeUrl}
							className="mt-1.5"
						/>
					</label>
					<label className="text-base" htmlFor="settings-github">
						GitHub URL
						<Input
							id="settings-github"
							name="githubUrl"
							defaultValue={settings.githubUrl}
							className="mt-1.5"
						/>
					</label>
					<label className="text-base" htmlFor="settings-linkedin">
						LinkedIn URL
						<Input
							id="settings-linkedin"
							name="linkedinUrl"
							defaultValue={settings.linkedinUrl}
							className="mt-1.5"
						/>
					</label>
					<label className="text-base" htmlFor="settings-status">
						상태 메시지
						<Input
							id="settings-status"
							name="availableFor"
							defaultValue={settings.availableFor}
							className="mt-1.5"
						/>
					</label>
					<div className="md:col-span-2">
						<Button>저장</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</>
);
