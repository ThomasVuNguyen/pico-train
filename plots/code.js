// Global variables
let trainingData = null;
let charts = {};

// Color palette for different runs
const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa7093', '#fee140', '#a8edea', '#fed6e3'
];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Load training data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        trainingData = await response.json();
        
        // Merge continuation logs from the same model run
        mergeContinuationLogs();
        
        populateRunSelector();
        createCharts();
        updateRunSummary();
        updateConfigDetails();
        
        console.log('Data loaded and merged successfully:', trainingData);
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = '<div class="loading">Error loading training data. Please check the console for details.</div>';
    }
}

// Merge continuation logs from the same model run
function mergeContinuationLogs() {
    const runGroups = {};
    
    // Group runs by base model name
    trainingData.runs.forEach(run => {
        const baseName = run.run_name;
        if (!runGroups[baseName]) {
            runGroups[baseName] = [];
        }
        runGroups[baseName].push(run);
    });
    
    // Merge runs with the same base name
    const mergedRuns = [];
    
    Object.entries(runGroups).forEach(([baseName, runs]) => {
        if (runs.length === 1) {
            // Single run, no merging needed
            mergedRuns.push(runs[0]);
        } else {
            // Multiple runs to merge
            console.log(`Merging ${runs.length} continuation logs for ${baseName}`);
            
            const mergedRun = {
                run_name: baseName,
                log_files: runs.map(r => r.log_file),
                training_metrics: [],
                evaluation_results: [],
                config: runs[0].config || {}
            };
            
            // Merge training metrics (they should be continuous)
            runs.forEach(run => {
                if (run.training_metrics) {
                    mergedRun.training_metrics.push(...run.training_metrics);
                }
            });
            
            // Merge evaluation results (they should be continuous)
            runs.forEach(run => {
                if (run.evaluation_results) {
                    mergedRun.evaluation_results.push(...run.evaluation_results);
                }
            });
            
            // Sort by step number to ensure proper ordering
            mergedRun.training_metrics.sort((a, b) => a.step - b.step);
            mergedRun.evaluation_results.sort((a, b) => a.step - b.step);
            
            // Remove duplicates based on step number
            mergedRun.training_metrics = mergedRun.training_metrics.filter((metric, index, self) => 
                index === 0 || metric.step !== self[index - 1].step
            );
            mergedRun.evaluation_results = mergedRun.evaluation_results.filter((result, index, self) => 
                index === 0 || result.step !== self[index - 1].step
            );
            
            console.log(`Merged ${baseName}: ${mergedRun.training_metrics.length} training points, ${mergedRun.evaluation_results.length} eval points`);
            mergedRuns.push(mergedRun);
        }
    });
    
    trainingData.runs = mergedRuns;
}

// Setup event listeners for controls
function setupEventListeners() {
    document.getElementById('runSelect').addEventListener('change', function() {
        updateCharts();
        updateRunSummary();
        updateConfigDetails();
    });
    document.getElementById('showTraining').addEventListener('change', updateCharts);
    document.getElementById('showLearningRate').addEventListener('change', updateCharts);
    document.getElementById('showEvaluation').addEventListener('change', updateCharts);
}

// Populate run selector dropdown
function populateRunSelector() {
    const select = document.getElementById('runSelect');
    const runs = trainingData.runs;
    
    // Clear existing options
    select.innerHTML = '<option value="all">All Runs</option>';
    
    runs.forEach((run, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = run.run_name;
        select.appendChild(option);
    });
}

// Create all charts
function createCharts() {
    createLossChart();
    createLRChart();
    createEvalChart();
    createCombinedChart();
}

// Create training loss chart
function createLossChart() {
    const ctx = document.getElementById('lossChart').getContext('2d');
    
    charts.loss = new Chart(ctx, {
        type: 'line',
        data: getChartData('loss'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Training Loss Over Time'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Training Step'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Loss'
                    },
                    beginAtZero: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Create learning rate chart
function createLRChart() {
    const ctx = document.getElementById('lrChart').getContext('2d');
    
    charts.lr = new Chart(ctx, {
        type: 'line',
        data: getChartData('lr'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Learning Rate Schedule'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Training Step'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Learning Rate'
                    },
                    type: 'logarithmic'
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Create evaluation chart
function createEvalChart() {
    const ctx = document.getElementById('evalChart').getContext('2d');
    
    charts.eval = new Chart(ctx, {
        type: 'line',
        data: getChartData('eval'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Paloma Evaluation Metrics'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Training Step'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Perplexity'
                    },
                    type: 'logarithmic'
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Create combined chart
function createCombinedChart() {
    const ctx = document.getElementById('combinedChart').getContext('2d');
    
    charts.combined = new Chart(ctx, {
        type: 'line',
        data: getCombinedChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Combined Training Metrics'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Training Step'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Get chart data for specific metric type
function getChartData(metricType) {
    const selectedRun = document.getElementById('runSelect').value;
    const runs = selectedRun === 'all' ? trainingData.runs : [trainingData.runs[selectedRun]];
    
    const datasets = [];
    
    console.log(`Getting ${metricType} data for ${runs.length} runs:`, runs.map(r => r.run_name));
    
    runs.forEach((run, runIndex) => {
        const color = colors[runIndex % colors.length];
        
        if (metricType === 'loss') {
            if (run.training_metrics && run.training_metrics.length > 0) {
                const data = run.training_metrics.map(m => ({ x: m.step, y: m.loss }));
                console.log(`Loss data for ${run.run_name}:`, data.slice(0, 5), '...', data.slice(-5));
                datasets.push({
                    label: run.run_name,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
        } else if (metricType === 'lr') {
            if (run.training_metrics && run.training_metrics.length > 0) {
                const data = run.training_metrics.map(m => ({ x: m.step, y: m.learning_rate }));
                console.log(`LR data for ${run.run_name}:`, data.slice(0, 5), '...', data.slice(-5));
                datasets.push({
                    label: run.run_name,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
        } else if (metricType === 'eval') {
            if (run.evaluation_results && run.evaluation_results.length > 0) {
                const data = run.evaluation_results.map(m => ({ x: m.step, y: m.paloma }));
                console.log(`Eval data for ${run.run_name}:`, data.slice(0, 5), '...', data.slice(-5));
                datasets.push({
                    label: run.run_name,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
        }
    });
    
    console.log(`Final ${metricType} datasets:`, datasets);
    return { datasets };
}

// Get combined chart data
function getCombinedChartData() {
    const selectedRun = document.getElementById('runSelect').value;
    const runs = selectedRun === 'all' ? trainingData.runs : [trainingData.runs[selectedRun]];
    
    const datasets = [];
    
    runs.forEach((run, runIndex) => {
        const color = colors[runIndex % colors.length];
        
        // Training loss
        if (run.training_metrics && run.training_metrics.length > 0) {
            datasets.push({
                label: `${run.run_name} - Loss`,
                data: run.training_metrics.map(m => ({ x: m.step, y: m.loss })),
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
        }
        
        // Learning rate (scaled)
        if (run.training_metrics && run.training_metrics.length > 0) {
            const maxLR = Math.max(...run.training_metrics.map(m => m.learning_rate));
            const maxLoss = Math.max(...run.training_metrics.map(m => m.loss));
            const scaleFactor = maxLoss / maxLR;
            
            datasets.push({
                label: `${run.run_name} - LR (scaled)`,
                data: run.training_metrics.map(m => ({ x: m.step, y: m.learning_rate * scaleFactor })),
                borderColor: color + '80',
                backgroundColor: color + '10',
                borderWidth: 1,
                fill: false,
                tension: 0.1
            });
        }
    });
    
    return { datasets };
}

// Update all charts based on current selection
function updateCharts() {
    if (charts.loss) {
        charts.loss.data = getChartData('loss');
        charts.loss.update();
    }
    
    if (charts.lr) {
        charts.lr.data = getChartData('lr');
        charts.lr.update();
    }
    
    if (charts.eval) {
        charts.eval.data = getChartData('eval');
        charts.eval.update();
    }
    
    if (charts.combined) {
        charts.combined.data = getCombinedChartData();
        charts.combined.update();
    }
}

// Update run summary section
function updateRunSummary() {
    const container = document.getElementById('runSummary');
    const selectedRun = document.getElementById('runSelect').value;
    const runs = selectedRun === 'all' ? trainingData.runs : [trainingData.runs[selectedRun]];
    
    let html = '<div class="run-grid">';
    
    runs.forEach(run => {
        const trainingPoints = run.training_metrics ? run.training_metrics.length : 0;
        const evalPoints = run.evaluation_results ? run.evaluation_results.length : 0;
        
        let finalLoss = 'N/A';
        let finalLR = 'N/A';
        let finalPaloma = 'N/A';
        let stepRange = 'N/A';
        
        if (run.training_metrics && run.training_metrics.length > 0) {
            const first = run.training_metrics[0];
            const last = run.training_metrics[run.training_metrics.length - 1];
            finalLoss = last.loss.toFixed(4);
            finalLR = last.learning_rate.toExponential(2);
            stepRange = `${first.step} → ${last.step}`;
        }
        
        if (run.evaluation_results && run.evaluation_results.length > 0) {
            const last = run.evaluation_results[run.evaluation_results.length - 1];
            if (isFinite(last.paloma)) {
                finalPaloma = last.paloma.toExponential(2);
            } else {
                finalPaloma = '∞';
            }
        }
        
        const logFiles = run.log_files ? run.log_files.join(', ') : run.log_file;
        
        html += `
            <div class="run-card">
                <h4>${run.run_name}</h4>
                <p><strong>Logs:</strong> ${logFiles}</p>
                <div class="metric">
                    <span>Step Range:</span>
                    <span class="value">${stepRange}</span>
                </div>
                <div class="metric">
                    <span>Training Points:</span>
                    <span class="value">${trainingPoints}</span>
                </div>
                <div class="metric">
                    <span>Evaluation Points:</span>
                    <span class="value">${evalPoints}</span>
                </div>
                <div class="metric">
                    <span>Final Loss:</span>
                    <span class="value">${finalLoss}</span>
                </div>
                <div class="metric">
                    <span>Final LR:</span>
                    <span class="value">${finalLR}</span>
                </div>
                <div class="metric">
                    <span>Final Paloma:</span>
                    <span class="value">${finalPaloma}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Update configuration details section
function updateConfigDetails() {
    const container = document.getElementById('configDetails');
    const selectedRun = document.getElementById('runSelect').value;
    const runs = selectedRun === 'all' ? trainingData.runs : [trainingData.runs[selectedRun]];
    
    let html = '<div class="config-grid">';
    
    // Get unique config keys
    const allKeys = new Set();
    runs.forEach(run => {
        if (run.config) {
            Object.keys(run.config).forEach(key => allKeys.add(key));
        }
    });
    
    allKeys.forEach(key => {
        const values = runs.map(run => run.config && run.config[key] !== undefined ? run.config[key] : 'N/A');
        const uniqueValues = [...new Set(values)];
        const displayValue = uniqueValues.length === 1 ? uniqueValues[0] : `${uniqueValues.join(' / ')}`;
        
        html += `
            <div class="config-item">
                <div class="label">${key.replace(/_/g, ' ').toUpperCase()}</div>
                <div class="value">${displayValue}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Utility function to format large numbers
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}
