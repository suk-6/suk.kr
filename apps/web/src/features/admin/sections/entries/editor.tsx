"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { entrySchema, type Entry, type EntryKind } from "@suk/contracts";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { saveEntries } from "../../actions";
import { EntryItem } from "./item";

const same = (left?: Entry, right?: Entry) =>
	JSON.stringify(left) === JSON.stringify(right);

export const EntriesEditor = ({
	kind,
	label,
	initialEntries,
}: {
	kind: EntryKind;
	label: string;
	initialEntries: Entry[];
}) => {
	const [baseline, setBaseline] = useState(initialEntries);
	const [entries, setEntries] = useState(initialEntries);
	const [deletedIds, setDeletedIds] = useState<string[]>([]);
	const [sorterId, setSorterId] = useState<string>();
	const [pending, startTransition] = useTransition();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const baselineById = useMemo(
		() => new Map(baseline.map((entry) => [entry.id, entry])),
		[baseline],
	);
	const activeEntries = entries.filter(({ id }) => !deletedIds.includes(id));
	const baselineActive = baseline.filter(({ id }) => !deletedIds.includes(id));
	const orderChanged = activeEntries.some(
		({ id }, index) => baselineActive[index]?.id !== id,
	);
	const changedIds = new Set(
		entries.flatMap((entry) => {
			if (deletedIds.includes(entry.id)) return [entry.id];
			const activeIndex = activeEntries.findIndex(({ id }) => id === entry.id);
			const baselineIndex = baselineActive.findIndex(
				({ id }) => id === entry.id,
			);
			return !same(entry, baselineById.get(entry.id)) ||
				activeIndex !== baselineIndex
				? [entry.id]
				: [];
		}),
	);

	const resetEntry = (id: string) => {
		const original = baselineById.get(id);
		if (!original) {
			setEntries((current) => current.filter((entry) => entry.id !== id));
			return;
		}
		setDeletedIds((current) => current.filter((value) => value !== id));
		setEntries((current) => {
			const next = current.filter((entry) => entry.id !== id);
			const originalIndex = baseline.findIndex((entry) => entry.id === id);
			next.splice(Math.min(originalIndex, next.length), 0, original);
			return next;
		});
	};

	const submit = () => {
		const normalized = orderChanged
			? activeEntries.map((entry, index) => ({
					...entry,
					sortOrder: (index + 1) * 10,
				}))
			: activeEntries;
		const upsert = orderChanged
			? normalized
			: normalized.filter((entry) => !same(entry, baselineById.get(entry.id)));
		const invalid = upsert
			.map((entry) => entrySchema.safeParse(entry))
			.find((result) => !result.success);

		if (invalid && !invalid.success) {
			toast.error(
				invalid.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
			);
			return;
		}

		startTransition(async () => {
			try {
				await saveEntries({ upsert, remove: deletedIds });
				setBaseline(normalized);
				setEntries(normalized);
				setDeletedIds([]);
				toast.success(`${label} 변경사항을 저장했습니다.`);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "저장하지 못했습니다.",
				);
			}
		});
	};

	const moveEntry = (fromId: string, toId: string) => {
		setEntries((current) => {
			const active = current.filter(({ id }) => !deletedIds.includes(id));
			const from = active.findIndex(({ id }) => id === fromId);
			const to = active.findIndex(({ id }) => id === toId);
			const moved = arrayMove(active, from, to);
			let index = 0;
			return current.map((entry) =>
				deletedIds.includes(entry.id) ? entry : moved[index++],
			);
		});
	};
	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (over && active.id !== over.id)
			moveEntry(String(active.id), String(over.id));
	};

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-3xl font-semibold tracking-tight">{label} 관리</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					카드를 드래그해 순서를 바꾸고 변경사항을 한 번에 저장하세요.
				</p>
			</header>

			<Card className="sticky top-4 z-10">
				<CardHeader className="gap-1">
					<CardTitle className="flex items-center gap-2">
						변경사항
						<Badge variant={changedIds.size ? "default" : "secondary"}>
							{changedIds.size}개
						</Badge>
					</CardTitle>
					<CardDescription>
						저장하기 전까지 모든 수정과 삭제는 이 화면에만 유지됩니다.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<Button
						type="button"
						onClick={() =>
							setEntries((current) => [
								...current,
								{
									id: crypto.randomUUID(),
									kind,
									title: "",
									organization: "",
									startDate: "",
									endDate: "",
									description: "",
									url: "",
									sortOrder: (current.length + 1) * 10,
									visible: true,
									summaryHidden: false,
								},
							])
						}
						disabled={pending}
						variant="outline"
					>
						<Plus /> 새 {label}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={!changedIds.size || pending}
						onClick={() => {
							setEntries(baseline);
							setDeletedIds([]);
							toast.info("전체 변경사항을 되돌렸습니다.");
						}}
					>
						<RotateCcw /> 전체 되돌리기
					</Button>
					<Button
						type="button"
						disabled={!changedIds.size || pending}
						onClick={submit}
					>
						<Save /> {pending ? "저장 중" : "전체 저장"}
					</Button>
				</CardContent>
			</Card>

			<DndContext
				id={`${kind}-entries`}
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={entries.map(({ id }) => id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="grid grid-cols-1 gap-4">
						{entries.map((entry, index) => (
							<EntryItem
								key={entry.id}
								entry={entry}
								index={index}
								dirty={changedIds.has(entry.id)}
								deleted={deletedIds.includes(entry.id)}
								disabled={pending}
								entries={activeEntries}
								sorterOpen={sorterId === entry.id}
								onChange={(value) =>
									setEntries((current) =>
										current.map((item) =>
											item.id === value.id ? value : item,
										),
									)
								}
								onDelete={() => {
									if (!baselineById.has(entry.id)) {
										setEntries((current) =>
											current.filter(({ id }) => id !== entry.id),
										);
										return;
									}
									setDeletedIds((current) => [...current, entry.id]);
								}}
								onMove={moveEntry}
								onReset={() => resetEntry(entry.id)}
								onSorterOpenChange={(open) =>
									setSorterId(open ? entry.id : undefined)
								}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
};
