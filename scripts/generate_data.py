#!/usr/bin/env python3
"""
Script to generate data.json from training log files.

This script parses log files from the runs directory and extracts:
- Training metrics (loss, learning rate, inf/nan count)
- Evaluation results (paloma metrics)
- Model configuration parameters

The output is saved to plots/data.json for the dashboard.
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional


def parse_training_metrics(log_content: str) -> List[Dict[str, Any]]:
    """Parse training metrics from log content."""
    metrics = []

    # Pattern to match training metrics entries with timestamp and log level
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - Step (\d+) -- 🔄 Training Metrics\n\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - ├── Loss: ([\d.]+)\n\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - ├── Learning Rate: ([\d.e+-]+)\n\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - └── Inf/NaN count: (\d+)"

    matches = re.findall(pattern, log_content)

    for step, loss, lr, inf_nan in matches:
        metrics.append(
            {
                "step": int(step),
                "loss": float(loss),
                "learning_rate": float(lr),
                "inf_nan_count": int(inf_nan),
            }
        )

    return sorted(metrics, key=lambda x: x["step"])


def parse_evaluation_results(log_content: str) -> List[Dict[str, Any]]:
    """Parse evaluation results from log content."""
    results = []

    # Pattern to match evaluation results with timestamp and log level
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - Step (\d+) -- 📊 Evaluation Results\n\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - pico-train - INFO - └── paloma: ([\d.e+-]+)"

    matches = re.findall(pattern, log_content)

    for step, paloma in matches:
        try:
            paloma_value = float(paloma)
            results.append({"step": int(step), "paloma": paloma_value})
        except ValueError:
            # Skip if paloma value is not a valid number (e.g., "inf")
            continue

    return sorted(results, key=lambda x: x["step"])


def extract_config_from_log(log_content: str) -> Dict[str, Any]:
    """Extract model configuration from log content."""
    config = {}

    # Extract key model parameters
    patterns = {
        "d_model": r"d_model: (\d+)",
        "n_layers": r"n_layers: (\d+)",
        "max_seq_len": r"max_seq_len: (\d+)",
        "vocab_size": r"vocab_size: (\d+)",
        "lr": r"lr: ([\d.e+-]+)",
        "max_steps": r"max_steps: (\d+)",
        "batch_size": r"batch_size: (\d+)",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, log_content)
        if match:
            try:
                if key in [
                    "d_model",
                    "n_layers",
                    "max_seq_len",
                    "vocab_size",
                    "max_steps",
                    "batch_size",
                ]:
                    config[key] = int(match.group(1))
                else:
                    config[key] = float(match.group(1))
            except ValueError:
                continue

    return config


def process_run_directory(run_path: Path) -> Optional[Dict[str, Any]]:
    """Process a single run directory and extract all data."""
    run_name = run_path.name

    # Find log files
    logs_dir = run_path / "logs"
    if not logs_dir.exists():
        return None

    log_files = list(logs_dir.glob("*.log"))
    if not log_files:
        return None

    # Use the most recent log file for configuration
    latest_log = max(log_files, key=lambda x: x.stat().st_mtime)

    # Read log content
    log_content = latest_log.read_text(encoding="utf-8")

    # Extract data
    training_metrics = parse_training_metrics(log_content)
    evaluation_results = parse_evaluation_results(log_content)
    config = extract_config_from_log(log_content)

    # If no training metrics found, skip this run
    if not training_metrics:
        return None

    return {
        "run_name": run_name,
        "log_file": latest_log.name,
        "training_metrics": training_metrics,
        "evaluation_results": evaluation_results,
        "config": config,
    }


def generate_data_json(runs_dir: str = "runs", output_file: str = "plots/data.json"):
    """Generate data.json from all run directories."""
    runs_path = Path(runs_dir)
    if not runs_path.exists():
        print(f"Runs directory {runs_dir} not found!")
        return

    runs_data = []

    # Process each run directory
    for run_dir in runs_path.iterdir():
        if run_dir.is_dir():
            print(f"Processing run: {run_dir.name}")
            run_data = process_run_directory(run_dir)
            if run_data:
                runs_data.append(run_data)
                print(f"  ✓ Found {len(run_data['training_metrics'])} training metrics")
                print(
                    f"  ✓ Found {len(run_data['evaluation_results'])} evaluation results"
                )
            else:
                print("  ✗ No valid data found")

    if not runs_data:
        print("No valid runs found!")
        return

    # Create output data structure
    output_data = {
        "runs": runs_data,
        "summary": {
            "total_runs": len(runs_data),
            "run_names": [run["run_name"] for run in runs_data],
        },
    }

    # Ensure output directory exists
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write to file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Generated {output_file} with {len(runs_data)} runs")
    print(
        f"✓ Total training metrics: {sum(len(run['training_metrics']) for run in runs_data)}"
    )
    print(
        f"✓ Total evaluation results: {sum(len(run['evaluation_results']) for run in runs_data)}"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate data.json from training logs"
    )
    parser.add_argument("--runs-dir", default="runs", help="Path to runs directory")
    parser.add_argument("--output", default="plots/data.json", help="Output file path")

    args = parser.parse_args()

    generate_data_json(args.runs_dir, args.output)
