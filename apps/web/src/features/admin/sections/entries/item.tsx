"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Entry } from "@suk/contracts";
import { GripVertical, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { entryLabels } from "./config";
import { EntrySorter } from "./sorter";

export const EntryItem = ({
	entry,
	index,
	dirty,
	deleted,
	disabled,
	entries,
	sorterOpen,
	onChange,
	onDelete,
	onMove,
	onReset,
	onSorterOpenChange,
}: {
	entry: Entry;
	index: number;
	dirty: boolean;
	deleted: boolean;
	disabled: boolean;
	entries: Entry[];
	sorterOpen: boolean;
	onChange: (entry: Entry) => void;
	onDelete: () => void;
	onMove: (from: string, to: string) => void;
	onReset: () => void;
	onSorterOpenChange: (open: boolean) => void;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: entry.id, disabled: deleted || disabled });
	const field = (key: keyof Entry, value: Entry[keyof Entry]) =>
		onChange({ ...entry, [key]: value });

	return (
		<Card
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={isDragging ? "z-20 shadow-lg" : deleted ? "opacity-60" : ""}
		>
			<CardHeader>
				<CardTitle className="flex flex-wrap items-center gap-2">
					{entry.title.trim() || `새 ${entryLabels[entry.kind]}`}
					{dirty && (
						<Badge variant={deleted ? "destructive" : "secondary"}>
							{deleted ? "삭제 예정" : "변경됨"}
						</Badge>
					)}
				</CardTitle>
				<CardDescription>{index + 1}번째 항목</CardDescription>
				<CardAction>
					<Popover open={sorterOpen} onOpenChange={onSorterOpenChange}>
						<PopoverTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={deleted || disabled}
									aria-label="드래그하거나 클릭해 순서 변경"
									{...attributes}
									{...listeners}
								/>
							}
						>
							<GripVertical />
						</PopoverTrigger>
						{sorterOpen && (
							<PopoverContent side="left" align="start" sideOffset={8}>
								<PopoverHeader className="px-2 pt-1">
									<PopoverTitle>순서 변경</PopoverTitle>
								</PopoverHeader>
								<EntrySorter entries={entries} onMove={onMove} />
							</PopoverContent>
						)}
					</Popover>
				</CardAction>
			</CardHeader>
			<CardContent>
				<fieldset disabled={deleted || disabled}>
					<FieldGroup className="grid gap-4 md:grid-cols-2">
						<Field>
							<FieldLabel htmlFor={`${entry.id}-title`}>제목 / 역할</FieldLabel>
							<Input
								id={`${entry.id}-title`}
								value={entry.title}
								onChange={(event) => field("title", event.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={`${entry.id}-organization`}>
								기관 / 회사
							</FieldLabel>
							<Input
								id={`${entry.id}-organization`}
								value={entry.organization}
								onChange={(event) => field("organization", event.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={`${entry.id}-startDate`}>시작</FieldLabel>
							<Input
								id={`${entry.id}-startDate`}
								placeholder="2024.11"
								value={entry.startDate}
								onChange={(event) => field("startDate", event.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={`${entry.id}-endDate`}>종료</FieldLabel>
							<Input
								id={`${entry.id}-endDate`}
								placeholder="현재"
								value={entry.endDate}
								onChange={(event) => field("endDate", event.target.value)}
							/>
						</Field>
						<Field className="md:col-span-2">
							<FieldLabel htmlFor={`${entry.id}-description`}>설명</FieldLabel>
							<Textarea
								id={`${entry.id}-description`}
								value={entry.description}
								onChange={(event) => field("description", event.target.value)}
							/>
						</Field>
						<Field className="md:col-span-2">
							<FieldLabel htmlFor={`${entry.id}-url`}>관련 URL</FieldLabel>
							<Input
								id={`${entry.id}-url`}
								type="url"
								value={entry.url}
								onChange={(event) => field("url", event.target.value)}
							/>
						</Field>
						<Field orientation="horizontal">
							<Switch
								id={`${entry.id}-visible`}
								checked={entry.visible}
								onCheckedChange={(checked) => field("visible", checked)}
							/>
							<FieldLabel htmlFor={`${entry.id}-visible`}>공개</FieldLabel>
						</Field>
						{entry.kind === "award" && (
							<Field orientation="horizontal">
								<Switch
									id={`${entry.id}-summaryHidden`}
									checked={entry.summaryHidden}
									onCheckedChange={(checked) => field("summaryHidden", checked)}
								/>
								<FieldLabel htmlFor={`${entry.id}-summaryHidden`}>
									간략히 표시에서 숨김
								</FieldLabel>
							</Field>
						)}
					</FieldGroup>
				</fieldset>
			</CardContent>
			<CardFooter className="gap-2 border-t">
				<Button
					type="button"
					variant="outline"
					disabled={!dirty || disabled}
					onClick={onReset}
				>
					<RotateCcw /> {deleted ? "삭제 취소" : "되돌리기"}
				</Button>
				{!deleted && (
					<Button
						type="button"
						variant="destructive"
						disabled={disabled}
						onClick={onDelete}
					>
						<Trash2 /> 삭제
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};
