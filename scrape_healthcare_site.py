#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


DEFAULT_BASE_URL = "https://manoharshasappa.github.io/HealthCare_DataWebsite/"
USER_AGENT = "healthcare-site-scraper/1.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape the HealthCare_DataWebsite into a structured raw folder."
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base URL for the site index page.",
    )
    parser.add_argument(
        "--output-dir",
        default="raw",
        help="Directory where scraped files should be saved.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="HTTP timeout in seconds.",
    )
    return parser.parse_args()


def ensure_dirs(output_dir: Path) -> dict[str, Path]:
    dirs = {
        "root": output_dir,
        "patients": output_dir / "patients",
        "hl7": output_dir / "hl7",
    }
    for path in dirs.values():
        path.mkdir(parents=True, exist_ok=True)
    return dirs


def fetch_text(session: requests.Session, url: str, timeout: int) -> str:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return response.text


def extract_patient_rows(index_html: str, index_url: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(index_html, "html.parser")
    patients: list[dict[str, Any]] = []

    for row in soup.select("tr.record-row"):
        columns = row.select("td")
        if len(columns) < 4:
            continue

        onclick = row.get("onclick", "")
        match = re.search(r"window\.location\.href='([^']+)'", onclick)
        if not match:
            continue

        patient_url = urljoin(index_url, match.group(1))
        patient_id = Path(match.group(1)).stem

        patients.append(
            {
                "patient_id": patient_id,
                "name": columns[0].get_text(strip=True),
                "username": columns[1].get_text(strip=True),
                "password": columns[2].get_text(strip=True),
                "visits_text": columns[3].get_text(strip=True),
                "patient_url": patient_url,
            }
        )

    return patients


def extract_patient_detail(patient_html: str, patient_url: str) -> dict[str, Any]:
    soup = BeautifulSoup(patient_html, "html.parser")
    hl7_pre = soup.select_one("pre#hl7-output")
    if hl7_pre is None:
        raise ValueError(f"Could not locate HL7 source in {patient_url}")

    subtitle = soup.select_one(".detail-header .subtitle")
    hl7_relative_path = hl7_pre.get("data-source")
    if not hl7_relative_path:
        raise ValueError(f"Missing HL7 data-source in {patient_url}")

    return {
        "title": soup.title.get_text(strip=True) if soup.title else None,
        "subtitle": subtitle.get_text(" ", strip=True) if subtitle else None,
        "hl7_url": urljoin(patient_url, hl7_relative_path),
        "hl7_path": hl7_relative_path,
    }


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def scrape_site(base_url: str, output_dir: Path, timeout: int) -> dict[str, Any]:
    dirs = ensure_dirs(output_dir)

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    index_html = fetch_text(session, base_url, timeout)
    write_text(dirs["root"] / "index.html", index_html)

    patients = extract_patient_rows(index_html, base_url)
    results: list[dict[str, Any]] = []

    for patient in patients:
        patient_id = patient["patient_id"]
        patient_html = fetch_text(session, patient["patient_url"], timeout)
        write_text(dirs["patients"] / f"{patient_id}.html", patient_html)

        details = extract_patient_detail(patient_html, patient["patient_url"])
        hl7_text = fetch_text(session, details["hl7_url"], timeout)
        write_text(dirs["hl7"] / f"{patient_id}.hl7", hl7_text)

        results.append(
            {
                **patient,
                **details,
                "hl7_file": str(Path("hl7") / f"{patient_id}.hl7"),
                "patient_file": str(Path("patients") / f"{patient_id}.html"),
            }
        )

    metadata = {
        "base_url": base_url,
        "patient_count": len(results),
        "patients": results,
    }
    write_text(dirs["root"] / "patients.json", json.dumps(metadata, indent=2))
    return metadata


def main() -> int:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve()
    metadata = scrape_site(args.base_url, output_dir, args.timeout)
    print(
        json.dumps(
            {
                "output_dir": str(output_dir),
                "patient_count": metadata["patient_count"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
