import type { Entry, EntryKind } from "@suk/contracts";
import { entryLabels } from "./config";
import { EntriesEditor } from "./editor";

export const EntriesSection = ({
	kind,
	entries,
}: {
	kind: EntryKind;
	entries: Entry[];
}) => (
	<EntriesEditor
		key={kind}
		kind={kind}
		label={entryLabels[kind]}
		initialEntries={entries}
	/>
);
