// stats.js - Statistics dashboard script

document.addEventListener("DOMContentLoaded", () => {
    renderStatsDashboard();
});

let myChart = null;

function renderStatsDashboard() {
    let history = JSON.parse(localStorage.getItem("healthDocHistory")) || [];
    const statsContainer = document.getElementById("statsDashboard");

    if (!statsContainer) return;

    if (history.length === 0) {
        statsContainer.innerHTML = `
            <div class="empty-state">
                <p>No assessment history found. Complete your first prevention plan on the main page to start tracking statistics.</p>
                <a href="index.html" class="back-home-btn" style="margin-top: 15px;">Go to Assessment</a>
            </div>
        `;
        return;
    }

    // Sort history chronologically (oldest to newest)
    history.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/');
        const [dayB, monthB, yearB] = b.date.split('/');
        return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
    });

    const totalAssessments = history.length;
    const averageScore = (history.reduce((acc, curr) => acc + curr.score, 0) / totalAssessments).toFixed(1);
    const lastAssessment = history[history.length - 1];

    let badgeClass = "risk-low";
    if (lastAssessment.score > 3 && lastAssessment.score <= 7) badgeClass = "risk-moderate";
    if (lastAssessment.score > 7) badgeClass = "risk-high";

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-label">Total Assessments</span>
                <span class="stat-value">${totalAssessments}</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Average Risk Score</span>
                <span class="stat-value">${averageScore} <small>/ 11</small></span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Latest Risk Level</span>
                <span class="stat-value"><span class="risk-badge-inline ${badgeClass}">${lastAssessment.riskLevel}</span></span>
            </div>
        </div>

        <div class="chart-card">
            <h4>Risk Score Evolution</h4>
            <div class="chart-legend-risk">
                <span class="legend-item"><i style="background: #10b981;"></i> Low risk (0-3)</span>
                <span class="legend-item"><i style="background: #f59e0b;"></i> Moderate risk (4-7)</span>
                <span class="legend-item"><i style="background: #ef4444;"></i> High risk (8-11)</span>
            </div>
            <div class="canvas-container">
                <canvas id="riskChart"></canvas>
            </div>
        </div>

        <div class="history-section">
            <div class="history-header-actions">
                <h4>Assessment History & Comparison</h4>
                <div class="history-selection-controls">
                    <button type="button" onclick="toggleSelectAll()" class="select-all-btn" id="selectAllBtn">Select All</button>
                    <button type="button" onclick="deleteSelectedHistory()" class="delete-selected-btn">Delete Selected</button>
                </div>
            </div>
            
            <ul class="history-list">
                ${history.map((item, index) => {
                    let itemRiskClass = "history-low";
                    if (item.score > 3 && item.score <= 7) itemRiskClass = "history-moderate";
                    if (item.score > 7) itemRiskClass = "history-high";

                    // Comparaison avec l'élément précédent pour les risques (+ / -)
                    let diffHtml = "";
                    if (index > 0) {
                        const prevItem = history[index - 1];
                        const prevGenetics = prevItem.genetics || [];
                        const currGenetics = item.genetics || [];

                        const added = currGenetics.filter(g => !prevGenetics.includes(g));
                        const removed = prevGenetics.filter(g => !currGenetics.includes(g));

                        let diffParts = [];
                        added.forEach(g => diffParts.push(`<span class="diff-added">+ ${g}</span>`));
                        removed.forEach(g => diffParts.push(`<span class="diff-removed">- ${g}</span>`));

                        if (diffParts.length > 0) {
                            diffHtml = `<div class="history-diff" id="diff-${index}" style="display: none;">${diffParts.join(" ")}</div>`;
                        } else {
                            diffHtml = `<div class="history-diff" id="diff-${index}" style="display: none;"><span class="no-diff">No changes compared to previous assessment</span></div>`;
                        }
                    } else {
                        diffHtml = `<div class="history-diff" id="diff-${index}" style="display: none;"><span class="no-diff">First assessment</span></div>`;
                    }

                    return `
                        <li class="${itemRiskClass}">
                            <div class="history-main-row">
                                <div class="history-left">
                                    <input type="checkbox" class="history-checkbox" data-index="${index}" onclick="event.stopPropagation();">
                                    <span class="history-date clickable-date" onclick="toggleDiff(${index})">${item.date} 🔍</span>
                                </div>
                                <div class="history-middle">
                                    <span class="history-score">Score : <strong>${item.score}</strong> / 11</span>
                                    <span class="history-badge">${item.riskLevel}</span>
                                </div>
                            </div>
                            ${diffHtml}
                        </li>
                    `;
                }).join("")}
            </ul>
        </div>
        <div class="stats-actions">
            <button type="button" onclick="clearStats()" class="clear-btn">Clear All History</button>
        </div>
    `;

    const pointColors = history.map(item => {
        if (item.score <= 3) return '#10b981';
        if (item.score <= 7) return '#f59e0b';
        return '#ef4444';
    });

    const canvasElement = document.getElementById("riskChart");
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(item => item.date),
            datasets: [{
                label: 'Risk Score',
                data: history.map(item => item.score),
                borderColor: '#0f172a',
                backgroundColor: 'rgba(15, 23, 42, 0.05)',
                borderWidth: 2.5,
                pointBackgroundColor: pointColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 11,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.history-checkbox');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => cb.checked = !allChecked);
    selectAllBtn.textContent = allChecked ? "Select All" : "Deselect All";
}

function deleteSelectedHistory() {
    let history = JSON.parse(localStorage.getItem("healthDocHistory")) || [];
    const checkboxes = document.querySelectorAll('.history-checkbox');
    
    // Récupérer les indices cochés en partant de la fin pour ne pas perturber les index lors de la suppression
    const indicesToDelete = [];
    checkboxes.forEach((cb, index) => {
        if (cb.checked) indicesToDelete.push(index);
    });

    if (indicesToDelete.length === 0) {
        alert("Please select at least one assessment to delete.");
        return;
    }

    if (confirm(`Are you sure you want to delete ${indicesToDelete.length} selected assessment(s)?`)) {
        // Filtrer le tableau pour garder uniquement les éléments non cochés
        history = history.filter((_, index) => !indicesToDelete.includes(index));
        localStorage.setItem("healthDocHistory", JSON.stringify(history));
        renderStatsDashboard();
    }
}

function clearStats() {
    if (confirm("Are you sure you want to clear your entire assessment history?")) {
        localStorage.removeItem("healthDocHistory");
        renderStatsDashboard();
    }
}

function toggleDiff(index) {
    const diffElement = document.getElementById(`diff-${index}`);
    if (diffElement) {
        if (diffElement.style.display === "none") {
            diffElement.style.display = "flex";
        } else {
            diffElement.style.display = "none";
        }
    }
}