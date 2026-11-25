"""MCP tools for a fixed, entity-free AFSIM clock experiment."""

import argparse
import hashlib
import json
import math
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Literal
from uuid import uuid4

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel


ROOT = Path(__file__).resolve().parent
INPUT_SHA256 = "e1c89022444aaad72b1473d15284223b6ce7f4ed32aaa9540f259105baf41d4f"
server = FastMCP("AFSIM clock laboratory", host="127.0.0.1")


class ClockMarker(BaseModel):
    event_id: str
    logical_time_s: float


class ClockReading(BaseModel):
    source: Literal["reference", "measured"]
    run_id: str
    time_unit: Literal["s"] = "s"
    events: list[ClockMarker]


@server.tool()
def read_clock_reference(run_id: Literal["repeat-01", "repeat-02"]) -> ClockReading:
    """Read the measured marker times from one published reference run."""
    record = json.loads((ROOT / "afsim-clock-check.json").read_text(encoding="utf-8"))
    run = next(row for row in record["runs"] if row["run_id"] == run_id)
    return ClockReading(source="reference", run_id=run_id, events=run["events"])


@server.tool()
def measure_clock_markers() -> ClockReading:
    """Run the built-in two-marker clock fixture once and return its observed times."""
    executable = os.environ.get("AFSIM_MISSION")
    if not executable or not Path(executable).is_absolute() or not Path(executable).is_file():
        raise ValueError("Set AFSIM_MISSION to the absolute path of the installed mission executable.")
    fixture = (ROOT / "afsim-clock-input.txt").read_bytes().replace(b"\r\n", b"\n")
    if hashlib.sha256(fixture).hexdigest() != INPUT_SHA256:
        raise ValueError("Clock fixture differs from the published two-marker input.")
    with tempfile.TemporaryDirectory(prefix="rsi-clock-") as work:
        (Path(work) / "clock.txt").write_bytes(fixture)
        result = subprocess.run(
            [executable, "clock.txt"], cwd=work, capture_output=True,
            text=True, errors="replace", timeout=30, check=False,
        )
    if result.returncode:
        raise RuntimeError(f"Clock experiment exited with code {result.returncode}.")
    events = []
    for line in result.stdout.splitlines():
        if line.startswith("ATLAS_CLOCK,"):
            _, name, time_text = line.split(",")
            seconds = float(time_text)
            if not math.isfinite(seconds):
                raise ValueError("Received a non-finite logical time.")
            events.append(ClockMarker(event_id=name, logical_time_s=seconds))
    if not events:
        raise ValueError("The clock fixture emitted no markers.")
    return ClockReading(source="measured", run_id=str(uuid4()), events=events)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transport", choices=("stdio", "streamable-http"), default="stdio")
    server.run(transport=parser.parse_args().transport)
