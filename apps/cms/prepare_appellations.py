import json
import os
from pathlib import Path

from shapely.geometry import shape, mapping


INPUT_PATH_NAME = "appellations_raw.json"
OUTPUT_PATH_NAME = "appellations_clean.json"

# tolerance en degres (0.001 degres ~ 100m) : bon compromis qualité/poids pour Mapbox
SIMPLIFY_TOLERANCE = 0.001


def human_bytes(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(num_bytes)
    for unit in units:
        if size < 1024.0 or unit == units[-1]:
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{num_bytes} B"


def main() -> None:
    repo_root = Path(__file__).resolve().parent
    in_path = repo_root / INPUT_PATH_NAME
    out_path = repo_root / OUTPUT_PATH_NAME

    in_size = os.path.getsize(in_path)

    with in_path.open("r", encoding="utf-8") as f:
        appellations = json.load(f)

    clean_appellations = []
    for entry in appellations:
        geom = shape(entry["geojson"])
        simplified_geom = geom.simplify(
            tolerance=SIMPLIFY_TOLERANCE, preserve_topology=True
        )

        clean_appellations.append(
            {
                "name_fr": entry["name_fr"],
                "geojson": mapping(simplified_geom),
                "centroid_lat": entry["centroid_lat"],
                "centroid_lng": entry["centroid_lng"],
            }
        )

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(clean_appellations, f, ensure_ascii=False)

    out_size = os.path.getsize(out_path)

    print(f"Taille fichier original: {human_bytes(in_size)}")
    print(f"Taille fichier output: {human_bytes(out_size)}")
    print(f"✓ {len(clean_appellations)} appellations prêtes → {OUTPUT_PATH_NAME}")


if __name__ == "__main__":
    main()

