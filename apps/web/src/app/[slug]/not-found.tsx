export default function NotFound() {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
			<p className="text-sm text-zinc-500">404</p>
			<h1 className="mt-2 text-4xl font-semibold">링크를 찾을 수 없습니다.</h1>
			<a href="/" className="mt-8 underline underline-offset-4">
				suk.kr로 돌아가기
			</a>
		</main>
	);
}
