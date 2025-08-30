# 🚀 Pico Training Metrics Dashboard

A beautiful, interactive web dashboard for visualizing training progress across all your Pico model runs.

## ✨ Features

- **📈 Training Loss Visualization**: Track loss curves over time for all runs
- **🎯 Learning Rate Schedules**: Monitor LR progression and warmup patterns
- **📊 Paloma Evaluation**: View perplexity metrics during training
- **🔄 Combined View**: See all metrics together for easy comparison
- **🎨 Interactive Charts**: Built with Chart.js for smooth interactions
- **📱 Responsive Design**: Works on desktop and mobile devices
- **⚙️ Run Comparison**: Compare different model configurations side-by-side

## �� Quick Start

1. **Generate Data**: First, run the data generation script to parse your training logs:
   ```bash
   python scripts/generate_data.py
   ```
   
2. **View the Dashboard**: Open `index.html` in your web browser
3. **Select Runs**: Use the dropdown to view specific runs or all runs together
4. **Toggle Metrics**: Check/uncheck boxes to show/hide different metric types
5. **Explore Charts**: Hover over data points for detailed information

## 📁 Files

- `index.html` - Main dashboard interface
- `style.css` - Modern, responsive styling
- `code.js` - Interactive chart functionality
- `data.json` - Training metrics data (auto-generated from logs)

## 🔧 Data Source

The dashboard automatically extracts training metrics from:
- Training loss at each step
- Learning rate progression
- Paloma evaluation results
- Model configuration parameters

## 🔄 Updating Data

To refresh the dashboard with new training data:
1. **Run new training sessions** - logs will be saved to `runs/*/logs/`
2. **Generate updated data.json**:
   ```bash
   python scripts/generate_data.py
   ```
3. **Refresh the dashboard** - new runs will appear automatically

## 🎨 Chart Types

1. **Training Loss**: Line charts showing loss reduction over time
2. **Learning Rate**: Logarithmic scale for LR schedule visualization
3. **Evaluation**: Paloma perplexity metrics during training
4. **Combined**: All metrics on one chart for easy comparison

## 💡 Usage Tips

- **Compare Runs**: Select "All Runs" to see how different configurations perform
- **Zoom In**: Use the chart zoom features to focus on specific training phases
- **Export**: Right-click charts to save as images
- **Mobile**: Dashboard is fully responsive for mobile devices

## 🎯 Key Metrics Tracked

- **Training Loss**: Primary performance indicator
- **Learning Rate**: Schedule adherence and warmup progress
- **Paloma Perplexity**: Model evaluation quality
- **Inf/NaN Counts**: Training stability monitoring
- **Model Config**: Architecture and hyperparameter details

## 🌟 Design Features

- **Modern UI**: Clean, professional interface
- **Color Coding**: Distinct colors for each model run
- **Responsive Layout**: Adapts to different screen sizes
- **Interactive Elements**: Hover effects and smooth animations
- **Professional Typography**: Easy-to-read fonts and spacing

## 📚 Documentation

For more details on generating the data.json file, see:
- `scripts/README.md` - Complete script documentation
- `scripts/generate_data.py` - The data generation script

---

Built with ❤️ for the Pico Language Model training community
