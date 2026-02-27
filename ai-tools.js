/* ===================================================================
   AI TOOLS — Frontend Logic
   Policy Decoder | Commission Tracker | Renewal Oracle
   =================================================================== */

const API_BASE = '';

// ===== TAB SWITCHING =====
function switchTab(tabName) {
    // Hide all tab sections
    document.querySelectorAll('.ait-section').forEach(s => s.style.display = 'none');
    // Deactivate all tabs
    document.querySelectorAll('.ait-tab').forEach(t => t.classList.remove('active'));
    // Show selected
    const section = document.getElementById('tab-' + tabName);
    if (section) section.style.display = 'block';
    // Activate tab button
    document.querySelector(`.ait-tab[data-tab="${tabName}"]`)?.classList.add('active');
}

// ===== UTILITY: Format currency =====
function fmt(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
}

// ===================================================================
// 1. POLICY DECODER
// ===================================================================
async function decodePolicy() {
    const btn = document.getElementById('btnDecodePolicy');
    const policyType = document.getElementById('decoderPolicyType').value;
    const insurerId = document.getElementById('decoderInsurer').value;
    const userText = document.getElementById('decoderText').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Decoding...';

    try {
        const res = await fetch(API_BASE + '/api/policy-decoder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ policyType, insurerId: insurerId || undefined, userPolicyText: userText || undefined })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Decode failed');
        renderDecoderResults(data);
    } catch (e) {
        alert('Decode failed: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Decode Policy';
    }
}

function renderDecoderResults(data) {
    const container = document.getElementById('decoderResults');
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // --- Fairness Gauge ---
    const score = data.fairnessScore;
    const arc = document.getElementById('fairnessArc');
    const valEl = document.getElementById('fairnessValue');
    const circumference = 327; // 2 * PI * 52
    const offset = circumference - (score / 100) * circumference;
    arc.style.strokeDashoffset = circumference; // start from 0
    // Animate
    requestAnimationFrame(() => {
        arc.style.strokeDashoffset = offset;
    });
    // Color based on score
    if (score >= 75) arc.style.stroke = '#2dd4bf';
    else if (score >= 50) arc.style.stroke = '#fbbf24';
    else arc.style.stroke = '#f87171';

    // Animate counter
    animateCounter(valEl, 0, score, 1200);

    // Verdict
    document.getElementById('fairnessVerdict').textContent = data.fairnessVerdict;

    // Clause counts
    const cs = data.clauseSummary;
    document.getElementById('clauseCounts').innerHTML = `
        <span class="ait-count-green">🟢 ${cs.green} Safe</span>
        <span class="ait-count-yellow">🟡 ${cs.yellow} Caution</span>
        <span class="ait-count-red">🔴 ${cs.red} Danger</span>
    `;

    // --- TL;DR ---
    document.getElementById('tldrText').textContent = data.tldr;

    // --- AI Analysis ---
    const aiCard = document.getElementById('aiAnalysisCard');
    if (data.aiAnalysis) {
        aiCard.style.display = 'block';
        const rf = data.aiAnalysis.redFlags || [];
        const gf = data.aiAnalysis.greenFlags || [];
        document.getElementById('aiRedFlags').innerHTML = rf.length ? `
            <div class="ait-flag-group red">
                <h4><i class="fas fa-triangle-exclamation"></i> Red Flags</h4>
                ${rf.map(f => `<div class="ait-flag-item"><i class="fas fa-xmark red"></i> ${escHtml(f)}</div>`).join('')}
            </div>
        ` : '';
        document.getElementById('aiGreenFlags').innerHTML = gf.length ? `
            <div class="ait-flag-group green">
                <h4><i class="fas fa-circle-check"></i> Green Flags</h4>
                ${gf.map(f => `<div class="ait-flag-item"><i class="fas fa-check green"></i> ${escHtml(f)}</div>`).join('')}
            </div>
        ` : '';
    } else {
        aiCard.style.display = 'none';
    }

    // --- Clause List --- (sorted by impact — worst first)
    const clauseListEl = document.getElementById('clauseList');
    clauseListEl.innerHTML = data.clauses.map(c => {
        const tagClass = c.level === 'red' ? 'ait-tag-gotcha' : c.level === 'yellow' ? 'ait-tag-hidden' : 'ait-tag-standard';
        const tagLabel = c.level === 'red' ? 'GOTCHA' : c.level === 'yellow' ? 'HIDDEN' : 'STANDARD';
        const impactColor = c.impactScore >= 8 ? '#EF4444' : c.impactScore >= 5 ? '#F59E0B' : '#0D9488';
        const impactWidth = (c.impactScore / 10) * 100;
        return `
            <div class="ait-clause-item">
                <span class="ait-clause-flag">${c.flag}</span>
                <div class="ait-clause-body">
                    <p class="ait-clause-text"><strong>${escHtml(c.name)}</strong></p>
                    <p class="ait-clause-text" style="margin-top:4px; color:var(--pb-gray-600)">${escHtml(c.simplified)}</p>
                    <div class="ait-clause-meta">
                        <span class="ait-clause-tag ait-tag-category">${escHtml(c.category)}</span>
                        <span class="ait-clause-tag ${tagClass}">${tagLabel}</span>
                        <span class="ait-clause-tag" style="background:${impactColor}15; color:${impactColor}; font-weight:700">
                            Impact: ${c.impactScore}/10
                        </span>
                    </div>
                    ${c.impactScore >= 5 ? `
                    <div style="margin-top:8px; display:flex; align-items:center; gap:8px">
                        <span style="font-size:0.68rem; color:var(--pb-gray-400); min-width:50px">Severity</span>
                        <div style="flex:1; height:6px; background:var(--pb-gray-200); border-radius:3px; overflow:hidden">
                            <div style="height:100%; width:${impactWidth}%; background:${impactColor}; border-radius:3px; transition:width 0.8s ease"></div>
                        </div>
                    </div>` : ''}
                    ${c.financialImpact ? `<div class="ait-clause-impact"><i class="fas fa-indian-rupee-sign"></i> ${escHtml(c.financialImpact)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // --- Insurer-Specific ---
    const insCard = document.getElementById('insurerSpecificCard');
    if (data.insurerDetails) {
        insCard.style.display = 'block';
        document.getElementById('insurerSpecificTitle').textContent = data.insurerName || 'Insurer';
        const grid = document.getElementById('insurerSpecificDetails');
        grid.innerHTML = Object.entries(data.insurerDetails).map(([k, v]) => `
            <div class="ait-insurer-detail">
                <span class="label">${formatKey(k)}</span>
                <span class="value">${escHtml(String(v))}</span>
            </div>
        `).join('');
    } else {
        insCard.style.display = 'none';
    }
}

// ===================================================================
// 2. COMMISSION TRACKER
// ===================================================================
let pieAgentChart = null;
let pieDirectChart = null;

async function analyzeCommission() {
    const productType = document.getElementById('commProductType').value;
    const premium = document.getElementById('commPremium').value;
    const insurer = document.getElementById('commInsurer').value;

    try {
        let url = `${API_BASE}/api/commission-transparency/${productType}?premium=${premium}`;
        if (insurer) url += `&insurer=${insurer}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        renderCommissionResults(data);
    } catch (e) {
        alert('Commission analysis failed: ' + e.message);
    }
}

function renderCommissionResults(data) {
    const container = document.getElementById('commissionResults');
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // --- Savings Banner ---
    document.getElementById('commSavingsDesc').textContent = data.potentialSavings.description;
    document.getElementById('commSavingsAmt').textContent = fmt(data.potentialSavings.amount);

    // --- Pie Charts ---
    const pieColors = {
        coverage: '#0D9488',
        distribution: '#F59E0B',
        commission: '#EF4444',
        operating: '#6366F1'
    };

    // Destroy old charts
    if (pieAgentChart) pieAgentChart.destroy();
    if (pieDirectChart) pieDirectChart.destroy();

    const agentData = data.pieChart.agentChannel;
    pieAgentChart = new Chart(document.getElementById('pieAgent'), {
        type: 'doughnut',
        data: {
            labels: ['Goes to Coverage', 'Distribution Cost'],
            datasets: [{
                data: [agentData.coverage, agentData.distribution],
                backgroundColor: [pieColors.coverage, pieColors.distribution],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 }, padding: 16 } }
            }
        }
    });
    document.getElementById('pieAgentLabel').textContent = `${agentData.distribution}% of your premium goes to distribution`;

    const directData = data.pieChart.directChannel;
    pieDirectChart = new Chart(document.getElementById('pieDirect'), {
        type: 'doughnut',
        data: {
            labels: ['Goes to Coverage', 'Distribution Cost'],
            datasets: [{
                data: [directData.coverage, directData.distribution],
                backgroundColor: [pieColors.coverage, '#06B6D4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 }, padding: 16 } }
            }
        }
    });
    document.getElementById('pieDirectLabel').textContent = `Only ${directData.distribution}% goes to distribution — ${directData.coverage}% to YOU`;

    // --- Channel Table ---
    const tbody = document.getElementById('channelTableBody');
    tbody.innerHTML = data.channelBreakdown.map(ch => {
        const isBest = ch.channel === 'direct_digital';
        return `
            <tr class="${isBest ? 'best-row' : ''}">
                <td><strong>${escHtml(ch.channelLabel)}</strong></td>
                <td>${ch.commissionPercent}% <span style="color:var(--pb-gray-400)">(${fmt(ch.amounts.commission)})</span></td>
                <td>${ch.operatingPercent}% <span style="color:var(--pb-gray-400)">(${fmt(ch.amounts.operating)})</span></td>
                <td class="${isBest ? 'highlight' : ''}">${ch.totalDistributionPercent}% <span style="color:var(--pb-gray-400)">(${fmt(ch.amounts.totalDistribution)})</span></td>
                <td><strong>${fmt(ch.amounts.goesToCoverage)}</strong> <span style="color:var(--pb-gray-400)">(${ch.coveragePercent}%)</span></td>
            </tr>
        `;
    }).join('');

    // --- Per-Insurer Commission Grid ---
    const grid = document.getElementById('insurerCommGrid');
    grid.innerHTML = data.allInsurers.map((ins, i) => {
        const maxComm = Math.max(...data.allInsurers.map(x => x.agentCommissionPercent));
        const agentWidth = (ins.agentCommissionPercent / maxComm) * 100;
        const directWidth = (ins.directSavingsPercent / maxComm) * 100;
        return `
            <div class="ait-comm-card">
                <div class="ait-comm-card-header">
                    <span class="ait-comm-insurer">${escHtml(ins.insurerName)}</span>
                    ${ins.webExclusive ? '<span class="ait-comm-badge"><i class="fas fa-globe"></i> Web-Exclusive</span>' : ''}
                </div>
                <div class="ait-comm-bar-row">
                    <span class="ait-comm-bar-label">Agent Comm.</span>
                    <div class="ait-comm-bar-track"><div class="ait-comm-bar-fill agent" style="width:${agentWidth}%"></div></div>
                    <span class="ait-comm-bar-value">${ins.agentCommissionPercent}%</span>
                </div>
                <div class="ait-comm-bar-row">
                    <span class="ait-comm-bar-label">Direct Discount</span>
                    <div class="ait-comm-bar-track"><div class="ait-comm-bar-fill direct" style="width:${directWidth}%"></div></div>
                    <span class="ait-comm-bar-value">${ins.directSavingsPercent}%</span>
                </div>
                <div class="ait-comm-savings">
                    <i class="fas fa-piggy-bank"></i> Save ${fmt(ins.directSavingsAmount)} by going direct
                </div>
            </div>
        `;
    }).join('');
}

// ===================================================================
// 3. RENEWAL ORACLE
// ===================================================================
function oracleDemo(reg, premium, insurer) {
    document.getElementById('oracleRegInput').value = reg;
    document.getElementById('oraclePremium').value = premium;
    document.getElementById('oracleInsurer').value = insurer;
    runOracle();
}

async function runOracle() {
    const regNum = document.getElementById('oracleRegInput').value.trim().toUpperCase();
    const premium = document.getElementById('oraclePremium').value;
    const insurer = document.getElementById('oracleInsurer').value;
    const age = document.getElementById('oracleAge').value;

    if (!regNum && !premium) {
        alert('Please enter a registration number or premium amount');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/api/renewal-forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                registrationNumber: regNum || undefined,
                currentPremium: premium ? parseInt(premium) : undefined,
                currentInsurer: insurer || undefined,
                userAge: age ? parseInt(age) : 30
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Forecast failed');
        renderOracleResults(data);
    } catch (e) {
        alert('Oracle failed: ' + e.message);
    }
}

function renderOracleResults(data) {
    const container = document.getElementById('oracleResults');
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // --- Alerts ---
    const alertsEl = document.getElementById('oracleAlerts');
    const alertIcons = {
        SWITCH_RECOMMENDED: 'fa-right-left',
        RENEWAL_DUE_SOON: 'fa-clock',
        POLICY_EXPIRED: 'fa-triangle-exclamation',
        TP_RATE_HIKE: 'fa-chart-line',
        IDV_DEPRECIATION: 'fa-car-burst',
        AGE_BAND_JUMP: 'fa-user-clock'
    };

    if (data.alerts.length > 0) {
        alertsEl.innerHTML = data.alerts.map(a => `
            <div class="ait-alert ${a.severity}">
                <div class="ait-alert-icon">
                    <i class="fas ${alertIcons[a.type] || 'fa-bell'}"></i>
                </div>
                <div class="ait-alert-body">
                    <h4>${escHtml(a.title)}</h4>
                    <p>${escHtml(a.detail)}</p>
                    <span class="ait-alert-action"><i class="fas fa-arrow-right"></i> ${escHtml(a.action)}</span>
                </div>
            </div>
        `).join('');
    } else {
        alertsEl.innerHTML = `
            <div class="ait-alert low">
                <div class="ait-alert-icon"><i class="fas fa-circle-check"></i></div>
                <div class="ait-alert-body">
                    <h4>All Clear!</h4>
                    <p>No urgent alerts for your policy. Your coverage looks good.</p>
                </div>
            </div>
        `;
    }

    // --- Forecast Table ---
    const tbody = document.getElementById('forecastTableBody');
    // Add current year row
    const curYear = new Date().getFullYear();
    let rows = `
        <tr style="font-weight:700; background:var(--pb-light-blue)">
            <td>${curYear} (Current)</td>
            <td>${data.vehicle.year ? (curYear - data.vehicle.year) + ' yrs' : '—'}</td>
            <td>${data.vehicle.currentIDV ? fmt(data.vehicle.currentIDV) : '—'}</td>
            <td>—</td>
            <td>—</td>
            <td><strong>${fmt(data.currentPremium)}</strong></td>
            <td>—</td>
        </tr>
    `;
    rows += data.forecast.map(f => {
        const changeClass = f.direction === 'UP' ? 'ait-change-up' : f.direction === 'DOWN' ? 'ait-change-down' : '';
        return `
            <tr>
                <td><strong>${f.year}</strong></td>
                <td>${f.vehicleAge} yrs</td>
                <td>${fmt(f.idv)}</td>
                <td>${fmt(f.tpPremium)}</td>
                <td>${fmt(f.odPremium)}</td>
                <td><strong>${fmt(f.totalPremium)}</strong></td>
                <td class="${changeClass}">${f.arrow} ${f.premiumChangePercent > 0 ? '+' : ''}${f.premiumChangePercent}%</td>
            </tr>
        `;
    }).join('');
    tbody.innerHTML = rows;

    // --- Forecast Line Chart ---
    renderForecastChart(data);

    // --- Top Insurer Recommendations ---
    const grid = document.getElementById('topInsurersGrid');
    grid.innerHTML = data.topInsurers.map((ins, i) => `
        <div class="ait-top-insurer-card">
            <div class="ait-top-insurer-name">${escHtml(ins.insurerName)}</div>
            <div class="ait-top-insurer-price">${fmt(ins.premium)}</div>
            ${ins.savings > 0 ? `<div class="ait-top-insurer-savings"><i class="fas fa-arrow-down"></i> Save ${fmt(ins.savings)} (${ins.savingsPercent}%)</div>` : ''}
            ${ins.highlights && ins.highlights.length ? `
                <div style="margin-top:8px">
                    ${ins.highlights.slice(0, 3).map(h => `<span style="display:inline-block;font-size:0.72rem;background:var(--pb-gray-100);color:var(--pb-gray-600);padding:2px 8px;border-radius:100px;margin:2px 4px 2px 0">${escHtml(h)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ===================================================================
// UTILITIES
// ===================================================================

let forecastChartInstance = null;

function renderForecastChart(data) {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;
    if (forecastChartInstance) forecastChartInstance.destroy();

    const curYear = new Date().getFullYear();
    const labels = [curYear + ' (Now)', ...data.forecast.map(f => f.year)];
    const totalData = [data.currentPremium, ...data.forecast.map(f => f.totalPremium)];
    const tpData = [null, ...data.forecast.map(f => f.tpPremium)];
    const odData = [null, ...data.forecast.map(f => f.odPremium)];
    const idvData = [data.vehicle.currentIDV, ...data.forecast.map(f => f.idv)];

    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Total Premium',
                    data: totalData,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#6366F1',
                    pointBorderWidth: 2,
                    pointRadius: 5
                },
                {
                    label: 'TP Premium',
                    data: tpData,
                    borderColor: '#F59E0B',
                    borderDash: [6, 3],
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#F59E0B'
                },
                {
                    label: 'OD Premium',
                    data: odData,
                    borderColor: '#0D9488',
                    borderDash: [6, 3],
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#0D9488'
                },
                {
                    label: 'IDV (Vehicle Value)',
                    data: idvData,
                    borderColor: '#EF4444',
                    borderDash: [2, 4],
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#EF4444',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 }, usePointStyle: true, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Premium (₹)', font: { size: 11, weight: 600 } },
                    ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' }
                },
                y1: {
                    position: 'right',
                    beginAtZero: false,
                    title: { display: true, text: 'IDV (₹)', font: { size: 11, weight: 600 } },
                    ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { font: { weight: 600 } }
                }
            }
        }
    });
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

function animateCounter(el, from, to, duration) {
    const start = performance.now();
    const step = (ts) => {
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Default to decoder tab
    switchTab('decoder');
    // Initialize file upload zone
    initFileUpload();
});

// ===================================================================
// FILE UPLOAD — Drag & Drop + Click to Browse
// ===================================================================
let selectedFile = null;

function initFileUpload() {
    const zone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('policyFileInput');
    const browseBtn = document.getElementById('uploadBrowseBtn');
    const removeBtn = document.getElementById('uploadRemoveBtn');

    if (!zone) return;

    // Click browse
    browseBtn.addEventListener('click', () => fileInput.click());
    zone.addEventListener('click', (e) => {
        // Only trigger if clicking idle area (not the remove button or selected area)
        if (e.target.closest('#uploadSelected') || e.target.closest('.ait-upload-remove')) return;
        if (!selectedFile) fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelected(e.target.files[0]);
    });

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('ait-upload-dragover');
    });
    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('ait-upload-dragover');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('ait-upload-dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelected(files[0]);
    });

    // Remove button
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSelectedFile();
    });
}

function handleFileSelected(file) {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowed.includes(file.type)) {
        alert('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum 10MB allowed.');
        return;
    }

    selectedFile = file;

    // Update UI
    document.getElementById('uploadIdle').style.display = 'none';
    document.getElementById('uploadSelected').style.display = 'flex';
    document.getElementById('uploadFileName').textContent = file.name;
    document.getElementById('uploadFileSize').textContent = formatFileSize(file.size);
    document.getElementById('btnUploadDecode').style.display = 'flex';

    // File type icon
    const icon = document.querySelector('.ait-upload-file-icon');
    if (file.type === 'application/pdf') {
        icon.className = 'fas fa-file-pdf ait-upload-file-icon';
        icon.style.color = '#EF4444';
    } else if (file.type.includes('word')) {
        icon.className = 'fas fa-file-word ait-upload-file-icon';
        icon.style.color = '#3B82F6';
    } else {
        icon.className = 'fas fa-file-lines ait-upload-file-icon';
        icon.style.color = '#8B5CF6';
    }
}

function removeSelectedFile() {
    selectedFile = null;
    document.getElementById('policyFileInput').value = '';
    document.getElementById('uploadIdle').style.display = 'flex';
    document.getElementById('uploadSelected').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('btnUploadDecode').style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== UPLOAD & DECODE =====
async function uploadAndDecode() {
    if (!selectedFile) {
        alert('Please select a file first.');
        return;
    }

    const btn = document.getElementById('btnUploadDecode');
    const decoderBtn = document.getElementById('btnDecodePolicy');
    const progressEl = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('uploadProgressFill');
    const progressText = document.getElementById('uploadProgressText');

    // Show progress
    progressEl.style.display = 'block';
    btn.disabled = true;
    decoderBtn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading & Analyzing...';

    // Animate progress
    let progress = 0;
    const progressSteps = [
        { pct: 15, text: 'Uploading file...' },
        { pct: 35, text: 'Extracting text from document...' },
        { pct: 55, text: 'AI analyzing policy clauses...' },
        { pct: 75, text: 'Identifying red flags & gotchas...' },
        { pct: 90, text: 'Calculating fairness score...' }
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
            progress = progressSteps[stepIdx].pct;
            progressFill.style.width = progress + '%';
            progressText.textContent = progressSteps[stepIdx].text;
            stepIdx++;
        }
    }, 1500);

    try {
        const formData = new FormData();
        formData.append('policyFile', selectedFile);

        const res = await fetch(API_BASE + '/api/policy-decoder/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = 'Analysis complete!';

        if (!data.success) throw new Error(data.error || 'Upload failed');

        // Brief delay so user sees 100%
        await new Promise(r => setTimeout(r, 500));

        // Render results using the same renderer with extra upload info
        renderDecoderResults(data);

        // Show upload info banner above results
        showUploadBanner(data);

    } catch (e) {
        clearInterval(progressInterval);
        progressFill.style.width = '0%';
        progressText.textContent = 'Failed: ' + e.message;
        progressText.style.color = '#EF4444';
        alert('Upload analysis failed: ' + e.message);
    } finally {
        btn.disabled = false;
        decoderBtn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Upload & Decode with AI';
        // Reset progress text color
        setTimeout(() => {
            progressText.style.color = '';
        }, 3000);
    }
}

function showUploadBanner(data) {
    // Remove existing banner if any
    const existing = document.getElementById('uploadInfoBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'uploadInfoBanner';
    banner.className = 'ait-upload-banner';
    banner.innerHTML = `
        <div class="ait-upload-banner-inner">
            <div class="ait-upload-banner-icon"><i class="fas fa-file-circle-check"></i></div>
            <div class="ait-upload-banner-info">
                <strong>${escHtml(data.fileName)}</strong>
                <span>${formatFileSize(data.fileSize)} · ${data.extractedTextLength.toLocaleString()} chars extracted · Type: ${escHtml(data.detectedType)}${data.detectedInsurer ? ' · Insurer: ' + escHtml(data.detectedInsurer) : ''}</span>
            </div>
            <div class="ait-upload-banner-badge">
                <i class="fas fa-robot"></i> Real AI Analysis
            </div>
        </div>
    `;

    // Insert before results container
    const results = document.getElementById('decoderResults');
    results.parentNode.insertBefore(banner, results);

    // Also show recommendations & missing coverages if available
    if (data.aiAnalysis && (data.aiAnalysis.recommendations?.length || data.aiAnalysis.missingCoverages?.length)) {
        let extraHtml = '';
        if (data.aiAnalysis.recommendations?.length) {
            extraHtml += `
                <div class="ait-card ait-recommendations-card">
                    <h3><i class="fas fa-lightbulb"></i> AI Recommendations</h3>
                    <ul class="ait-rec-list">
                        ${data.aiAnalysis.recommendations.map(r => `<li><i class="fas fa-arrow-right"></i> ${escHtml(r)}</li>`).join('')}
                    </ul>
                </div>`;
        }
        if (data.aiAnalysis.missingCoverages?.length) {
            extraHtml += `
                <div class="ait-card ait-missing-card">
                    <h3><i class="fas fa-triangle-exclamation"></i> Missing Coverages</h3>
                    <ul class="ait-missing-list">
                        ${data.aiAnalysis.missingCoverages.map(m => `<li><i class="fas fa-circle-xmark"></i> ${escHtml(m)}</li>`).join('')}
                    </ul>
                </div>`;
        }
        // Append after AI analysis card
        const aiCard = document.getElementById('aiAnalysisCard');
        // Remove existing extra cards
        document.querySelectorAll('.ait-recommendations-card, .ait-missing-card').forEach(c => c.remove());
        if (aiCard) aiCard.insertAdjacentHTML('afterend', extraHtml);
    }
}

// ===== DEMO HELPERS =====
function decoderDemo(policyType, insurer) {
    document.getElementById('decoderPolicyType').value = policyType;
    document.getElementById('decoderInsurer').value = insurer;
    document.getElementById('decoderText').value = '';
    decodePolicy();
}

function commDemo(product, premium, insurer) {
    document.getElementById('commProductType').value = product;
    document.getElementById('commPremium').value = premium;
    document.getElementById('commInsurer').value = insurer;
    analyzeCommission();
}
