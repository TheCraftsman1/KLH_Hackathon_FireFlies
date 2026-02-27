// ===== NEGOTIATION PAGE LOGIC =====

const API_BASE = '';
let currentSessionId = null;
let negotiationData = null;

// DOM elements
const regInput = document.getElementById('regInput');
const btnStart = document.getElementById('btnStartNegotiate');
const vehicleCardSection = document.getElementById('vehicleCardSection');
const vehicleCard = document.getElementById('vehicleCard');
const negotiationArena = document.getElementById('negotiationArena');
const savingsAmount = document.getElementById('savingsAmount');
const roundsContainer = document.getElementById('roundsContainer');
const overlay = document.getElementById('negotiatingOverlay');
const statusText = document.getElementById('negotiateStatusText');
const acceptedBanner = document.getElementById('acceptedBanner');

// Event listeners
btnStart.addEventListener('click', startNegotiation);
regInput.addEventListener('keydown', e => { if (e.key === 'Enter') startNegotiation(); });

// Demo vehicle buttons
document.querySelectorAll('.neg-demo-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        regInput.value = btn.dataset.reg;
        startNegotiation();
    });
});

// Format currency
function fmt(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
}

// ===== MAIN FLOW =====
async function startNegotiation() {
    const reg = regInput.value.trim().replace(/\s/g, '').toUpperCase();
    if (!reg || reg.length < 6) {
        regInput.style.borderColor = '#ef5350';
        regInput.focus();
        setTimeout(() => regInput.style.borderColor = '', 2000);
        return;
    }

    // Reset UI
    resetUI();
    showOverlay('Looking up vehicle ' + reg + '...');
    btnStart.disabled = true;

    try {
        // Step 1: Start negotiation session
        updateStatus('Starting negotiation session...');
        const startRes = await fetch(API_BASE + '/api/negotiate/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationNumber: reg })
        });
        const startData = await startRes.json();

        if (!startData.success) {
            throw new Error(startData.error || 'Failed to start negotiation');
        }

        currentSessionId = startData.sessionId;
        renderVehicleCard(startData.vehicle);

        // Step 2: Run auto-negotiation
        updateStatus('AI agent is negotiating with 6 insurers...');
        const simRes = await fetch(API_BASE + '/api/negotiate/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        const simData = await simRes.json();

        if (!simData.success) {
            throw new Error('Negotiation simulation failed');
        }

        negotiationData = simData;
        hideOverlay();

        // Step 3: Progressively reveal rounds
        await revealRounds(simData);

    } catch (err) {
        hideOverlay();
        alert('Error: ' + err.message);
        console.error(err);
    } finally {
        btnStart.disabled = false;
    }
}

function resetUI() {
    vehicleCardSection.classList.remove('active');
    negotiationArena.classList.remove('active');
    roundsContainer.innerHTML = '';
    savingsAmount.textContent = '₹0';
    acceptedBanner.classList.remove('active');
    // Reset stepper
    for (let i = 1; i <= 3; i++) {
        document.getElementById('step' + i).className = 'neg-step-circle';
    }
    document.getElementById('line1').className = 'neg-step-line';
    document.getElementById('line2').className = 'neg-step-line';
}

function showOverlay(msg) {
    overlay.classList.add('active');
    if (msg) statusText.textContent = msg;
}

function hideOverlay() {
    overlay.classList.remove('active');
}

function updateStatus(msg) {
    statusText.textContent = msg;
}

// ===== RENDER VEHICLE CARD =====
function renderVehicleCard(v) {
    const icon = v.type === '4W' || v.type === 'Car' ? 'fa-car' : v.fuel === 'Electric' ? 'fa-bolt' : 'fa-motorcycle';
    vehicleCard.innerHTML = `
        <div class="vc-main">
            <div class="vc-icon"><i class="fas ${icon}"></i></div>
            <div class="vc-info">
                <h3>${v.make} ${v.model}</h3>
                <p class="reg-num">${v.formattedRegNumber || v.registrationNumber}</p>
                <p>${v.year} • ${v.cc}cc • ${v.fuel || 'Petrol'} • ${v.segment || v.type}</p>
            </div>
        </div>
        <div class="vc-stats">
            <div class="vc-stat"><span class="label">IDV</span><span class="value">${fmt(v.idv)}</span></div>
            <div class="vc-stat"><span class="label">Age</span><span class="value">${v.vehicleAge} yr</span></div>
            <div class="vc-stat"><span class="label">RTO</span><span class="value">${v.rtoCode}</span></div>
            <div class="vc-stat"><span class="label">State</span><span class="value">${v.state}</span></div>
        </div>
    `;
    vehicleCardSection.classList.add('active');
}

// ===== PROGRESSIVE ROUND REVEAL =====
async function revealRounds(simData) {
    negotiationArena.classList.add('active');

    const rounds = simData.rounds;
    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        const roundNum = i + 1;

        // Activate stepper
        document.getElementById('step' + roundNum).classList.add('active');
        if (i > 0) {
            document.getElementById('step' + i).classList.remove('active');
            document.getElementById('step' + i).classList.add('done');
            document.getElementById('line' + i).classList.add('done');
        }

        // Wait for dramatic effect
        await sleep(roundNum === 1 ? 800 : 1500);

        // Render AI mediator commentary
        const mediatorHTML = `
            <div class="neg-mediator">
                <div class="neg-mediator-avatar"><i class="fas fa-robot"></i></div>
                <div class="neg-mediator-body">
                    <h4>AI Mediator — Round ${roundNum}</h4>
                    <p>${round.aiCommentary}</p>
                </div>
            </div>
        `;
        roundsContainer.insertAdjacentHTML('beforeend', mediatorHTML);

        await sleep(600);

        // Render offers grid
        const offersHTML = round.offers.map((offer, idx) => `
            <div class="neg-offer-card ${idx === 0 ? 'best' : ''}">
                ${idx === 0 ? '<div class="neg-offer-best-tag">BEST DEAL</div>' : ''}
                <div class="neg-offer-header">
                    <img src="${offer.logo}" alt="${offer.insurerName}" class="neg-offer-logo" onerror="this.style.display='none'">
                    <div>
                        <div class="neg-offer-insurer">${offer.insurerName}</div>
                        <div class="neg-offer-discount"><i class="fas fa-bolt"></i> ${offer.discount}% off</div>
                    </div>
                </div>
                <div class="neg-offer-price-row">
                    <span class="neg-offer-price">${fmt(offer.premium.total)}</span>
                    <span class="neg-offer-original">${fmt(offer.originalTotal)}</span>
                </div>
                <div class="neg-offer-savings">
                    <i class="fas fa-arrow-down"></i> Save ${fmt(offer.savings)} (${offer.savingsPercent}%)
                </div>
                <div class="neg-offer-details">
                    <div class="neg-offer-detail"><span>Own Damage</span><span>${fmt(offer.premium.ownDamage)}</span></div>
                    <div class="neg-offer-detail"><span>Third Party</span><span>${fmt(offer.premium.thirdParty)}</span></div>
                    <div class="neg-offer-detail"><span>GST (18%)</span><span>${fmt(offer.premium.gst)}</span></div>
                </div>
                ${offer.extras.length > 0 ? `
                    <ul class="neg-offer-extras">
                        ${offer.extras.map(e => `<li><i class="fas fa-check-circle"></i> ${e}</li>`).join('')}
                    </ul>
                ` : ''}
                ${roundNum === rounds.length ? `
                    <button class="neg-btn-accept" onclick="acceptOffer('${offer.insurerId}')">
                        <i class="fas fa-shield-halved"></i> Accept ${offer.insurerName}
                    </button>
                ` : ''}
            </div>
        `).join('');

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'neg-offers-grid';
        gridWrapper.innerHTML = offersHTML;
        roundsContainer.appendChild(gridWrapper);

        // Update savings meter (best offer of this round)
        const bestOffer = round.offers[0];
        animateSavings(bestOffer.savings);

        // Scroll to the latest content
        roundsContainer.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await sleep(400);
    }

    // Final: mark last step done
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step3').classList.add('done');
    document.getElementById('line2').classList.add('done');
}

// Animate savings counter
function animateSavings(target) {
    const el = savingsAmount;
    const current = parseInt(el.textContent.replace(/[₹,]/g, '')) || 0;
    const diff = target - current;
    const steps = 30;
    const increment = diff / steps;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        const val = Math.round(current + increment * step);
        el.textContent = fmt(val);
        if (step >= steps) {
            clearInterval(timer);
            el.textContent = fmt(target);
        }
    }, 30);
}

// Accept offer
async function acceptOffer(insurerId) {
    if (!currentSessionId) return;

    try {
        const res = await fetch(API_BASE + '/api/negotiate/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId, insurerId })
        });
        const data = await res.json();

        if (data.success) {
            // Show accepted banner
            document.getElementById('acceptedTitle').textContent = `🎉 Policy with ${data.offer.insurerName} Accepted!`;
            document.getElementById('acceptedDetails').innerHTML = `
                You saved <strong>${fmt(data.offer.savings)}</strong> (${data.offer.savingsPercent}% off)
                on your ${data.vehicle.make} ${data.vehicle.model} insurance renewal.<br>
                Final premium: <strong>${fmt(data.offer.premium.total)}</strong> (was ${fmt(data.offer.originalTotal)})
            `;
            document.getElementById('policyNumber').textContent = data.policyNumber;
            acceptedBanner.classList.add('active');
            acceptedBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Disable all accept buttons
            document.querySelectorAll('.neg-btn-accept').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
        }
    } catch (err) {
        alert('Error accepting offer: ' + err.message);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
