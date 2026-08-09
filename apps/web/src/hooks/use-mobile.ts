import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onStoreChange: () => void) => {
	const media = window.matchMedia(MOBILE_QUERY);
	media.addEventListener("change", onStoreChange);
	return () => media.removeEventListener("change", onStoreChange);
};

export function useIsMobile() {
	return React.useSyncExternalStore(
		subscribe,
		() => window.matchMedia(MOBILE_QUERY).matches,
		() => false,
	);
}
