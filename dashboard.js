// =====================================================================
// InsurGuard Intelligence Dashboard — Frontend Logic
// =====================================================================

const API_BASE = '';

// ===== TAB SWITCHING =====
function switchTab(tab) {
    document.querySelectorAll('.ig-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ig-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.ig-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`panel-${tab}`).classList.add('active');
}

// ===== UTILITY: Format currency =====
function formatINR(num) {
    if (num === undefined || num === null) return '₹0';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
}

function formatINRFull(num) {
    return `₹${(num || 0).toLocaleString('en-IN')}`;
}

// ===== UTILITY: Create gauge SVG =====
function createGauge(score, containerId, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444';
    const circumference = 2 * Math.PI * 80; // r=80
    const offset = circumference - (score / 100) * circumference;

    container.innerHTML = `
        <div class="ig-gauge-container">
            <svg class="ig-gauge-svg" viewBox="0 0 200 200">
                <circle class="ig-gauge-bg" cx="100" cy="100" r="80"/>
                <circle class="ig-gauge-fill" cx="100" cy="100" r="80" 
                    style="stroke:${color}; stroke-dasharray:${circumference}; stroke-dashoffset:${circumference};"
                    id="gauge-${containerId}"/>
            </svg>
            <div class="ig-gauge-score">
                <div class="ig-gauge-number" style="color:${color}">${score}</div>
                <div class="ig-gauge-label">${label}</div>
            </div>
        </div>
    `;

    // Animate
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = document.getElementById(`gauge-${containerId}`);
            if (fill) fill.style.strokeDashoffset = offset;
        }, 100);
    });
}

// ===== UTILITY: Animate weight bars =====
function animateWeightBars() {
    document.querySelectorAll('.ig-weight-fill').forEach(bar => {
        const target = bar.dataset.width;
        setTimeout(() => {
            bar.style.width = target + '%';
        }, 300);
    });
    document.querySelectorAll('.ig-gap-bar-fill').forEach(bar => {
        const target = bar.dataset.width;
        setTimeout(() => {
            bar.style.width = Math.min(100, target) + '%';
        }, 300);
    });
}

// =====================================================================
// 2.1 LOOT-SHIELD: Predict Claim Settlement
// =====================================================================
async function predictClaim() {
    const btn = document.getElementById('btn-predict-claim');
    const loading = document.getElementById('claim-loading');
    const results = document.getElementById('claim-results');

    btn.disabled = true;
    loading.classList.add('active');
    results.classList.remove('active');

    const payload = {
        insurerId: document.getElementById('claim-insurer').value,
        claimType: document.getElementById('claim-type').value,
        userAge: parseInt(document.getElementById('claim-userAge').value) || 35,
        vehicleAge: parseInt(document.getElementById('claim-vehicleAge').value) || 3,
        stateCode: document.getElementById('claim-state').value,
        policyType: document.getElementById('claim-policyType').value,
        sumInsured: parseInt(document.getElementById('claim-sumInsured').value) || 500000,
        hasZeroDep: document.getElementById('claim-zeroDep').checked,
        hasRoomRentWaiver: document.getElementById('claim-roomRentWaiver').checked
    };

    try {
        const res = await fetch(`${API_BASE}/api/predict-claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderClaimResults(data, payload.insurerId);
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
        loading.classList.remove('active');
    }
}

function renderClaimResults(data, selectedInsurer) {
    const results = document.getElementById('claim-results');
    results.classList.add('active');

    // Score gauge
    const scoreSection = document.getElementById('claim-score-section');
    const verdictClass = data.frictionScore >= 80 ? 'smooth' : data.frictionScore >= 60 ? 'moderate' : data.frictionScore >= 40 ? 'high' : 'critical';

    scoreSection.innerHTML = `
        <div id="claim-gauge-mount"></div>
        <div class="ig-score-details">
            <div class="ig-verdict-badge ${verdictClass}">${data.verdictLabel}</div>
            <div class="ig-verdict-text">
                Estimated cashless approval time: <strong>${data.estimatedApprovalTime}</strong><br>
                ${data.insurer.name} average settlement: <strong>${data.avgSettlementDays} days</strong> | 
                CSR: <strong>${data.insurer.csr}%</strong> | 
                Cashless approval rate: <strong>${(data.insurer.cashlessRate * 100).toFixed(0)}%</strong>
            </div>
            <div class="ig-weights">
                <div class="ig-weight-item">
                    <span class="ig-weight-label">W₁ Insurer Risk</span>
                    <div class="ig-weight-bar"><div class="ig-weight-fill" data-width="${data.weights.W1_insurerSpecific}" style="background:${data.weights.W1_insurerSpecific >= 70 ? '#10B981' : data.weights.W1_insurerSpecific >= 40 ? '#F59E0B' : '#EF4444'}"></div></div>
                    <span class="ig-weight-value">${data.weights.W1_insurerSpecific}%</span>
                </div>
                <div class="ig-weight-item">
                    <span class="ig-weight-label">W₂ Category Risk</span>
                    <div class="ig-weight-bar"><div class="ig-weight-fill" data-width="${data.weights.W2_categoryRisk}" style="background:${data.weights.W2_categoryRisk >= 70 ? '#10B981' : data.weights.W2_categoryRisk >= 40 ? '#F59E0B' : '#EF4444'}"></div></div>
                    <span class="ig-weight-value">${data.weights.W2_categoryRisk}%</span>
                </div>
                <div class="ig-weight-item">
                    <span class="ig-weight-label">W₃ Policy Quality</span>
                    <div class="ig-weight-bar"><div class="ig-weight-fill" data-width="${data.weights.W3_policyQuality}" style="background:${data.weights.W3_policyQuality >= 70 ? '#10B981' : data.weights.W3_policyQuality >= 40 ? '#F59E0B' : '#EF4444'}"></div></div>
                    <span class="ig-weight-value">${data.weights.W3_policyQuality}%</span>
                </div>
            </div>
            <div class="ig-data-source"><i class="fas fa-database"></i> ${data.dataSource}</div>
        </div>
    `;

    createGauge(data.frictionScore, 'claim-gauge-mount', 'FRICTION SCORE');

    // Factors
    const factorsEl = document.getElementById('claim-factors');
    factorsEl.innerHTML = data.factors.map(f => `
        <div class="ig-factor ${f.impact}">
            <i class="fas fa-${f.impact === 'positive' ? 'check-circle' : f.impact === 'negative' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${f.label}</span>
        </div>
    `).join('');

    // Comparison table
    const tableEl = document.getElementById('claim-comparison');
    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>Insurer</th>
                <th>Friction Score</th>
                <th>CSR</th>
            </tr>
        </thead>
        <tbody>
            ${data.allInsurerComparison.map((ins, i) => {
                const pillClass = ins.frictionScore >= 80 ? 'green' : ins.frictionScore >= 60 ? 'yellow' : ins.frictionScore >= 40 ? 'orange' : 'red';
                const isSelected = ins.insurerId === selectedInsurer;
                return `<tr class="${isSelected ? 'ig-highlight' : ''}">
                    <td>${isSelected ? '→' : ''} #${i + 1}</td>
                    <td><strong>${ins.insurerName}</strong></td>
                    <td><span class="ig-score-pill ${pillClass}">${ins.frictionScore}</span></td>
                    <td>${ins.csr}%</td>
                </tr>`;
            }).join('')}
        </tbody>
    `;

    animateWeightBars();
}

// =====================================================================
// 2.2 VULNERABILITY ASSESSMENT
// =====================================================================
async function assessVulnerability() {
    const btn = document.getElementById('btn-vulnerability');
    const loading = document.getElementById('vuln-loading');
    const results = document.getElementById('vuln-results');

    btn.disabled = true;
    loading.classList.add('active');
    results.classList.remove('active');

    const payload = {
        userAge: parseInt(document.getElementById('vuln-age').value) || 35,
        familySize: parseInt(document.getElementById('vuln-familySize').value) || 4,
        annualIncome: parseInt(document.getElementById('vuln-income').value) || 1200000,
        monthlyExpenses: parseInt(document.getElementById('vuln-expenses').value) || 50000,
        existingHealthCover: parseInt(document.getElementById('vuln-healthCover').value) || 0,
        existingLifeCover: parseInt(document.getElementById('vuln-lifeCover').value) || 0,
        existingMotorPolicies: parseInt(document.getElementById('vuln-motorPolicies').value) || 0,
        hasPersonalAccident: document.getElementById('vuln-personalAccident').checked,
        hasCriticalIllness: document.getElementById('vuln-criticalIllness').checked,
        hasHomeInsurance: document.getElementById('vuln-homeInsurance').checked,
        dependents: parseInt(document.getElementById('vuln-dependents').value) || 0,
        loans: parseInt(document.getElementById('vuln-loans').value) || 0,
        city: document.getElementById('vuln-city').value
    };

    try {
        const res = await fetch(`${API_BASE}/api/vulnerability-assessment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderVulnerabilityResults(data);
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
        loading.classList.remove('active');
    }
}

function renderVulnerabilityResults(data) {
    const results = document.getElementById('vuln-results');
    results.classList.add('active');

    // Survival Runway
    const runway = document.getElementById('vuln-runway');
    const runwayColor = data.survivalRunway.months >= 60 ? '' : data.survivalRunway.months >= 24 ? 'background:linear-gradient(135deg,#92400E,#F59E0B);' : 'background:linear-gradient(135deg,#991B1B,#EF4444);';
    runway.innerHTML = `
        <div style="${runwayColor}">
            <div class="ig-runway-number">${data.survivalRunway.months >= 60 ? '60+' : data.survivalRunway.months}</div>
            <div class="ig-runway-unit">months</div>
        </div>
        <div class="ig-runway-detail">
            <div class="ig-runway-title">Survival Runway</div>
            <div class="ig-runway-desc">${data.survivalRunway.label} — Monthly burn rate: ${formatINRFull(data.survivalRunway.monthlyBurn)}</div>
        </div>
    `;
    runway.style = runwayColor;

    // Score gauge
    const scoreSection = document.getElementById('vuln-score-section');
    const verdictClass = data.vulnerabilityScore >= 80 ? 'smooth' : data.vulnerabilityScore >= 60 ? 'moderate' : data.vulnerabilityScore >= 40 ? 'high' : 'critical';

    scoreSection.innerHTML = `
        <div id="vuln-gauge-mount"></div>
        <div class="ig-score-details">
            <div class="ig-verdict-badge ${verdictClass}">${data.verdictLabel}</div>
            <div class="ig-verdict-text">${data.inflationWarning}</div>
            <div class="ig-data-source"><i class="fas fa-database"></i> ${data.methodology}</div>
        </div>
    `;

    createGauge(data.vulnerabilityScore, 'vuln-gauge-mount', 'PROTECTION SCORE');

    // Gap Bars
    const gapsEl = document.getElementById('vuln-gaps');
    const gaps = data.gaps;

    const healthPct = Math.min(100, gaps.health.ratio);
    const lifePct = Math.min(100, gaps.life.ratio);
    const healthColor = healthPct >= 80 ? '#10B981' : healthPct >= 50 ? '#F59E0B' : '#EF4444';
    const lifeColor = lifePct >= 80 ? '#10B981' : lifePct >= 50 ? '#F59E0B' : '#EF4444';

    gapsEl.innerHTML = `
        <div class="ig-gap-card">
            <div class="ig-gap-card-title"><i class="fas fa-heart"></i> Health Insurance</div>
            <div class="ig-gap-bar-container">
                <div class="ig-gap-bar-labels">
                    <span class="current">${formatINR(gaps.health.current)}</span>
                    <span class="recommended">Recommended: ${formatINR(gaps.health.recommended)}</span>
                </div>
                <div class="ig-gap-bar"><div class="ig-gap-bar-fill" data-width="${healthPct}" style="background:${healthColor}"></div></div>
                <div class="ig-gap-status ${gaps.health.gap > 0 ? 'shortfall' : 'covered'}">
                    ${gaps.health.gap > 0 ? `⚠️ Shortfall: ${formatINR(gaps.health.gap)}` : '✅ Adequate coverage'}
                </div>
            </div>
        </div>
        <div class="ig-gap-card">
            <div class="ig-gap-card-title"><i class="fas fa-user-shield"></i> Life Insurance</div>
            <div class="ig-gap-bar-container">
                <div class="ig-gap-bar-labels">
                    <span class="current">${formatINR(gaps.life.current)}</span>
                    <span class="recommended">Recommended: ${formatINR(gaps.life.recommended)}</span>
                </div>
                <div class="ig-gap-bar"><div class="ig-gap-bar-fill" data-width="${lifePct}" style="background:${lifeColor}"></div></div>
                <div class="ig-gap-status ${gaps.life.gap > 0 ? 'shortfall' : 'covered'}">
                    ${gaps.life.gap > 0 ? `⚠️ Shortfall: ${formatINR(gaps.life.gap)}` : '✅ Adequate coverage'}
                </div>
            </div>
        </div>
        <div class="ig-gap-card">
            <div class="ig-gap-card-title"><i class="fas fa-car-burst"></i> Personal Accident</div>
            <div style="font-size:14px;font-weight:600;color:${gaps.personalAccident.covered ? '#10B981' : '#EF4444'};">
                ${gaps.personalAccident.covered ? '✅ Covered' : '❌ Not Covered'}
                ${gaps.personalAccident.needed && !gaps.personalAccident.covered ? '<div style="font-size:12px;color:#991B1B;margin-top:4px;">⚠️ Owner-driver PA is mandatory (₹15L)</div>' : ''}
            </div>
        </div>
        <div class="ig-gap-card">
            <div class="ig-gap-card-title"><i class="fas fa-disease"></i> Critical Illness</div>
            <div style="font-size:14px;font-weight:600;color:${gaps.criticalIllness.covered ? '#10B981' : gaps.criticalIllness.needed ? '#EF4444' : '#64748B'};">
                ${gaps.criticalIllness.covered ? '✅ Covered' : gaps.criticalIllness.needed ? '❌ Needed — High risk at your age' : '⬜ Optional at your age'}
            </div>
        </div>
    `;

    // Inflation projections
    const inflWarn = document.getElementById('vuln-inflation-warning');
    if (data.inflationWarning.startsWith('⚠️')) {
        inflWarn.style.display = 'flex';
        inflWarn.className = 'ig-alert warning';
        inflWarn.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${data.inflationWarning}</span>`;
    } else {
        inflWarn.style.display = 'flex';
        inflWarn.className = 'ig-alert success';
        inflWarn.innerHTML = `<i class="fas fa-check-circle"></i><span>${data.inflationWarning}</span>`;
    }

    const inflGrid = document.getElementById('vuln-inflation');
    const keyProcedures = ['bypassSurgery', 'kneeReplacement', 'cancerTreatment', 'angioplasty', 'cSection', 'icuPerDay'];
    const nameMap = {
        bypassSurgery: 'Bypass Surgery', kneeReplacement: 'Knee Replacement', cancerTreatment: 'Cancer Treatment',
        angioplasty: 'Angioplasty', cSection: 'C-Section', icuPerDay: 'ICU (per day)',
        kidneyDialysis: 'Kidney Dialysis', appendectomy: 'Appendectomy', spinalSurgery: 'Spinal Surgery', liverTransplant: 'Liver Transplant'
    };

    inflGrid.innerHTML = keyProcedures.map(key => {
        const p = data.inflationProjections[key];
        if (!p) return '';
        return `
            <div class="ig-inflation-item">
                <div class="ig-inflation-name">${nameMap[key] || key}</div>
                <div class="ig-inflation-costs">
                    <span><span class="year">2026:</span> <span class="amount">${formatINR(p.cost2026)}</span></span>
                </div>
                <div class="ig-inflation-costs">
                    <span><span class="year">2031:</span> <span class="amount ${p.coveredIn2031 ? 'covered' : 'not-covered'}">${formatINR(p.cost2031)}</span></span>
                </div>
                ${p.shortfall2031 > 0 ? `<div style="font-size:11px;color:#EF4444;font-weight:600;margin-top:4px;">Shortfall: ${formatINR(p.shortfall2031)}</div>` : `<div style="font-size:11px;color:#10B981;font-weight:600;margin-top:4px;">✅ Covered</div>`}
            </div>
        `;
    }).join('');

    // Recommendations
    const recEl = document.getElementById('vuln-recommendations');
    const typeIcons = { health: 'fa-heart', life: 'fa-user-shield', accident: 'fa-car-burst', critical_illness: 'fa-disease', home: 'fa-house-chimney' };
    recEl.innerHTML = data.recommendations.map(r => `
        <div class="ig-rec ${r.priority}">
            <div class="ig-rec-icon"><i class="fas ${typeIcons[r.type] || 'fa-lightbulb'}"></i></div>
            <div class="ig-rec-content">
                <div class="ig-rec-title">${r.title}</div>
                <div class="ig-rec-detail">${r.detail}</div>
                <div class="ig-rec-action">💡 ${r.action}</div>
            </div>
        </div>
    `).join('');

    animateWeightBars();
}

// =====================================================================
// 2.3 TCO SIMULATOR
// =====================================================================
let tcoChartInstance = null;

async function simulateTCO() {
    const btn = document.getElementById('btn-tco');
    const loading = document.getElementById('tco-loading');
    const results = document.getElementById('tco-results');

    btn.disabled = true;
    loading.classList.add('active');
    results.classList.remove('active');

    const regNumber = document.getElementById('tco-regNumber').value.trim();
    const payload = {
        registrationNumber: regNumber || undefined,
        make: document.getElementById('tco-make').value || undefined,
        model: document.getElementById('tco-model').value || undefined,
        year: document.getElementById('tco-year').value || undefined,
        ncbYears: parseInt(document.getElementById('tco-ncb').value) || 0,
        switchEvery: parseInt(document.getElementById('tco-switch').value) || 0
    };

    try {
        const res = await fetch(`${API_BASE}/api/tco-simulator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderTCOResults(data);
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
        loading.classList.remove('active');
    }
}

function renderTCOResults(data) {
    const results = document.getElementById('tco-results');
    results.classList.add('active');

    const s = data.summary;

    // Summary stats
    const summaryEl = document.getElementById('tco-summary');
    summaryEl.innerHTML = `
        <div class="ig-tco-stat">
            <div class="ig-tco-stat-value">${formatINRFull(s.loyaltyTotalCost)}</div>
            <div class="ig-tco-stat-label">5-Year Loyal Cost</div>
        </div>
        <div class="ig-tco-stat savings">
            <div class="ig-tco-stat-value">${formatINRFull(s.switcherTotalCost)}</div>
            <div class="ig-tco-stat-label">5-Year Switcher Cost</div>
        </div>
        <div class="ig-tco-stat ${s.totalSavingsFromSwitching > 0 ? 'savings' : ''}">
            <div class="ig-tco-stat-value">${s.totalSavingsFromSwitching > 0 ? '+' : ''}${formatINRFull(Math.abs(s.totalSavingsFromSwitching))}</div>
            <div class="ig-tco-stat-label">${s.totalSavingsFromSwitching > 0 ? 'Savings by Switching' : 'Loyalty Advantage'}</div>
        </div>
        <div class="ig-tco-stat warning">
            <div class="ig-tco-stat-value">${s.assetDepreciation}%</div>
            <div class="ig-tco-stat-label">Asset Depreciation</div>
        </div>
    `;

    // NCB Trap Alert
    const alertEl = document.getElementById('tco-ncb-alert');
    alertEl.innerHTML = `
        <div class="ig-alert ${s.ncbTrapDetected ? 'warning' : 'success'}">
            <i class="fas fa-${s.ncbTrapDetected ? 'exclamation-triangle' : 'check-circle'}"></i>
            <div>
                <strong>${s.ncbTrapDetected ? 'NCB Trap Detected!' : 'No NCB Trap'}</strong><br>
                ${s.ncbTrapExplanation}
                ${s.recommendation ? `<br><strong>${s.recommendation}</strong>` : ''}
            </div>
        </div>
    `;

    // Chart
    renderTCOChart(data);

    // Year-by-Year Table
    const tableEl = document.getElementById('tco-table');
    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Year</th>
                <th>Vehicle Age</th>
                <th>IDV (Asset Value)</th>
                <th>TP Premium</th>
                <th>OD Premium</th>
                <th>Loyal Total</th>
                <th>Switcher Total</th>
                <th>You Save</th>
            </tr>
        </thead>
        <tbody>
            ${data.projection.map(yr => `
                <tr>
                    <td><strong>${yr.year}</strong></td>
                    <td>${yr.vehicleAge} yrs</td>
                    <td>${formatINRFull(yr.idv)}</td>
                    <td>${formatINRFull(yr.tpPremium)}</td>
                    <td>${formatINRFull(yr.rawODPremium)}</td>
                    <td>${formatINRFull(yr.loyalty.total)} <span style="font-size:10px;color:#64748B;">(NCB ${yr.loyalty.ncbDiscount}%${yr.loyalty.loyaltyPenaltyPercent > 0 ? `, <span class="penalty-cell">+${yr.loyalty.loyaltyPenaltyPercent}% penalty</span>` : ''})</span></td>
                    <td>${formatINRFull(yr.switcher.total)} ${yr.switcher.isSwitchYear ? '<span style="font-size:10px;color:#6366F1;font-weight:700;">🔄 SWITCH</span>' : ''}</td>
                    <td class="${yr.savings > 0 ? 'savings-cell' : ''}">${yr.savings > 0 ? '+' + formatINRFull(yr.savings) : formatINRFull(yr.savings)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function renderTCOChart(data) {
    const ctx = document.getElementById('tco-chart');
    if (!ctx) return;

    if (tcoChartInstance) {
        tcoChartInstance.destroy();
    }

    const years = data.projection.map(d => d.year);
    const loyaltyData = data.projection.map(d => d.loyalty.total);
    const switcherData = data.projection.map(d => d.switcher.total);
    const idvData = data.projection.map(d => d.idv);

    // Cumulative
    const loyaltyCum = [];
    const switcherCum = [];
    loyaltyData.reduce((acc, v, i) => { loyaltyCum.push(acc + v); return acc + v; }, 0);
    switcherData.reduce((acc, v, i) => { switcherCum.push(acc + v); return acc + v; }, 0);

    tcoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Loyal Customer (Cumulative)',
                    data: loyaltyCum,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#EF4444'
                },
                {
                    label: 'Smart Switcher (Cumulative)',
                    data: switcherCum,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#10B981'
                },
                {
                    label: 'Asset Value (IDV)',
                    data: idvData,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99,102,241,0.05)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 4,
                    pointBackgroundColor: '#6366F1',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 27, 75, 0.95)',
                    titleFont: { size: 13, family: 'Plus Jakarta Sans', weight: '700' },
                    bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
                    padding: 14,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(ctx) {
                            return `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Premium (₹)',
                        font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' }
                    },
                    ticks: {
                        callback: v => '₹' + (v / 1000).toFixed(0) + 'K',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Asset Value (₹)',
                        font: { size: 12, family: 'Plus Jakarta Sans', weight: '600' }
                    },
                    ticks: {
                        callback: v => '₹' + (v / 1000).toFixed(0) + 'K',
                        font: { size: 11 }
                    },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { font: { size: 12, weight: '600' } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.key === '1' && e.altKey) switchTab('claim');
    if (e.key === '2' && e.altKey) switchTab('vulnerability');
    if (e.key === '3' && e.altKey) switchTab('tco');
});
