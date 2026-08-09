"use client";

import type { SiteNotice } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";

export const RenewalNotice = ({ notices }: { notices: SiteNotice[] }) =>
	notices.length > 0 && (
		<Dialog defaultOpen>
			<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
				<DialogTitle className="sr-only">사이트 안내</DialogTitle>
				<DialogDescription className="sr-only">
					현재 공개 중인 사이트 공지입니다.
				</DialogDescription>
				<div>
					{notices.map(({ id, title, content }) => (
						<article className="border-t p-6 first:border-t-0" key={id}>
							<h2 className="pr-6 text-lg leading-none font-semibold">
								{title}
							</h2>
							<p className="mt-3 whitespace-pre-line text-base leading-6 text-muted-foreground">
								{content}
							</p>
						</article>
					))}
				</div>
				<DialogFooter className="border-t p-4">
					<DialogClose render={<Button />}>확인</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
