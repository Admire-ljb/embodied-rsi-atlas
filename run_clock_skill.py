"""Run the clock observation skill over MCP and write one trace per execution."""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from uuid import uuid4

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from clock_mcp import ClockReading


ROOT = Path(__file__).resolve().parent
BASELINE = "read_clock_reference"
MEASURE = "measure_clock_markers"


async def observe(session, calls, tool, arguments, expected_source):
    entry = {"step": len(calls) + 1, "tool": tool, "arguments": arguments}
    calls.append(entry)
    result = await session.call_tool(tool, arguments=arguments)
    if result.isError:
        details = [item.text for item in result.content if item.type == "text"]
        raise ValueError(" ".join(details) or f"{tool} returned an error")
    reading = ClockReading.model_validate(result.structuredContent)
    entry["receipt"] = reading.model_dump()
    if reading.source != expected_source or not reading.events or not reading.run_id:
        raise ValueError(f"{tool} returned an incomplete receipt or invalid source")
    return reading


def verdict(reference, measured):
    if reference.run_id == measured.run_id:
        raise ValueError("A new measurement must have its own run ID")
    same_order = [m.event_id for m in reference.events] == [m.event_id for m in measured.events]
    same_times = [m.logical_time_s for m in reference.events] == [m.logical_time_s for m in measured.events]
    checks = {"same_event_ids_in_order": same_order, "same_logical_seconds_in_order": same_times}
    return {"status": "matched" if all(checks.values()) else "different", "checks": checks}


async def execute(trace, baseline):
    environment = {k: os.environ[k] for k in ("AFSIM_MISSION",) if k in os.environ}
    params = StdioServerParameters(command=sys.executable, args=[str(ROOT / "clock_mcp.py")], env=environment)
    async with stdio_client(params) as streams, ClientSession(*streams) as session:
        hello = await session.initialize()
        trace["protocol"] = hello.protocolVersion
        tools = {tool.name for tool in (await session.list_tools()).tools}
        if not {BASELINE, MEASURE}.issubset(tools):
            raise ValueError("The clock server must advertise both observation tools")
        ref = await observe(session, trace["calls"], BASELINE, {"run_id": baseline}, "reference")
        if ref.run_id != baseline:
            raise ValueError("Received a different baseline from the one requested")
        sample = await observe(session, trace["calls"], MEASURE, {}, "measured")
        trace.update(verdict(ref, sample))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", choices=("repeat-01", "repeat-02"), default="repeat-01")
    parser.add_argument("--out-dir", type=Path, default=Path("runs"))
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    trace = {"execution_id": str(uuid4()), "skill": "compare-clock-markers@1.0",
             "runtime": "local-deterministic", "transport": "stdio", "calls": []}
    try:
        asyncio.run(execute(trace, args.reference))
    except Exception as error:
        # AnyIO may wrap a validation/tool error when it leaves the stdio context.
        while isinstance(error, BaseExceptionGroup) and len(error.exceptions) == 1:
            error = error.exceptions[0]
        trace.update(status="incomplete", error=str(error))
    output = args.out_dir / (trace["execution_id"] + ".json")
    with output.open("x", encoding="utf-8") as stream:
        json.dump(trace, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write("\n")
    print(f"{trace['status']}  {output}")
    return {"matched": 0, "different": 1, "incomplete": 2}[trace["status"]]


if __name__ == "__main__":
    sys.exit(main())
