"use client";

import type { NoteListItem } from "@suk/contracts";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { removeNote } from "./actions";

export function NotesTable({ notes }: { notes: NoteListItem[] }) {
	return (
		<div className="overflow-x-auto rounded-lg border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>크기</TableHead>
						<TableHead>잠금</TableHead>
						<TableHead>수정 시간</TableHead>
						<TableHead className="text-right">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{notes.map((note) => (
						<TableRow key={note.id}>
							<TableCell>
								<Link
									className="underline underline-offset-4"
									href={`/note/${note.id}` as Route}
								>
									{note.id}
								</Link>
							</TableCell>
							<TableCell>{note.size.toLocaleString()} B</TableCell>
							<TableCell>{note.locked ? "잠김" : "열림"}</TableCell>
							<TableCell>
								{new Date(note.updatedAt).toLocaleString("ko-KR", {
									timeZone: "Asia/Seoul",
								})}
							</TableCell>
							<TableCell className="text-right">
								<Dialog>
									<DialogTrigger
										render={<Button size="sm" variant="destructive" />}
									>
										삭제
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>노트 삭제</DialogTitle>
											<DialogDescription>
												{note.id} 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수
												없습니다.
											</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<DialogClose render={<Button variant="outline" />}>
												취소
											</DialogClose>
											<form action={removeNote}>
												<input type="hidden" name="id" value={note.id} />
												<Button type="submit" variant="destructive">
													삭제
												</Button>
											</form>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{notes.length === 0 && (
				<p className="p-6 text-sm text-muted-foreground">
					저장된 노트가 없습니다.
				</p>
			)}
		</div>
	);
}
