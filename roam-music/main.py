"""Roam Music Analysis Service entrypoint."""

import sys
from dotenv import load_dotenv


def main() -> int:
    load_dotenv()
    print("Roam Music Analysis Service — ready")
    return 0


if __name__ == "__main__":
    sys.exit(main())
