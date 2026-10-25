"""Validate delivered review artifacts once; never block workflow routing."""
import argparse
from datetime import datetime
import json
from pathlib import Path


def check(directory):
    errors = []
    for name in ("REVIEW.md", "REFERENCES.md"):
        try:
            if not (directory / name).read_text(encoding="utf-8").strip():
                errors.append(f"{directory / name}: empty report")
        except (OSError, UnicodeError) as error:
            errors.append(f"{directory / name}: {error}")
    try:
        marker = json.loads((directory / "done.json").read_text(encoding="utf-8"))
        stamp = marker["completed_at"]
        parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        if parsed.utcoffset() is None or parsed.utcoffset().total_seconds() != 0:
            raise ValueError("completed_at must include a UTC offset")
    except (OSError, UnicodeError, ValueError, KeyError, TypeError, AttributeError) as error:
        errors.append(f"{directory / 'done.json'}: {error}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directories", nargs="+", type=Path)
    args = parser.parse_args()
    errors = [error for directory in args.directories for error in check(directory)]
    print(json.dumps({"ready": not errors, "reviews": len(args.directories), "errors": errors}, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
