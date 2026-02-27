// ===== Insurix.India - All Calculators =====

(function () {
    'use strict';

    var modal = document.getElementById('calculatorModal');
    var content = document.getElementById('calcModalContent');
    var closeBtn = document.getElementById('calcModalClose');

    // ===== OPEN / CLOSE =====
    function openCalc(type) {
        var html = calculatorForms[type];
        if (!html) return;
        content.innerHTML = html;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Attach form handler
        var form = content.querySelector('form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                calculatorLogic[type]();
            });
        }
    }

    function closeCalc() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        content.innerHTML = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeCalc);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeCalc(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('active')) closeCalc(); });

    // Attach click handlers to all calculator links
    document.querySelectorAll('[data-calculator]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openCalc(this.getAttribute('data-calculator'));
        });
    });

    // ===== FORM TEMPLATES =====
    var calculatorForms = {};

    // ---------- Health & Wellness ----------

    calculatorForms['bmi'] = '\
    <h2><i class="fas fa-weight-scale" style="color:#a855f7"></i> BMI Calculator</h2>\
    <p class="calc-desc">Calculate your Body Mass Index to understand your weight category.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Weight (kg)</label><input type="number" id="cWeight" min="1" max="300" step="0.1" required placeholder="e.g. 70"></div>\
            <div class="calc-field"><label>Height (cm)</label><input type="number" id="cHeight" min="50" max="250" step="0.1" required placeholder="e.g. 170"></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate BMI</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['ideal-weight'] = '\
    <h2><i class="fas fa-person-running" style="color:#a855f7"></i> Ideal Weight Calculator</h2>\
    <p class="calc-desc">Find your ideal body weight based on height and gender.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Gender</label><select id="cGender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>\
            <div class="calc-field"><label>Height (cm)</label><input type="number" id="cHeight" min="50" max="250" step="0.1" required placeholder="e.g. 170"></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Ideal Weight</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['calorie'] = '\
    <h2><i class="fas fa-fire-flame-curved" style="color:#f97316"></i> Calorie Calculator</h2>\
    <p class="calc-desc">Estimate your daily calorie needs based on your activity level.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Gender</label><select id="cGender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>\
            <div class="calc-field"><label>Age (years)</label><input type="number" id="cAge" min="1" max="120" required placeholder="e.g. 30"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Weight (kg)</label><input type="number" id="cWeight" min="1" max="300" step="0.1" required placeholder="e.g. 70"></div>\
            <div class="calc-field"><label>Height (cm)</label><input type="number" id="cHeight" min="50" max="250" step="0.1" required placeholder="e.g. 170"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field full-width"><label>Activity Level</label>\
                <select id="cActivity" required>\
                    <option value="">Select</option>\
                    <option value="1.2">Sedentary (little or no exercise)</option>\
                    <option value="1.375">Lightly active (1-3 days/week)</option>\
                    <option value="1.55">Moderately active (3-5 days/week)</option>\
                    <option value="1.725">Very active (6-7 days/week)</option>\
                    <option value="1.9">Super active (athlete)</option>\
                </select>\
            </div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Calories</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['body-fat'] = '\
    <h2><i class="fas fa-heart-pulse" style="color:#ef4444"></i> Body Fat Calculator</h2>\
    <p class="calc-desc">Estimate your body fat percentage using the U.S. Navy method.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Gender</label><select id="cGender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>\
            <div class="calc-field"><label>Height (cm)</label><input type="number" id="cHeight" min="50" max="250" step="0.1" required placeholder="e.g. 170"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Waist (cm)</label><input type="number" id="cWaist" min="30" max="200" step="0.1" required placeholder="at navel"></div>\
            <div class="calc-field"><label>Neck (cm)</label><input type="number" id="cNeck" min="20" max="80" step="0.1" required placeholder="below larynx"></div>\
        </div>\
        <div class="calc-form-row" id="hipRow" style="display:none">\
            <div class="calc-field full-width"><label>Hip (cm) — required for females</label><input type="number" id="cHip" min="40" max="200" step="0.1" placeholder="at widest point"></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Body Fat</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    // ---------- Term Insurance ----------

    calculatorForms['life-insurance'] = '\
    <h2><i class="fas fa-shield-halved" style="color:#6366f1"></i> Life Insurance Calculator</h2>\
    <p class="calc-desc">Estimate the life insurance coverage your family needs.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Annual Income (₹)</label><input type="number" id="cIncome" min="0" required placeholder="e.g. 800000"></div>\
            <div class="calc-field"><label>Current Age</label><input type="number" id="cAge" min="18" max="65" required placeholder="e.g. 30"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Retirement Age</label><input type="number" id="cRetAge" min="40" max="70" required placeholder="e.g. 60"></div>\
            <div class="calc-field"><label>Existing Life Cover (₹)</label><input type="number" id="cExisting" min="0" value="0" placeholder="e.g. 0"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Outstanding Loans (₹)</label><input type="number" id="cLoans" min="0" value="0" placeholder="e.g. 500000"></div>\
            <div class="calc-field"><label>Annual Expenses (₹)</label><input type="number" id="cExpenses" min="0" required placeholder="e.g. 400000"></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Coverage</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['term-insurance'] = '\
    <h2><i class="fas fa-file-shield" style="color:#6366f1"></i> Term Insurance Calculator</h2>\
    <p class="calc-desc">Estimate your term insurance premium based on your profile.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Age</label><input type="number" id="cAge" min="18" max="65" required placeholder="e.g. 30"></div>\
            <div class="calc-field"><label>Gender</label><select id="cGender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Cover Amount (₹ Lakhs)</label><input type="number" id="cCover" min="10" max="500" required placeholder="e.g. 100"></div>\
            <div class="calc-field"><label>Policy Term (years)</label><input type="number" id="cTerm" min="5" max="40" required placeholder="e.g. 30"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Tobacco User?</label><select id="cTobacco" required><option value="no">No</option><option value="yes">Yes</option></select></div>\
            <div class="calc-field"><label>Payment Frequency</label><select id="cFreq" required><option value="yearly">Yearly</option><option value="monthly">Monthly</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['human-life-value'] = '\
    <h2><i class="fas fa-user-shield" style="color:#6366f1"></i> Human Life Value Calculator</h2>\
    <p class="calc-desc">Determine the economic value of your life to plan adequate insurance.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Current Age</label><input type="number" id="cAge" min="18" max="65" required placeholder="e.g. 30"></div>\
            <div class="calc-field"><label>Retirement Age</label><input type="number" id="cRetAge" min="40" max="70" required placeholder="e.g. 60"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Annual Income (₹)</label><input type="number" id="cIncome" min="0" required placeholder="e.g. 800000"></div>\
            <div class="calc-field"><label>Annual Expenses (₹)</label><input type="number" id="cExpenses" min="0" required placeholder="e.g. 400000"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Expected Income Growth (%)</label><input type="number" id="cGrowth" min="0" max="20" step="0.5" value="5" placeholder="e.g. 5"></div>\
            <div class="calc-field"><label>Discount Rate / Inflation (%)</label><input type="number" id="cDiscount" min="0" max="15" step="0.5" value="6" placeholder="e.g. 6"></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate HLV</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['nri-term'] = '\
    <h2><i class="fas fa-globe" style="color:#6366f1"></i> NRI Term Insurance Calculator</h2>\
    <p class="calc-desc">Estimate term insurance premium for NRIs with currency conversion.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Age</label><input type="number" id="cAge" min="18" max="65" required placeholder="e.g. 35"></div>\
            <div class="calc-field"><label>Gender</label><select id="cGender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Cover Amount (₹ Lakhs)</label><input type="number" id="cCover" min="25" max="500" required placeholder="e.g. 100"></div>\
            <div class="calc-field"><label>Policy Term (years)</label><input type="number" id="cTerm" min="5" max="40" required placeholder="e.g. 30"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Country of Residence</label>\
                <select id="cCountry" required>\
                    <option value="">Select</option>\
                    <option value="US">United States</option>\
                    <option value="UK">United Kingdom</option>\
                    <option value="UAE">UAE</option>\
                    <option value="SG">Singapore</option>\
                    <option value="AU">Australia</option>\
                    <option value="CA">Canada</option>\
                </select>\
            </div>\
            <div class="calc-field"><label>Tobacco User?</label><select id="cTobacco" required><option value="no">No</option><option value="yes">Yes</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate NRI Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    // ---------- Policy Premium ----------

    calculatorForms['health-premium'] = '\
    <h2><i class="fas fa-hospital" style="color:#0d9488"></i> Health Insurance Premium</h2>\
    <p class="calc-desc">Estimate your health insurance premium based on your profile.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Your Age</label><input type="number" id="cAge" min="18" max="80" required placeholder="e.g. 30"></div>\
            <div class="calc-field"><label>Number of Members</label><select id="cMembers" required><option value="1">Self</option><option value="2">Self + Spouse</option><option value="3">Family of 3</option><option value="4">Family of 4</option><option value="5">Family of 5+</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Sum Insured (₹ Lakhs)</label><select id="cSum" required><option value="3">3 Lakhs</option><option value="5">5 Lakhs</option><option value="10" selected>10 Lakhs</option><option value="15">15 Lakhs</option><option value="25">25 Lakhs</option><option value="50">50 Lakhs</option><option value="100">1 Crore</option></select></div>\
            <div class="calc-field"><label>City Tier</label><select id="cCity" required><option value="metro">Metro (Delhi, Mumbai…)</option><option value="tier1">Tier 1</option><option value="tier2">Tier 2 & below</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Pre-existing Conditions?</label><select id="cPre" required><option value="no">No</option><option value="yes">Yes</option></select></div>\
            <div class="calc-field"><label>Tobacco User?</label><select id="cTobacco" required><option value="no">No</option><option value="yes">Yes</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Estimate Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['car-insurance'] = '\
    <h2><i class="fas fa-car" style="color:#0d9488"></i> Car Insurance Calculator</h2>\
    <p class="calc-desc">Get an indicative car insurance premium based on your vehicle details.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Car Brand</label>\
                <select id="cBrand" required><option value="">Select</option><option>Maruti Suzuki</option><option>Hyundai</option><option>Tata</option><option>Mahindra</option><option>Toyota</option><option>Honda</option><option>Kia</option><option>MG</option><option>Volkswagen</option><option>BMW</option><option>Mercedes</option><option>Audi</option></select>\
            </div>\
            <div class="calc-field"><label>Fuel Type</label><select id="cFuel" required><option value="">Select</option><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="cng">CNG / LPG</option><option value="electric">Electric</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Car Value (IDV) ₹</label><input type="number" id="cIDV" min="50000" max="10000000" required placeholder="e.g. 600000"></div>\
            <div class="calc-field"><label>Registration Year</label><input type="number" id="cYear" min="2000" max="2026" required placeholder="e.g. 2022"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>City</label><select id="cCity" required><option value="metro">Metro</option><option value="tier1">Tier 1</option><option value="tier2">Tier 2 & below</option></select></div>\
            <div class="calc-field"><label>Policy Type</label><select id="cType" required><option value="comprehensive">Comprehensive</option><option value="tp">Third-Party Only</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['bike-insurance'] = '\
    <h2><i class="fas fa-motorcycle" style="color:#0d9488"></i> Bike Insurance Calculator</h2>\
    <p class="calc-desc">Estimate your two-wheeler insurance premium quickly.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Bike Brand</label>\
                <select id="cBrand" required><option value="">Select</option><option>Hero</option><option>Honda</option><option>Bajaj</option><option>TVS</option><option>Royal Enfield</option><option>Yamaha</option><option>Suzuki</option><option>KTM</option><option>Ola Electric</option><option>Ather</option></select>\
            </div>\
            <div class="calc-field"><label>Engine CC</label><select id="cCC" required><option value="">Select</option><option value="75">Up to 75cc</option><option value="150">75-150cc</option><option value="350">150-350cc</option><option value="500">Above 350cc</option></select></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Bike Value (IDV) ₹</label><input type="number" id="cIDV" min="10000" max="500000" required placeholder="e.g. 80000"></div>\
            <div class="calc-field"><label>Registration Year</label><input type="number" id="cYear" min="2000" max="2026" required placeholder="e.g. 2023"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>City</label><select id="cCity" required><option value="metro">Metro</option><option value="tier1">Tier 1</option><option value="tier2">Tier 2 & below</option></select></div>\
            <div class="calc-field"><label>Policy Type</label><select id="cType" required><option value="comprehensive">Comprehensive</option><option value="tp">Third-Party Only</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    calculatorForms['travel-insurance'] = '\
    <h2><i class="fas fa-plane-departure" style="color:#0d9488"></i> Travel Insurance Calculator</h2>\
    <p class="calc-desc">Estimate your travel insurance premium based on trip details.</p>\
    <form id="calcForm">\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Destination</label><select id="cDest" required><option value="">Select</option><option value="asia">Asia</option><option value="europe">Europe</option><option value="usa">USA / Canada</option><option value="australia">Australia / NZ</option><option value="world">Worldwide</option></select></div>\
            <div class="calc-field"><label>Trip Duration (days)</label><input type="number" id="cDays" min="1" max="365" required placeholder="e.g. 10"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Number of Travellers</label><select id="cTravellers" required><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5+</option></select></div>\
            <div class="calc-field"><label>Your Age</label><input type="number" id="cAge" min="1" max="80" required placeholder="e.g. 30"></div>\
        </div>\
        <div class="calc-form-row">\
            <div class="calc-field"><label>Cover Amount (USD)</label><select id="cCoverUSD" required><option value="25000">$25,000</option><option value="50000" selected>$50,000</option><option value="100000">$100,000</option><option value="250000">$250,000</option><option value="500000">$500,000</option></select></div>\
            <div class="calc-field"><label>Trip Type</label><select id="cTrip" required><option value="leisure">Leisure</option><option value="business">Business</option><option value="student">Student</option></select></div>\
        </div>\
        <button type="submit" class="calc-submit-btn">Calculate Premium</button>\
    </form>\
    <div id="calcResult" class="calc-result"></div>';

    // ===== CALCULATION LOGIC =====
    var calculatorLogic = {};

    // Helper: format Indian currency
    function formatINR(num) {
        num = Math.round(num);
        var s = num.toString();
        var afterPoint = '';
        if (s.indexOf('.') > 0) {
            afterPoint = s.substring(s.indexOf('.'), s.length);
        }
        s = s.split('.')[0];
        var lastThree = s.substring(s.length - 3);
        var otherNumbers = s.substring(0, s.length - 3);
        if (otherNumbers !== '') lastThree = ',' + lastThree;
        return '₹' + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + afterPoint;
    }

    function showResult(html) {
        document.getElementById('calcResult').innerHTML = html;
        document.getElementById('calcResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---------- BMI Calculator ----------
    calculatorLogic['bmi'] = function () {
        var w = parseFloat(document.getElementById('cWeight').value);
        var h = parseFloat(document.getElementById('cHeight').value) / 100;
        var bmi = w / (h * h);
        var category, color, icon;
        if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; icon = 'fa-arrow-down'; }
        else if (bmi < 25) { category = 'Normal Weight'; color = '#22c55e'; icon = 'fa-check-circle'; }
        else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; icon = 'fa-exclamation-triangle'; }
        else { category = 'Obese'; color = '#ef4444'; icon = 'fa-exclamation-circle'; }

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:' + color + '">' + bmi.toFixed(1) + '</div>\
                <div class="calc-result-label"><i class="fas ' + icon + '" style="color:' + color + '"></i> ' + category + '</div>\
                <div class="calc-result-bar"><div class="bmi-bar"><div class="bmi-marker" style="left:' + Math.min((bmi / 40) * 100, 100) + '%"></div></div></div>\
                <div class="calc-result-range">Underweight &lt;18.5 &nbsp;|&nbsp; Normal 18.5-24.9 &nbsp;|&nbsp; Overweight 25-29.9 &nbsp;|&nbsp; Obese ≥30</div>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Maintaining a healthy BMI can reduce your health insurance premiums by up to 15%.</p>\
            </div>');
    };

    // ---------- Ideal Weight ----------
    calculatorLogic['ideal-weight'] = function () {
        var g = document.getElementById('cGender').value;
        var h = parseFloat(document.getElementById('cHeight').value);
        var hInch = h / 2.54;
        var over60 = hInch - 60;
        // Devine formula
        var devine, robinson, miller;
        if (g === 'male') {
            devine = 50 + 2.3 * over60;
            robinson = 52 + 1.9 * over60;
            miller = 56.2 + 1.41 * over60;
        } else {
            devine = 45.5 + 2.3 * over60;
            robinson = 49 + 1.7 * over60;
            miller = 53.1 + 1.36 * over60;
        }
        var avg = (devine + robinson + miller) / 3;
        var low = Math.min(devine, robinson, miller);
        var high = Math.max(devine, robinson, miller);

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#22c55e">' + avg.toFixed(1) + ' kg</div>\
                <div class="calc-result-label">Ideal Weight Range: ' + low.toFixed(1) + ' – ' + high.toFixed(1) + ' kg</div>\
                <table class="calc-result-table">\
                    <tr><th>Formula</th><th>Weight (kg)</th></tr>\
                    <tr><td>Devine</td><td>' + devine.toFixed(1) + '</td></tr>\
                    <tr><td>Robinson</td><td>' + robinson.toFixed(1) + '</td></tr>\
                    <tr><td>Miller</td><td>' + miller.toFixed(1) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Ideal weight can vary based on body composition, muscle mass, and bone structure.</p>\
            </div>');
    };

    // ---------- Calorie Calculator ----------
    calculatorLogic['calorie'] = function () {
        var g = document.getElementById('cGender').value;
        var age = parseInt(document.getElementById('cAge').value);
        var w = parseFloat(document.getElementById('cWeight').value);
        var h = parseFloat(document.getElementById('cHeight').value);
        var act = parseFloat(document.getElementById('cActivity').value);
        // Mifflin-St Jeor
        var bmr;
        if (g === 'male') {
            bmr = 10 * w + 6.25 * h - 5 * age + 5;
        } else {
            bmr = 10 * w + 6.25 * h - 5 * age - 161;
        }
        var tdee = bmr * act;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#f97316">' + Math.round(tdee) + '</div>\
                <div class="calc-result-label">calories/day to maintain weight</div>\
                <table class="calc-result-table">\
                    <tr><th>Goal</th><th>Calories/Day</th></tr>\
                    <tr><td>🔻 Lose 0.5 kg/week</td><td>' + Math.round(tdee - 500) + '</td></tr>\
                    <tr><td>⚖️ Maintain Weight</td><td>' + Math.round(tdee) + '</td></tr>\
                    <tr><td>🔺 Gain 0.5 kg/week</td><td>' + Math.round(tdee + 500) + '</td></tr>\
                </table>\
                <div class="calc-result-small">BMR (Basal Metabolic Rate): ' + Math.round(bmr) + ' cal/day</div>\
                <p class="calc-tip">💡 <strong>Tip:</strong> A healthy weight improves your insurance risk profile. Stay active!</p>\
            </div>');
    };

    // ---------- Body Fat Calculator ----------
    calculatorLogic['body-fat'] = function () {
        var g = document.getElementById('cGender').value;
        var h = parseFloat(document.getElementById('cHeight').value);
        var waist = parseFloat(document.getElementById('cWaist').value);
        var neck = parseFloat(document.getElementById('cNeck').value);
        var bf;
        // US Navy method
        if (g === 'male') {
            bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
        } else {
            var hip = parseFloat(document.getElementById('cHip').value);
            if (!hip || isNaN(hip)) { showResult('<div class="calc-result-card"><p style="color:#ef4444">Please enter hip measurement for females.</p></div>'); return; }
            bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
        }
        var category, color;
        if (g === 'male') {
            if (bf < 6) { category = 'Essential Fat'; color = '#3b82f6'; }
            else if (bf < 14) { category = 'Athletic'; color = '#22c55e'; }
            else if (bf < 18) { category = 'Fitness'; color = '#22c55e'; }
            else if (bf < 25) { category = 'Average'; color = '#f59e0b'; }
            else { category = 'Above Average'; color = '#ef4444'; }
        } else {
            if (bf < 14) { category = 'Essential Fat'; color = '#3b82f6'; }
            else if (bf < 21) { category = 'Athletic'; color = '#22c55e'; }
            else if (bf < 25) { category = 'Fitness'; color = '#22c55e'; }
            else if (bf < 32) { category = 'Average'; color = '#f59e0b'; }
            else { category = 'Above Average'; color = '#ef4444'; }
        }

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:' + color + '">' + bf.toFixed(1) + '%</div>\
                <div class="calc-result-label"><i class="fas fa-circle" style="color:' + color + ';font-size:10px"></i> ' + category + '</div>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Lower body fat can mean better health outcomes and potentially lower insurance costs.</p>\
            </div>');
    };

    // ---------- Life Insurance Calculator ----------
    calculatorLogic['life-insurance'] = function () {
        var income = parseFloat(document.getElementById('cIncome').value);
        var age = parseInt(document.getElementById('cAge').value);
        var retAge = parseInt(document.getElementById('cRetAge').value);
        var existing = parseFloat(document.getElementById('cExisting').value) || 0;
        var loans = parseFloat(document.getElementById('cLoans').value) || 0;
        var expenses = parseFloat(document.getElementById('cExpenses').value);
        var years = retAge - age;
        // Income replacement + loans + expenses buffer - existing cover
        var needed = (income * years) + loans + (expenses * 5) - existing;
        if (needed < 0) needed = 0;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#6366f1">' + formatINR(needed) + '</div>\
                <div class="calc-result-label">Recommended Life Insurance Cover</div>\
                <table class="calc-result-table">\
                    <tr><td>Income Replacement (' + years + ' yrs)</td><td>' + formatINR(income * years) + '</td></tr>\
                    <tr><td>Outstanding Loans</td><td>' + formatINR(loans) + '</td></tr>\
                    <tr><td>Expenses Buffer (5 yrs)</td><td>' + formatINR(expenses * 5) + '</td></tr>\
                    <tr><td>Less: Existing Cover</td><td>−' + formatINR(existing) + '</td></tr>\
                    <tr style="font-weight:700"><td>Total Cover Needed</td><td>' + formatINR(needed) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Experts recommend life cover of at least 10-15x your annual income.</p>\
            </div>');
    };

    // ---------- Term Insurance Calculator ----------
    calculatorLogic['term-insurance'] = function () {
        var age = parseInt(document.getElementById('cAge').value);
        var gender = document.getElementById('cGender').value;
        var cover = parseFloat(document.getElementById('cCover').value); // in lakhs
        var term = parseInt(document.getElementById('cTerm').value);
        var tobacco = document.getElementById('cTobacco').value;
        var freq = document.getElementById('cFreq').value;

        // Base rate per lakh per year (simplified estimation)
        var baseRate = 8 + (age - 18) * 0.8; // increases with age
        if (gender === 'female') baseRate *= 0.85; // women get lower rates
        if (tobacco === 'yes') baseRate *= 1.75;
        if (term > 25) baseRate *= 1.1;

        var annualPremium = baseRate * cover;
        var gst = annualPremium * 0.18;
        var totalAnnual = annualPremium + gst;
        var display = freq === 'monthly' ? totalAnnual / 12 : totalAnnual;
        var label = freq === 'monthly' ? '/month' : '/year';

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#6366f1">' + formatINR(display) + label + '</div>\
                <div class="calc-result-label">Estimated Term Insurance Premium</div>\
                <table class="calc-result-table">\
                    <tr><td>Cover Amount</td><td>' + formatINR(cover * 100000) + '</td></tr>\
                    <tr><td>Policy Term</td><td>' + term + ' years</td></tr>\
                    <tr><td>Base Premium</td><td>' + formatINR(annualPremium) + '/yr</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '/yr</td></tr>\
                    <tr style="font-weight:700"><td>Total Premium</td><td>' + formatINR(totalAnnual) + '/yr</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Buying term insurance early locks in lower premiums. Non-tobacco users save up to 40%.</p>\
            </div>');
    };

    // ---------- Human Life Value ----------
    calculatorLogic['human-life-value'] = function () {
        var age = parseInt(document.getElementById('cAge').value);
        var retAge = parseInt(document.getElementById('cRetAge').value);
        var income = parseFloat(document.getElementById('cIncome').value);
        var expenses = parseFloat(document.getElementById('cExpenses').value);
        var growth = parseFloat(document.getElementById('cGrowth').value) / 100;
        var discount = parseFloat(document.getElementById('cDiscount').value) / 100;
        var years = retAge - age;
        var surplus = income - expenses;
        // Present value of future surplus
        var hlv = 0;
        for (var i = 1; i <= years; i++) {
            hlv += surplus * Math.pow(1 + growth, i) / Math.pow(1 + discount, i);
        }
        if (hlv < 0) hlv = 0;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#6366f1">' + formatINR(hlv) + '</div>\
                <div class="calc-result-label">Your Human Life Value</div>\
                <table class="calc-result-table">\
                    <tr><td>Working Years Remaining</td><td>' + years + '</td></tr>\
                    <tr><td>Annual Surplus (Income − Expenses)</td><td>' + formatINR(surplus) + '</td></tr>\
                    <tr><td>Growth Rate</td><td>' + (growth * 100).toFixed(1) + '%</td></tr>\
                    <tr><td>Discount Rate</td><td>' + (discount * 100).toFixed(1) + '%</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Your HLV represents the minimum life cover you should have to protect your family.</p>\
            </div>');
    };

    // ---------- NRI Term Insurance ----------
    calculatorLogic['nri-term'] = function () {
        var age = parseInt(document.getElementById('cAge').value);
        var gender = document.getElementById('cGender').value;
        var cover = parseFloat(document.getElementById('cCover').value);
        var term = parseInt(document.getElementById('cTerm').value);
        var country = document.getElementById('cCountry').value;
        var tobacco = document.getElementById('cTobacco').value;

        var baseRate = 10 + (age - 18) * 0.9;
        if (gender === 'female') baseRate *= 0.85;
        if (tobacco === 'yes') baseRate *= 1.75;
        var countryMult = { US: 1.0, UK: 1.05, UAE: 0.95, SG: 1.0, AU: 1.08, CA: 1.03 };
        baseRate *= (countryMult[country] || 1.0);
        // NRI surcharge ~15%
        baseRate *= 1.15;

        var annualPremium = baseRate * cover;
        var gst = annualPremium * 0.18;
        var total = annualPremium + gst;
        var usdRate = { US: 83, UK: 105, UAE: 22.8, SG: 62, AU: 55, CA: 62 };
        var rate = usdRate[country] || 83;
        var localCurrency = { US: 'USD', UK: 'GBP', UAE: 'AED', SG: 'SGD', AU: 'AUD', CA: 'CAD' };
        var cur = localCurrency[country] || 'USD';
        var inLocal = total / rate;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#6366f1">' + formatINR(total) + '/yr</div>\
                <div class="calc-result-label">≈ ' + cur + ' ' + inLocal.toFixed(0) + '/year in local currency</div>\
                <table class="calc-result-table">\
                    <tr><td>Cover Amount</td><td>' + formatINR(cover * 100000) + '</td></tr>\
                    <tr><td>Country</td><td>' + country + '</td></tr>\
                    <tr><td>Base Premium</td><td>' + formatINR(annualPremium) + '/yr</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '/yr</td></tr>\
                    <tr style="font-weight:700"><td>Total Annual Premium</td><td>' + formatINR(total) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> NRI term plans from Indian insurers are often more affordable than foreign policies with similar coverage.</p>\
            </div>');
    };

    // ---------- Health Insurance Premium ----------
    calculatorLogic['health-premium'] = function () {
        var age = parseInt(document.getElementById('cAge').value);
        var members = parseInt(document.getElementById('cMembers').value);
        var sum = parseInt(document.getElementById('cSum').value); // lakhs
        var city = document.getElementById('cCity').value;
        var pre = document.getElementById('cPre').value;
        var tobacco = document.getElementById('cTobacco').value;

        // Base premium estimation
        var basePremium = sum * 450; // per lakh base
        // Age factor
        if (age < 25) basePremium *= 0.8;
        else if (age < 35) basePremium *= 1.0;
        else if (age < 45) basePremium *= 1.3;
        else if (age < 55) basePremium *= 1.7;
        else if (age < 65) basePremium *= 2.3;
        else basePremium *= 3.0;
        // Members
        basePremium *= (1 + (members - 1) * 0.45);
        // City
        if (city === 'metro') basePremium *= 1.15;
        else if (city === 'tier1') basePremium *= 1.05;
        // Pre-existing
        if (pre === 'yes') basePremium *= 1.3;
        // Tobacco
        if (tobacco === 'yes') basePremium *= 1.2;

        var gst = basePremium * 0.18;
        var total = basePremium + gst;
        var monthly = total / 12;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#0d9488">' + formatINR(total) + '/yr</div>\
                <div class="calc-result-label">' + formatINR(monthly) + '/month • Sum Insured: ' + formatINR(sum * 100000) + '</div>\
                <table class="calc-result-table">\
                    <tr><td>Members Covered</td><td>' + members + '</td></tr>\
                    <tr><td>Base Premium</td><td>' + formatINR(basePremium) + '</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '</td></tr>\
                    <tr style="font-weight:700"><td>Total Annual Premium</td><td>' + formatINR(total) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Tax benefit up to ₹25,000 under Section 80D. For senior citizen parents, additional ₹50,000.</p>\
            </div>');
    };

    // ---------- Car Insurance ----------
    calculatorLogic['car-insurance'] = function () {
        var brand = document.getElementById('cBrand').value;
        var fuel = document.getElementById('cFuel').value;
        var idv = parseFloat(document.getElementById('cIDV').value);
        var year = parseInt(document.getElementById('cYear').value);
        var city = document.getElementById('cCity').value;
        var type = document.getElementById('cType').value;

        var age = 2026 - year;
        // OD premium = % of IDV
        var odRate = 0.028; // 2.8% base
        if (age > 5) odRate += 0.005;
        if (age > 10) odRate += 0.008;
        if (fuel === 'diesel') odRate += 0.003;
        if (fuel === 'electric') odRate -= 0.005;

        // Luxury brands
        if (['BMW', 'Mercedes', 'Audi'].indexOf(brand) > -1) odRate += 0.01;

        var odPremium = idv * odRate;
        // TP premium (fixed by IRDAI - approximate)
        var tpPremium = 2094; // for cars
        if (idv > 500000) tpPremium = 3416;
        if (idv > 1000000) tpPremium = 7897;

        if (city === 'metro') { odPremium *= 1.1; }

        var totalOD = type === 'tp' ? 0 : odPremium;
        var total = totalOD + tpPremium;
        var gst = total * 0.18;
        var grandTotal = total + gst;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#0d9488">' + formatINR(grandTotal) + '/yr</div>\
                <div class="calc-result-label">' + type.charAt(0).toUpperCase() + type.slice(1) + ' Cover • IDV: ' + formatINR(idv) + '</div>\
                <table class="calc-result-table">\
                    <tr><td>OD Premium</td><td>' + formatINR(totalOD) + '</td></tr>\
                    <tr><td>Third-Party Premium</td><td>' + formatINR(tpPremium) + '</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '</td></tr>\
                    <tr style="font-weight:700"><td>Total Premium</td><td>' + formatINR(grandTotal) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Voluntary deductibles & anti-theft devices can reduce your OD premium by 15-20%.</p>\
            </div>');
    };

    // ---------- Bike Insurance ----------
    calculatorLogic['bike-insurance'] = function () {
        var brand = document.getElementById('cBrand').value;
        var cc = parseInt(document.getElementById('cCC').value);
        var idv = parseFloat(document.getElementById('cIDV').value);
        var year = parseInt(document.getElementById('cYear').value);
        var city = document.getElementById('cCity').value;
        var type = document.getElementById('cType').value;

        var age = 2026 - year;
        var odRate = 0.025;
        if (age > 5) odRate += 0.004;
        if (cc > 350) odRate += 0.008;
        else if (cc > 150) odRate += 0.003;

        if (['Royal Enfield', 'KTM'].indexOf(brand) > -1) odRate += 0.005;

        var odPremium = idv * odRate;
        // TP rates by cc
        var tpPremium = 482;
        if (cc > 75 && cc <= 150) tpPremium = 752;
        else if (cc > 150 && cc <= 350) tpPremium = 1193;
        else if (cc > 350) tpPremium = 2323;

        if (city === 'metro') odPremium *= 1.08;

        var totalOD = type === 'tp' ? 0 : odPremium;
        var total = totalOD + tpPremium;
        var gst = total * 0.18;
        var grandTotal = total + gst;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#0d9488">' + formatINR(grandTotal) + '/yr</div>\
                <div class="calc-result-label">' + type.charAt(0).toUpperCase() + type.slice(1) + ' Cover • IDV: ' + formatINR(idv) + '</div>\
                <table class="calc-result-table">\
                    <tr><td>OD Premium</td><td>' + formatINR(totalOD) + '</td></tr>\
                    <tr><td>Third-Party Premium</td><td>' + formatINR(tpPremium) + '</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '</td></tr>\
                    <tr style="font-weight:700"><td>Total Premium</td><td>' + formatINR(grandTotal) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Electric 2-wheelers enjoy lower OD premiums and 0% TP premium for the first year!</p>\
            </div>');
    };

    // ---------- Travel Insurance ----------
    calculatorLogic['travel-insurance'] = function () {
        var dest = document.getElementById('cDest').value;
        var days = parseInt(document.getElementById('cDays').value);
        var travellers = parseInt(document.getElementById('cTravellers').value);
        var age = parseInt(document.getElementById('cAge').value);
        var coverUSD = parseInt(document.getElementById('cCoverUSD').value);
        var trip = document.getElementById('cTrip').value;

        // Base premium per person per day (in INR)
        var basePerDay = 40;
        var destMult = { asia: 1.0, europe: 1.5, usa: 1.8, australia: 1.4, world: 2.0 };
        basePerDay *= (destMult[dest] || 1);

        // Age factor
        if (age > 60) basePerDay *= 2.5;
        else if (age > 45) basePerDay *= 1.5;

        // Cover amount factor
        basePerDay *= (coverUSD / 50000);

        // Trip type
        if (trip === 'business') basePerDay *= 1.2;
        else if (trip === 'student') basePerDay *= 0.85;

        var premium = basePerDay * days * travellers;
        var gst = premium * 0.18;
        var total = premium + gst;

        showResult('\
            <div class="calc-result-card">\
                <div class="calc-result-big" style="color:#0d9488">' + formatINR(total) + '</div>\
                <div class="calc-result-label">For ' + travellers + ' traveller(s) • ' + days + ' days</div>\
                <table class="calc-result-table">\
                    <tr><td>Destination</td><td>' + dest.charAt(0).toUpperCase() + dest.slice(1) + '</td></tr>\
                    <tr><td>Cover Amount</td><td>$' + coverUSD.toLocaleString() + '</td></tr>\
                    <tr><td>Base Premium</td><td>' + formatINR(premium) + '</td></tr>\
                    <tr><td>GST (18%)</td><td>' + formatINR(gst) + '</td></tr>\
                    <tr style="font-weight:700"><td>Total Premium</td><td>' + formatINR(total) + '</td></tr>\
                </table>\
                <p class="calc-tip">💡 <strong>Tip:</strong> Travel insurance covers medical emergencies, trip cancellation, and lost baggage abroad.</p>\
            </div>');
    };

    // ===== Body Fat: show/hide hip field =====
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'cGender' && document.getElementById('hipRow')) {
            document.getElementById('hipRow').style.display = e.target.value === 'female' ? 'flex' : 'none';
        }
    });

})();
