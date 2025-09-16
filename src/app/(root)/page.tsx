import { PF_SITE } from "@/lib/constants";

export default function Index() {
    return (
        <iframe
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
                margin: 0,
                padding: 0,
                overflow: "hidden",
                zIndex: 999999,
            }}
            src={PF_SITE}
        />
    );
}
