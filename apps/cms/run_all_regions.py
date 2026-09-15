import subprocess
import sys
import time
from pathlib import Path


REGIONS = [
    "Alsace",
    "Bordeaux",
    "Bourgogne",
    "Champagne",
    "Corse",
    "Jura",
    "Languedoc-Roussillon",
    "Loire",
    "Provence",
    "Rhône",
    "Savoie",
    "Sud-Ouest",
    "Beaujolais",
]


def main() -> None:
    repo_root = Path(__file__).resolve().parent
    script_path = repo_root / "insert_region_subregions.py"

    for idx, region in enumerate(REGIONS):
        print(f"Processing: {region}", flush=True)
        try:
            completed = subprocess.run(
                [sys.executable, str(script_path), region],
                cwd=str(repo_root),
                check=True,
                text=True,
                capture_output=True,
            )
            stdout = (completed.stdout or "").strip()
            stderr = (completed.stderr or "").strip()
            if stdout:
                print(stdout, flush=True)
            if stderr:
                print(stderr, flush=True)
            if "Skipping:" not in stdout:
                print(f"Done: {region}", flush=True)
        except subprocess.CalledProcessError as exc:
            stdout = (exc.stdout or "").strip()
            stderr = (exc.stderr or "").strip()
            if stdout:
                print(stdout, flush=True)
            if stderr:
                print(stderr, flush=True)
            print(f"Skipping: {region} (error)", flush=True)

        if idx < len(REGIONS) - 1:
            time.sleep(2)


if __name__ == "__main__":
    main()
