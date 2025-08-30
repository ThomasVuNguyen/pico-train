# Scripts Directory

This directory contains utility scripts for the Pico training framework.

## generate_data.py

A script to automatically generate `data.json` from training log files for the dashboard.

### What it does

This script parses log files from the `runs/` directory and extracts:
- **Training metrics**: Loss, learning rate, and inf/NaN counts at each step
- **Evaluation results**: Paloma evaluation metrics
- **Model configuration**: Architecture parameters (d_model, n_layers, etc.)

### Usage

```bash
# Generate data.json from the default runs directory
python scripts/generate_data.py

# Specify custom runs directory
python scripts/generate_data.py --runs-dir /path/to/runs

# Specify custom output file
python scripts/generate_data.py --output /path/to/output.json
```

### How it works

1. **Scans runs directory**: Looks for subdirectories containing training runs
2. **Finds log files**: Locates `.log` files in each run's `logs/` subdirectory
3. **Parses log content**: Uses regex patterns to extract structured data
4. **Generates JSON**: Creates a structured JSON file for the dashboard

### Log Format Requirements

The script expects log files with the following format:

```
2025-08-29 02:09:12 - pico-train - INFO - Step 500 -- 🔄 Training Metrics
2025-08-29 02:09:12 - pico-train - INFO - ├── Loss: 10.8854
2025-08-29 02:09:12 - pico-train - INFO - ├── Learning Rate: 3.13e-06
2025-08-29 02:09:12 - pico-train - INFO - └── Inf/NaN count: 0
```

And evaluation results:

```
2025-08-29 02:15:26 - pico-train - INFO - Step 1000 -- 📊 Evaluation Results
2025-08-29 02:15:26 - pico-train - INFO - └── paloma: 7.125172406420199e+27
```

### Output Format

The generated `data.json` has this structure:

```json
{
  "runs": [
    {
      "run_name": "model-name",
      "log_file": "log_filename.log",
      "training_metrics": [
        {
          "step": 0,
          "loss": 10.9914,
          "learning_rate": 0.0,
          "inf_nan_count": 0
        }
      ],
      "evaluation_results": [
        {
          "step": 1000,
          "paloma": 59434.76600609756
        }
      ],
      "config": {
        "d_model": 96,
        "n_layers": 12,
        "max_seq_len": 2048,
        "vocab_size": 50304,
        "lr": 0.0003,
        "max_steps": 200000,
        "batch_size": 8
      }
    }
  ],
  "summary": {
    "total_runs": 1,
    "run_names": ["model-name"]
  }
}
```

### When to use

- **After training**: Generate updated dashboard data
- **Adding new runs**: Include new training sessions in the dashboard
- **Debugging**: Verify log parsing is working correctly
- **Dashboard setup**: Initial setup of the training metrics dashboard

### Troubleshooting

If the script doesn't find any data:
1. Check that log files exist in `runs/*/logs/`
2. Verify log format matches the expected pattern
3. Ensure log files contain training metrics entries
4. Check file permissions and encoding
