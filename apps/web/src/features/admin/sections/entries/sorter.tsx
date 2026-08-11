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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Entry } from "@suk/contracts";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entryLabels } from "./config";

const SorterItem = ({ entry }: { entry: Entry }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: entry.id });

	return (
		<Button
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			type="button"
			variant="ghost"
			className={`h-auto min-w-0 w-full justify-start px-2 py-2 text-left ${isDragging ? "z-10 bg-muted shadow-sm" : ""}`}
			{...attributes}
			{...listeners}
		>
			<GripVertical className="text-muted-foreground" />
			<span className="min-w-0 flex-1 truncate">
				{entry.title.trim() || `새 ${entryLabels[entry.kind]}`}
			</span>
		</Button>
	);
};

export const EntrySorter = ({
	entries,
	onMove,
}: {
	entries: Entry[];
	onMove: (from: string, to: string) => void;
}) => {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (over && active.id !== over.id)
			onMove(String(active.id), String(over.id));
	};

	return (
		<DndContext
			id="entry-mini-sorter"
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={entries.map(({ id }) => id)}
				strategy={verticalListSortingStrategy}
			>
				<div className="grid max-h-80 gap-1 overflow-y-auto">
					{entries.map((entry) => (
						<SorterItem key={entry.id} entry={entry} />
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
};
