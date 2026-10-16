import { FileBrowser } from "../files/browser";

export const FilesSection = () => (
	<>
		<header className="mb-8">
			<p className="text-base text-muted-foreground">S3</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">파일 관리</h1>
		</header>
		<FileBrowser />
	</>
);
