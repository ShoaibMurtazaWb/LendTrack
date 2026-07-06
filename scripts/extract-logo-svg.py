import json
import os
import re

TRANSCRIPT = r"C:\Users\Shoaib Murtaza\.cursor\projects\d-Web-Developement-NEXTjs-lendtrack\agent-transcripts\a62ed29f-1d1b-47b5-b672-8d09b675d0dd\a62ed29f-1d1b-47b5-b672-8d09b675d0dd.jsonl"
OUT = os.path.join(
    os.path.dirname(__file__), "..", "apps", "web", "public", "logo-icon.svg"
)


def main() -> None:
    transcript = os.path.normpath(TRANSCRIPT)
    out_path = os.path.normpath(OUT)

    with open(transcript, encoding="utf-8") as f:
        for line in f:
            if "M10751 16479" not in line:
                continue
            obj = json.loads(line)
            text = obj["message"]["content"][0]["text"]
            match = re.search(r"(<svg[\s\S]*?</svg>)", text)
            if not match:
                raise SystemExit("SVG not found in message")
            svg = match.group(1)
            svg = re.sub(r'\s+width="68"\s+height="68"', "", svg)
            if 'aria-label=' not in svg:
                svg = svg.replace(
                    "<svg ",
                    '<svg role="img" aria-label="LendTrack" ',
                    1,
                )
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as out:
                out.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                out.write(svg)
                if not svg.endswith("\n"):
                    out.write("\n")
            print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")
            return

    raise SystemExit("Transcript line with logo SVG not found")


if __name__ == "__main__":
    main()
