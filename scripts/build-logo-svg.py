"""Build logo.svg (icon + wordmark) from public/logo-icon.svg."""
from __future__ import annotations

import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
ICON = os.path.join(ROOT, "apps", "web", "public", "logo-icon.svg")
OUT = os.path.join(ROOT, "apps", "web", "public", "logo.svg")

BLUE = "#0080F4"
GRAY = "#9AA6B2"


def extract_icon_inner(svg: str) -> str:
    """Return transform group + paths from logo-icon."""
    match = re.search(
        r"<g transform=\"translate\(0\.000000,1760\.000000\) scale\(0\.100000,-0\.100000\)\">([\s\S]*)</g>\s*</svg>",
        svg,
    )
    if not match:
        raise SystemExit("Could not parse logo-icon.svg structure")
    return match.group(1).strip()


def main() -> None:
    with open(ICON, encoding="utf-8") as f:
        icon_svg = f.read()

    icon_inner = extract_icon_inner(icon_svg)

    logo = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 70" fill="none" role="img" aria-label="LendTrack">
  <title>LendTrack</title>
  <svg x="0" y="0" width="70" height="70" viewBox="0 0 2168 1760" preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,1760.000000) scale(0.100000,-0.100000)">
{icon_inner}
    </g>
  </svg>
  <text
    x="78"
    y="46"
    fill="{BLUE}"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    font-size="28"
    font-weight="600"
    letter-spacing="-0.02em"
  >Lend</text>
  <text
    x="150"
    y="46"
    fill="{GRAY}"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    font-size="28"
    font-weight="600"
    letter-spacing="-0.02em"
  >Track</text>
</svg>
"""

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(logo)

    print(f"Wrote {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
