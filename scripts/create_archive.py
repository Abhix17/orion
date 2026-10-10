"""Create clean distribution ZIP archive of ORION v2.

Excludes large dependencies and caches (node_modules, .pytest_cache, __pycache__, .git).
"""

import os
import zipfile
from pathlib import Path

def make_archive():
    project_root = Path(__file__).resolve().parent.parent
    output_zip = project_root.parent / "Orion_v2_Distribution.zip"

    print(f"Creating archive from: {project_root}")
    print(f"Destination archive:  {output_zip}")

    exclude_dirs = {
        "node_modules",
        ".pytest_cache",
        "__pycache__",
        ".git",
        ".venv",
        "dist",
    }

    exclude_exts = {
        ".pyc",
        ".pyo",
    }

    file_count = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_root):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if any(file.endswith(ext) for ext in exclude_exts):
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(project_root)

                # Skip output zip if inside project root
                if full_path == output_zip:
                    continue

                zipf.write(full_path, arcname=str(rel_path))
                file_count += 1
                total_uncompressed_bytes += full_path.stat().st_size

    archive_size_mb = output_zip.stat().st_size / (1024 * 1024)
    print(f"\nArchive created successfully!")
    print(f"Total Files Archived:  {file_count}")
    print(f"Uncompressed Size:    {total_uncompressed_bytes / (1024*1024):.2f} MB")
    print(f"Compressed Archive:    {archive_size_mb:.2f} MB")
    print(f"Archive Location:      {output_zip}")

if __name__ == "__main__":
    make_archive()
