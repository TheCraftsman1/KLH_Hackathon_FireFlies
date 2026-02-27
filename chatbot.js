/**
 * Insurix Telugu + English TTS Chatbot
 * Uses Web Speech API (SpeechSynthesis) for text-to-speech — FREE, no API keys needed
 * Supports Telugu (te-IN) and English (en-IN) with insurance domain knowledge
 */

const InsurixChatbot = (() => {
    // ===== CONFIG =====
    let currentLang = 'te'; // 'te' for Telugu, 'en' for English
    let isSpeaking = false;
    let voiceEnabled = true;
    let teluguVoice = null;
    let englishVoice = null;

    // ===== TELUGU INSURANCE KNOWLEDGE BASE =====
    const teluguKB = {
        // Greetings
        greetings: {
            patterns: ['హలో', 'హాయ్', 'నమస్కారం', 'నమస్తే', 'హై', 'hi', 'hello', 'hey', 'namaste', 'namaskaram'],
            responses: [
                'నమస్కారం! 🙏 Insurix.India కి స్వాగతం. మోటార్, హెల్త్, లైఫ్, ట్రావెల్, హోమ్, సైబర్ — ఏ బీమా గురించైనా అడగండి!',
                'హలో! 👋 నేను మీ బీమా సహాయకుడిని. బైక్, కార్, హెల్త్, లైఫ్, ట్రావెల్, హోమ్ — అన్ని బీమాల గురించి నాకు తెలుసు!',
                'నమస్తే! మీ బీమా అవసరాలకు నేను సిద్ధంగా ఉన్నాను. ఏ రకమైన బీమా గురించి సహాయం కావాలి? చెప్పండి!'
            ]
        },

        // Two-wheeler insurance
        twoWheeler: {
            patterns: ['టూ వీలర్', 'బైక్', 'బండి', 'two wheeler', 'bike', 'motorcycle', 'స్కూటర్', 'scooter', 'బైక్ బీమా', 'బండి బీమా', 'వాహనం', 'vehicle', 'మోపెడ్', 'యాక్టివా', 'స్ప్లెండర్', 'పల్సర్', 'బుల్లెట్'],
            responses: [
                'టూ వీలర్ బీమా! 🏍️ IRDAI Third Party రేట్లు:\n• 75cc కింద: ₹538/సంవత్సరం\n• 75-150cc: ₹714/సంవత్సరం\n• 150-350cc: ₹1,366/సంవత్సరం\n• 350cc పైన: ₹2,804/సంవత్సరం\n\nAdd-ons: Zero Dep, Engine Protect, RSA, Key Replacement. 6+ కంపెనీలు compare చేయండి!',
                'బైక్ ఇన్సూరెన్స్: HDFC ERGO, ICICI Lombard, Bajaj Allianz, Tata AIG, SBI General, Digit లో compare చేయండి! Comprehensive (OD+TP) లేదా TP Only — 30 సెకన్లలో quote!',
                'మీ బండి నంబర్ ఎంటర్ చేస్తే Make, Model, Year, IDV, Premium అన్నీ ఆటోమేటిక్ గా వస్తాయి! NCB తో 50% వరకు తగ్గింపు.'
            ]
        },

        // Car insurance
        car: {
            patterns: ['కార్', 'కారు', 'car', 'four wheeler', '4 wheeler', 'sedan', 'suv', 'హ్యాచ్‌బ్యాక్', 'కార్ బీమా', 'ప్రైవేట్ కార్'],
            responses: [
                'కార్ బీమా! 🚗 IRDAI Third Party రేట్లు:\n• ≤1000cc: ₹2,094/సం\n• 1000-1500cc: ₹3,416/సం\n• >1500cc: ₹7,897/సం\n\nComprehensive = మీ కారు + third party కవర్. Add-ons: Zero Dep, Engine Protect, RSA, Return to Invoice, NCB Protector.',
                'కారు బీమా: ICICI Lombard, Bajaj Allianz, HDFC ERGO, Digit, Acko, Tata AIG, SBI General నుండి quotes తీసుకోండి! OD premium = ~2.2-3.5% IDV + 18% GST. NCB తో 50% తగ్గింపు!'
            ]
        },

        // Health insurance
        health: {
            patterns: ['ఆరోగ్య బీమా', 'హెల్త్', 'health', 'medical', 'hospital', 'ఆరోగ్యం', 'ఆసుపత్రి', 'వైద్యం', 'మెడికల్', 'మెడిక్లెయిమ్'],
            responses: [
                'ఆరోగ్య బీమా! 🏥 ₹5,000/సంవత్సరం నుండి!\n• క్యాష్‌లెస్ చికిత్స 10,000+ ఆసుపత్రులలో\n• ₹5 లక్షల నుండి ₹5 కోట్ల వరకు కవరేజ్\n• ముందుగా ఉన్న వ్యాధులకు 2-4 సం తర్వాత కవర్\n• Day-care, AYUSH (ఆయుర్వేదం, యోగ) కవర్\n• రూమ్ రెంట్, ICU, ఆంబులెన్స్ కవర్\n\nTop: Star Health, Niva Bupa, HDFC ERGO, Care Health.\n\nTax: Section 80D — ₹25,000 తగ్గింపు!',
                'హెల్త్ ఇన్సూరెన్స్ రకాలు: Individual, Family Floater, Senior Citizen, Critical Illness, Maternity, Top-Up/Super Top-Up.\n\nFamily Floater: ₹10,000-₹25,000/సం = ₹10L కవర్. No Claim Bonus తో ప్రతి సంవత్సరం sum insured పెరుగుతుంది!'
            ]
        },

        // Family health
        familyHealth: {
            patterns: ['ఫ్యామిలీ హెల్త్', 'కుటుంబ బీమా', 'కుటుంబం', 'family health', 'family floater', 'family plan'],
            responses: [
                'కుటుంబ హెల్త్ బీమా (Family Floater)! 👨‍👩‍👧‍👦\n• ₹5L నుండి ₹1Cr కవరేజ్\n• ₹10,000-₹25,000/సం = ₹10L కవర్\n• Self + భార్య/భర్త + 2-4 పిల్లలు + తల్లిదండ్రులు\n• 10,000+ ఆసుపత్రులలో క్యాష్‌లెస్\n• Maternity cover: ₹25K-₹75K\n\nTop: Star Family Health Optima, Niva Bupa Reassure, HDFC ERGO Optima.',
                'ఒక పాలసీతో మొత్తం కుటుంబాన్ని cover చేయవచ్చు! ఇది చాలా cost-effective. No Claim Bonus తో sum insured ప్రతి సంవత్సరం పెరుగుతుంది. Free annual health checkup కూడా!'
            ]
        },

        // Senior citizen health
        seniorHealth: {
            patterns: ['సీనియర్ సిటిజన్', 'వృద్ధుల బీమా', 'తల్లిదండ్రుల బీమా', 'senior citizen', 'senior health', '60+', 'వయసు పెద్దవారు'],
            responses: [
                'సీనియర్ సిటిజన్ హెల్త్ బీమా (60+)! 👴👵\n• ₹5L నుండి ₹50L కవరేజ్\n• ₹15,000-₹50,000/సం\n• Pre-existing diseases 1-2 సం తర్వాత కవర్\n• AYUSH, Domiciliary treatment కవర్\n\nTop: Star Red Carpet, Niva Bupa Senior First, Care Senior.\n\nTax: Section 80D — సీనియర్ సిటిజన్లకు ₹50,000 తగ్గింపు!',
                '60+ తల్లిదండ్రులకు ప్రత్యేక హెల్త్ ప్లాన్లు ఉన్నాయి. Co-payment 10-20% ఉండవచ్చు. కొన్ని ప్లాన్లలో medical test అవసరం లేదు ₹5L వరకు!'
            ]
        },

        // Critical Illness
        criticalIllness: {
            patterns: ['క్రిటికల్ ఇల్నెస్', 'క్యాన్సర్', 'హార్ట్ ఎటాక్', 'స్ట్రోక్', 'కిడ్నీ', 'తీవ్రమైన వ్యాధి', 'critical illness', 'cancer', 'heart attack'],
            responses: [
                'Critical Illness బీమా! 🩺 తీవ్రమైన వ్యాధి నిర్ధారణ అయితే lump-sum payout.\n• Cancer, Heart Attack, Stroke, Kidney Failure, Organ Transplant, Paralysis etc.\n• ₹5L నుండి ₹1Cr cover\n• ₹2,000-₹10,000/సం\n• Standalone లేదా Life/Health పాలసీతో rider గా తీసుకోవచ్చు.',
                'Critical Illness cover = diagnosis అయితే lump sum డబ్బు. Hospital bills కోసం కాదు — treatment, income loss, ఏదైనా కోసం ఉపయోగించవచ్చు! 30-40 critical illnesses cover చేస్తుంది.'
            ]
        },

        // Life insurance
        life: {
            patterns: ['జీవిత బీమా', 'లైఫ్', 'life', 'term', 'టర్మ్', 'మరణం', 'death', 'జీవితం', 'లైఫ్ కవర్'],
            responses: [
                'జీవిత బీమా! 💝 టర్మ్ లైఫ్ ₹490/నెలకు!\n• ₹1 కోటి కవరేజ్\n• Claim Settlement: LIC 98.6%, Max Life 99.6%, HDFC Life 99.1%, Tata AIA 99.1%\n• Return of Premium option\n• Riders: Accidental Death, Critical Illness, Disability Waiver\n\nTax: 80C — ₹1.5L తగ్గింపు. 10(10D) — maturity benefit tax-free!',
                'లైఫ్ ఇన్సూరెన్స్ రకాలు: Term (చౌకైన, pure protection), Endowment (savings + insurance), ULIP (investment + insurance), Whole Life, Money Back, Child Plans.\n\nTop: LIC, HDFC Life, ICICI Prudential, SBI Life, Max Life, Tata AIA. Online తీసుకుంటే 25% వరకు save!'
            ]
        },

        // Endowment/Savings Plans
        endowment: {
            patterns: ['ఎండోమెంట్', 'సేవింగ్స్ ప్లాన్', 'మనీ బ్యాక్', 'గ్యారంటీడ్ రిటర్న్', 'endowment', 'savings plan', 'money back', 'guaranteed return'],
            responses: [
                'Endowment & Savings Plans! 💰 Insurance + Guaranteed Returns.\n• LIC Jeevan Labh: 15-25 సం term, guaranteed maturity\n• LIC New Endowment: Sum Assured + Bonus at maturity\n• HDFC Sanchay Plus: Guaranteed income/lump sum\n\nMoney Back Plans: 3-5 సంవత్సరాలకోసారి payouts. Tax: Premium 80C లో తగ్గింపు. Maturity 10(10D) లో tax-free!',
                'Guaranteed return plans safe + decent returns (5-7% IRR). Risk తక్కువగా ఉండాలనుకునే వారికి, retirement planning కి, పిల్లల భవిష్యత్తు కోసం ideal!'
            ]
        },

        // Child Plans
        childPlan: {
            patterns: ['పిల్లల బీమా', 'చైల్డ్', 'విద్య', 'child', 'children', 'education', 'కూతురు', 'కొడుకు', 'పిల్లలు'],
            responses: [
                'చైల్డ్ ఇన్సూరెన్స్ ప్లాన్స్! 👶📚 పిల్లల విద్య & భవిష్యత్తు కోసం.\n• LIC Jeevan Tarun: 20-24 సంవత్సరాల వద్ద payouts\n• HDFC YoungStar: Education milestones ULIP\n• ICICI Pru Smart Kid, SBI Life Smart Champ\n\nKey: Parent చనిపోతే insurer remaining premiums చెల్లిస్తుంది — పిల్లలకు full benefit!\n\n₹5,000/నెల plan = 15-18 సంవత్సరాల్లో ₹25-50L corpus!',
                'పిల్లల భవిష్యత్తు కోసం ముందుగా start చేయండి! Waiver of Premium rider — parent చనిపోతే insurer premiums చెల్లిస్తుంది. Tax: Section 80C తగ్గింపు.'
            ]
        },

        // Women's Insurance
        womenPlan: {
            patterns: ['మహిళల బీమా', 'స్త్రీల బీమా', 'women', 'woman', 'ladies', 'మహిళ', 'స్త్రీ'],
            responses: [
                'మహిళల బీమా! 👩 ప్రత్యేక ప్రయోజనాలు:\n• Term Insurance: మహిళలకు 5% తక్కువ premium!\n• Health: Maternity cover (₹25K-₹75K), Newborn cover Day 1 నుండి\n• Critical Illness: Breast cancer, Ovarian cancer, Cervical cancer cover\n\nTop: HDFC Life Click 2 Protect for Women, LIC Aadhaar Stree, Star Women Care Health.',
                'మహిళలకు life expectancy ఎక్కువ = term premium తక్కువ. ముందుగా start చేస్తే ఇంకా తక్కువ premium lock-in అవుతుంది! Maternity, newborn care, female-specific critical illnesses cover.'
            ]
        },

        // Retirement/Pension
        retirement: {
            patterns: ['రిటైర్మెంట్', 'పెన్షన్', 'అన్యూటీ', 'retirement', 'pension', 'nps', 'వృద్ధాప్య'],
            responses: [
                'రిటైర్మెంట్ & పెన్షన్ ప్లాన్స్! 👴\n• NPS: Market-linked, tax-efficient (80CCD: extra ₹50K తగ్గింపు)\n• LIC Jeevan Shanti: Guaranteed pension\n• Atal Pension Yojana (APY): ₹1,000-₹5,000/నెల pension 60 తర్వాత\n• PMVVY: 60+ వారికి guaranteed 7.4% pension\n\nTax: 80C + 80CCD(1B) = ₹2L వరకు తగ్గింపు!',
                'Retirement planning: 25 వయసులో start చేస్తే, income లో 15% invest చేస్తే = 60 వయసులో comfortable retirement. NPS, LIC Annuity, SCSS — అన్నీ compare చేయండి!'
            ]
        },

        // Travel insurance
        travel: {
            patterns: ['ట్రావెల్', 'ప్రయాణ బీమా', 'విదేశ', 'travel', 'trip', 'abroad', 'visa', 'schengen', 'ఫ్లైట్', 'విమానం'],
            responses: [
                'ట్రావెల్ ఇన్సూరెన్స్! ✈️\n• International: $50K-$5L cover, ₹300-₹1,000/రోజు\n• Domestic: ₹2L-₹25L cover, ₹100-₹300/రోజు\n• Schengen Visa: MANDATORY — minimum €30,000 medical cover\n\nCovers: Medical emergencies, trip cancellation, baggage loss, flight delay, passport loss, emergency evacuation.\n\nTop: Bajaj Allianz, ICICI Lombard, HDFC ERGO, Tata AIG, Digit.',
                'ట్రావెల్ బీమా రకాలు: Single Trip, Multi-Trip/Annual, Student Travel, Senior Citizen Travel, Group Travel. ప్రయాణానికి ముందే తీసుకోండి!'
            ]
        },

        // Home insurance
        home: {
            patterns: ['ఇల్లు', 'హోమ్', 'ఆస్తి', 'home', 'house', 'property', 'fire', 'flood', 'భూకంపం', 'దొంగతనం', 'ఫ్లాట్', 'అపార్ట్‌మెంట్'],
            responses: [
                'హోమ్ ఇన్సూరెన్స్! 🏠 మీ అత్యంత విలువైన ఆస్తిని రక్షించండి.\n• Building structure + Contents (furniture, electronics, jewelry) cover\n• Fire, flood, earthquake, storm, lightning, burglary, theft cover\n• ₹10L నుండి ₹5Cr+ sum insured\n• Premium: ₹1,000-₹10,000/సం!\n\nTemporary accommodation, rent, third-party liability కూడా cover.\nTop: HDFC ERGO, ICICI Lombard, Bajaj Allianz, SBI General.',
                'Home insurance చాలా affordable, కానీ చాలా మంది Indians skip చేస్తారు! Types:\n• Standard Fire: Fire, explosion, earthquake, flood cover\n• Comprehensive Home: Building + contents + theft + liability\n• Householder\'s: Contents only (renters కోసం)'
            ]
        },

        // Cyber insurance
        cyber: {
            patterns: ['సైబర్', 'డిజిటల్', 'ఆన్‌లైన్ fraud', 'హ్యాకింగ్', 'ఫిషింగ్', 'UPI fraud', 'cyber', 'hacking', 'online fraud', 'identity theft'],
            responses: [
                'సైబర్ ఇన్సూరెన్స్! 🔐 డిజిటల్ యుగంలో రక్షణ.\n• Online financial fraud, identity theft, phishing, social media hacking, UPI fraud, cyber bullying, malware, data breach cover\n• ₹50,000 నుండి ₹1 Cr sum insured\n• ₹500-₹5,000/సం!\n\nUPI fraud 300%+ పెరిగింది — ఇది MUST-HAVE!\nTop: HDFC ERGO, Bajaj Allianz, ICICI Lombard, Tata AIG.',
                'Digital India = Digital risks! Online banking, UPI, social media ఉపయోగించే ప్రతి ఒక్కరికీ cyber insurance అవసరం. ₹500/సంవత్సరం నుండి start! Bank/UPI fraud, email hacking, phishing అన్నీ cover.'
            ]
        },

        // Electric Vehicle
        ev: {
            patterns: ['ఎలక్ట్రిక్', 'EV', 'ఎలక్ట్రిక్ వాహనం', 'బ్యాటరీ', 'electric', 'ev insurance', 'ola electric', 'ather', 'nexon ev'],
            responses: [
                'ఎలక్ట్రిక్ వాహన బీమా! ⚡🔋\n• IRDAI: OD premium పై 15% తగ్గింపు!\n• Battery damage, charging equipment, software malfunction cover\n• EV add-ons: Battery replacement, Charging cable cover\n• TP rates petrol/diesel category లాగే\n\nTop EV insurers: HDFC ERGO, ICICI Lombard, Digit, Acko, Bajaj Allianz.',
                'EV battery = వాహన విలువలో 40-50%. Battery protect add-on తప్పనిసరి! Engine protect అవసరం లేదు (engine లేదు!). IRDAI 15% OD discount ఇస్తుంది.'
            ]
        },

        // Commercial/Business
        commercial: {
            patterns: ['కమర్షియల్', 'వ్యాపారం', 'ట్రక్', 'బస్', 'ట్యాక్సీ', 'commercial', 'business', 'truck', 'bus', 'షాప్', 'ఆఫీస్', 'ఆటో రిక్షా', 'ట్రాక్టర్'],
            responses: [
                'Commercial & Business Insurance! 🚛\n• Commercial Vehicle: GVW ఆధారంగా higher TP rates\n• Fleet Insurance: Multi-vehicle policies\n• Shop/Office Package: Fire + burglary + stock + business interruption\n• Marine Cargo: Goods in transit cover\n• Professional Indemnity: Doctors, CAs, Lawyers కోసం\n• Workmen\'s Compensation: Employers కు mandatory\n\nTop: New India Assurance, United India, ICICI Lombard.',
                'వ్యాపార బీమా options:\n1. Shop Insurance: ₹2,000-₹15,000/సం — fire, theft, stock, public liability cover\n2. Professional Indemnity: Malpractice/errors cover\n3. Product Liability: Manufacturers/sellers కోసం\n4. Keyman Insurance: Key person dies అయితే business protect\n\nప్రతి వ్యాపారానికి fire + theft + public liability కనీసం ఉండాలి!'
            ]
        },

        // Crop/Agriculture
        crop: {
            patterns: ['పంట బీమా', 'వ్యవసాయం', 'రైతు', 'crop', 'farm', 'agriculture', 'kisan', 'fasal', 'pmfby', 'పంట'],
            responses: [
                'పంట బీమా — PMFBY! 🌾 భారతదేశపు అతిపెద్ద పంట బీమా పథకం.\n• రైతు premium: ఖరీఫ్ 2%, రబీ 1.5%, ఉద్యాన 5%\n• మిగతా premium ప్రభుత్వం చెల్లిస్తుంది!\n• Natural calamities, pests, diseases, post-harvest losses cover\n• 5+ కోట్ల రైతులు enroll\n\nEnrollment: ఖరీఫ్ (April-July), రబీ (Oct-Dec). Banks, CSCs ద్వారా apply.',
                'వ్యవసాయ బీమా:\n1. PMFBY: ప్రధాన పథకం, చాలా affordable\n2. WBCIS: Weather-based payouts\n3. పశువుల బీమా: ఆవులు, గేదెలు, మేకలు — govt 50% subsidy\n4. మత్స్య బీమా: చేపల రైతులకు\n\nBanks, cooperatives, CSC లద్వారా enroll చేయండి!'
            ]
        },

        // Government Schemes
        govtSchemes: {
            patterns: ['ప్రభుత్వ పథకం', 'govt', 'government', 'pmjjby', 'pmsby', 'ఆయుష్మాన్', 'ayushman', 'atal pension', 'apy', 'ప్రధాన మంత్రి', 'సర్కారీ', 'ఉచిత బీమా'],
            responses: [
                'ప్రభుత్వ బీమా పథకాలు! 🇮🇳\n\n1. PMJJBY (Life): ₹2L cover = ₹436/సం (18-55 వయసు)\n2. PMSBY (Accident): ₹2L cover = ₹20/సం! (18-70 వయసు)\n3. ఆయుష్మాన్ భారత్ (PM-JAY): FREE ₹5L/కుటుంబం/సం, 12Cr పేద కుటుంబాలకు. 25,000+ hospitals!\n4. APY (Pension): 60 తర్వాత ₹1,000-₹5,000/నెల pension\n5. ESI: ₹21,000 వరకు salary ఉన్న employees కు\n6. PMVVY: 60+ వారికి guaranteed 7.4% pension\n\nBank లేదా post office ద్వారా enroll!',
                'ప్రతి భారతీయుడికి PMJJBY + PMSBY ఉండాలి — ₹456/సం = ₹4L combined cover! PMSBY ₹20/సం = ప్రపంచంలోనే cheapest accident insurance! ఆయుష్మాన్ భారత్ = ప్రపంచంలోనే అతిపెద్ద health scheme!'
            ]
        },

        // Tax Benefits
        tax: {
            patterns: ['పన్ను', 'tax', '80c', '80d', 'టాక్స్ బెనిఫిట్', 'టాక్స్ సేవింగ్', 'ఆదాయపు పన్ను', 'తగ్గింపు', 'tax benefit'],
            responses: [
                'బీమా పన్ను ప్రయోజనాలు! 📊\n\n• Section 80C: Life premium — ₹1.5L/సం తగ్గింపు\n• Section 80D: Health premium:\n  - Self/Family: ₹25,000\n  - Parents (senior): ₹50,000\n  - Max total: ₹1,00,000\n• Section 80CCD(1B): NPS — extra ₹50,000 తగ్గింపు\n• Section 10(10D): Life maturity/death benefit tax-free\n• Section 80DD: Disabled dependant — ₹75K-₹1.25L\n\nSmart planning తో ₹50,000-₹2L+ పన్ను ఆదా!',
                'Tax-saving strategy:\n1. Term Plan: 80C తగ్గింపు (₹1.5L)\n2. Health Insurance: 80D (₹25K + ₹50K)\n3. NPS: 80CCD(1B) (extra ₹50K)\n\nTotal possible: ₹1.5L + ₹1L + ₹50K = ₹3L insurance మాత్రమే!'
            ]
        },

        // Add-ons & Riders
        addons: {
            patterns: ['యాడ్-ఆన్', 'రైడర్', 'zero dep', 'zero డిప్రీసియేషన్', 'ఇంజన్ ప్రొటెక్ట్', 'RSA', 'addon', 'rider', 'extra cover'],
            responses: [
                'బీమా Add-ons & Riders! 🛡️\n\nMotor:\n• Zero Depreciation: Full claim (₹300-₹2,000/సం)\n• Engine Protect: Water/oil damage cover\n• RSA: Towing, flat tyre, battery\n• Return to Invoice: Total loss/theft = full invoice\n• NCB Protector: 1 claim తర్వాత కూడా NCB\n\n5 సంవత్సరాల కింద వాహనాలకు Zero Dep తప్పనిసరి!',
                'Health & Life Riders:\n• Health: Critical Illness, Hospital Cash (₹1K-₹5K/రోజు), Maternity, OPD, Dental\n• Life: Accidental Death (2x SA), Critical Illness, Waiver of Premium, Terminal Illness, Income Benefit\n\nRiders = base premium లో 10-20% extra — great value!'
            ]
        },

        // Premium / price
        premium: {
            patterns: ['ధర', 'ప్రీమియం', 'premium', 'price', 'cost', 'ఎంత', 'rate', 'రేటు', 'ఖర్చు', 'డబ్బు', 'EMI'],
            responses: [
                'బీమా premiums:\n\n🏍️ Two-Wheeler TP: ₹538-₹2,804/సం\n🚗 Car TP: ₹2,094-₹7,897/సం\n🏥 Health (Individual): ₹5,000-₹25,000/సం\n💝 Term Life (₹1Cr): ₹6,000-₹18,000/సం\n✈️ Travel: ₹300-₹1,000/రోజు\n🏠 Home: ₹1,000-₹10,000/సం\n🔐 Cyber: ₹500-₹5,000/సం\n🇮🇳 PMSBY: ₹20/సం | PMJJBY: ₹436/సం\n\nNCB తో motor OD 50% వరకు save!',
                'Premium తగ్గించడానికి tips:\n1️⃣ NCB claim (20-50% off)\n2️⃣ Online buy (5-10% తక్కువ)\n3️⃣ సకాలంలో renew\n4️⃣ Compare across insurers\n5️⃣ Higher deductible = lower premium\n6️⃣ Health: Young age లో buy = తక్కువ premium lock-in\n7️⃣ Annual pay (monthly ఎక్కువ)\n\nEMI options అన్ని policies కు available!'
            ]
        },

        // Claim
        claim: {
            patterns: ['క్లెయిమ్', 'claim', 'ప్రమాదం', 'accident', 'damage', 'నష్టం', 'దెబ్బ', 'cashless', 'reimbursement'],
            responses: [
                'Claims Process! 📋\n\n🚗 Motor: Insurer కు intimate → FIR → Surveyor inspection → Cashless repair / reimbursement → 7-30 రోజులు\n🏥 Health: Pre-authorization (cashless) / bills submit (reimbursement) → TPA verification → 15-30 రోజులు\n💝 Life: Nominee inform → Death certificate + docs → Investigation → 30 రోజులలో settlement\n✈️ Travel: 24-48 గంటల్లో intimate → Bills/police report → Settlement',
                'Cashless vs Reimbursement:\n• Cashless: Insurer నేరుగా hospital/garage కి చెల్లిస్తుంది — మీరు pay చేయనవసరం లేదు! Network hospitals/garages లో మాత్రమే.\n• Reimbursement: మీరు ముందు pay → bills submit → 15-30 రోజుల్లో refund.\n\nTop claim settlement ratios: LIC 98.6%, Max Life 99.6%, Bajaj Allianz 98.1%, HDFC ERGO 97.8%.'
            ]
        },

        // RTO / Registration
        rto: {
            patterns: ['rto', 'ఆర్టీఓ', 'రిజిస్ట్రేషన్', 'registration', 'rc', 'నంబర్', 'number', 'వాహన నంబర్', 'number plate'],
            responses: [
                'మీ వాహన నంబర్ ఎంటర్ చేయండి — అన్ని details తీసుకొస్తాం! 🔍\n\nExample: TS 09 AB 1234, AP 28 CD 5678\n\n30+ రాష్ట్రాల RTO data. Make, Model, Year, CC, Fuel Type, IDV, Premium quotes — అన్నీ seconds లో!',
                'RTO నంబర్ format: [State Code] [District Code] [Series] [Number]\nTS = తెలంగాణ, AP = ఆంధ్ర ప్రదేశ్, MH = మహారాష్ట్ర, KA = కర్ణాటక\n\nనంబర్ enter చేస్తే vehicle details + 6+ companies quotes వస్తాయి!'
            ]
        },

        // IDV
        idv: {
            patterns: ['idv', 'ఐడీవీ', 'విలువ', 'value', 'insured declared value', 'మార్కెట్ విలువ', 'depreciation'],
            responses: [
                'IDV = మీ వాహనం ప్రస్తుత మార్కెట్ విలువ. 💰\n\nIDV = Ex-Showroom Price - Depreciation\n\nIRDAI Depreciation:\n• 6 నెలలు: 5%\n• 1 సం: 15%\n• 2 సం: 20%\n• 3 సం: 30%\n• 4 సం: 40%\n• 5+ సం: 50%\n\nHigher IDV = higher premium but better claim. Actual market value ki close IDV choose చేయండి.',
                'IDV tips:\n• Over-insure (unnecessary premium) లేదా under-insure (less compensation) చేయకండి\n• కొన్ని insurers ±10% range లో IDV choose చేయనిస్తారు\n• IDV = total loss/theft లో max claim amount'
            ]
        },

        // Documents
        documents: {
            patterns: ['డాక్యుమెంట్', 'document', 'పత్రాలు', 'papers', 'ఏమి కావాలి', 'required', 'KYC', 'ఆధార్', 'PAN'],
            responses: [
                'డాక్యుమెంట్లు! 📄\n\n🚗 Motor: RC, Previous policy (renewal), PAN, Aadhaar, NCB certificate\n🏥 Health: Aadhaar/PAN, Age proof, Medical reports (if needed)\n💝 Life: Aadhaar, PAN, Age proof, Income proof (salary slip/ITR), Medical test\n\nOnline buy: Aadhaar + PAN + Mobile OTP = most policies instantly!',
                'Quick KYC: Aadhaar-based e-KYC తో instant verification. Physical documents అవసరం లేదు most online purchases కు!'
            ]
        },

        // NCB
        ncb: {
            patterns: ['ncb', 'ఎన్సీబీ', 'no claim', 'నో క్లెయిమ్', 'బోనస్', 'bonus'],
            responses: [
                'NCB (No Claim Bonus)! 🎁\n• 1 సం: 20% off\n• 2 సం: 25% off\n• 3 సం: 35% off\n• 4 సం: 45% off\n• 5+ సం: 50% off\n\nOD premium పై మాత్రమే. కొత్త vehicle కు transfer చేయవచ్చు! NCB Protector add-on: 1 claim తర్వాత కూడా NCB keep!',
                'NCB biggest money-saver! 5 years claim-free = 50% off OD premium. Policy lapse అవ్వనివ్వకండి — NCB పోతుంది! Insurer మారితే NCB certificate తీసుకోండి.'
            ]
        },

        // Comparison
        comparison: {
            patterns: ['compare', 'comparison', 'ఏది మంచిది', 'best insurance', 'recommend', 'suggest', 'best plan', 'vs', 'ఉత్తమ'],
            responses: [
                'ఉత్తమ బీమా ఎలా choose చేయాలి:\n\n🚗 Motor: Digit & Acko = cheapest online. Bajaj/HDFC ERGO = best cashless.\n🏥 Health: Star Health = best health-only. Niva Bupa = best family floater.\n💝 Life (Term): Max Life & Tata AIA = 99%+ settlement. LIC = most trusted.\n\nCheck: Claim settlement ratio, Network, Add-ons, Premium, Reviews!',
                'Quick recommendations:\n• Budget Term: ICICI Pru iProtect / Tata AIA Sampoorna Raksha\n• Best Health: Star Family Health Optima / Niva Bupa Reassure\n• Best Motor: Digit (online) / HDFC ERGO (network)\n• Senior Health: Star Red Carpet / Niva Bupa Senior First\n• Govt Scheme: PMJJBY + PMSBY (₹456/సం = ₹4L cover!)\n\nSpecific plans compare చేయమంటారా?'
            ]
        },

        // Renewal
        renewal: {
            patterns: ['renew', 'రెన్యూ', 'renewal', 'expire', 'expiry', 'lapse', 'expired', 'గడువు'],
            responses: [
                'Renewal Tips! 🔄\n• Motor: Expire ముందు renew — NCB keep!\n• Motor: 90+ రోజులు lapse = NCB lose + inspection\n• Health: 30+ రోజులు lapse = waiting periods restart!\n• Life: Grace period 15-30 రోజులు; తర్వాత medical test\n\n⚠️ Policy lapse అవ్వనివ్వకండి! Especially health insurance. Expiry కి 2 weeks ముందు reminder set చేసుకోండి.',
                'Renewal checklist:\n1. Renew ముందు compare — better rates elsewhere ఉండవచ్చు\n2. Health: Port to another insurer benefits lose కాకుండా (IRDAI rule)\n3. Sum insured update\n4. Riders/add-ons review\n5. Annual pay (monthly కంటే 5-10% save)'
            ]
        },

        // Personal Accident
        personalAccident: {
            patterns: ['personal accident', 'PA cover', 'accidental death', 'disability', 'ప్రమాద బీమా'],
            responses: [
                'Personal Accident Insurance! ⚡\n• Accidental death, disability cover\n• ₹5L నుండి ₹1Cr\n• ₹500-₹5,000/సం\n• PMSBY: ₹2L PA cover = ₹20/సం — ప్రపంచంలోనే cheapest!\n• Motor insurance తో mandatory owner-driver PA: ₹15L\n\nAnywhere accident covered — road, home, workplace!',
                'PA insurance = lump-sum payout. Health insurance లాగా hospital bills cover కాదు — accidental death/disability కి fixed amount. Daily commute / risky work ఉంటే must-have!'
            ]
        },

        // Help
        help: {
            patterns: ['help', 'సహాయం', 'ఏమి చేయగలవు', 'features', 'services', 'options', 'menu'],
            responses: [
                'నేను Insurix — ALL-IN-ONE బీమా expert! 🎯\n\n🏍️ Two Wheeler | 🚗 Car | 🏥 Health (Individual, Family, Senior, Critical)\n💝 Life (Term, Endowment, ULIP, Child, Women)\n✈️ Travel | 🏠 Home | 🔐 Cyber\n🚛 Commercial/Business | 🌾 Crop/Agriculture\n🇮🇳 Govt Schemes (PMJJBY, PMSBY, Ayushman, APY)\n📊 Tax Benefits (80C, 80D, NPS)\n🛡️ Add-ons & Riders | 📋 Claims\n\nఏదైనా అడగండి!',
                'భారతదేశంలోని ప్రతి బీమా గురించి నాకు తెలుసు! Health, life, motor, travel, home, cyber, crop, commercial, govt schemes, tax benefits — ఏదైనా అడగండి!'
            ]
        },

        // Thanks
        thanks: {
            patterns: ['ధన్యవాదం', 'thanks', 'thank you', 'థ్యాంక్స్', 'బాగుంది', 'సూపర్', 'great', 'nice', 'good'],
            responses: [
                'ధన్యవాదాలు! 😊 Motor, health, life, travel, home, cyber — ఏ బీమా గురించైనా అడగండి. ఎల్లప్పుడూ సిద్ధంగా ఉన్నాను!',
                'సంతోషం! 🙏 Insurix.India తో అన్ని బీమా సమాచారం ఒకే చోట. మరిన్ని ప్రశ్నలు ఉంటే అడగండి!',
                'థ్యాంక్ యూ! మీకు ఉత్తమమైన బీమా అందించడం మా లక్ష్యం. 🎯'
            ]
        },

        // Goodbye
        goodbye: {
            patterns: ['బై', 'goodbye', 'see you', 'వెళ్తాను', 'ఆపు', 'exit'],
            responses: [
                'బై! 👋 బీమా ఉంటే ధైర్యం ఉంటుంది! ఎప్పుడైనా తిరిగి రండి.',
                'మళ్ళీ కలుద్దాం! 🙏 బీమా ఖర్చు కాదు, మనశ్శాంతి. జాగ్రత్తగా ఉండండి! 🛡️'
            ]
        },

        // Default
        default: {
            responses: [
                'అన్ని రకాల భారతీయ బీమా గురించి నేను help చేయగలను! 🤔 అడగండి:\n• Motor (Bike/Car/Commercial) 🏍️🚗\n• Health (Individual/Family/Senior) 🏥\n• Life (Term/Endowment/ULIP) 💝\n• Travel, Home, Cyber ✈️🏠🔐\n• Govt Schemes (PMJJBY/PMSBY/Ayushman) 🇮🇳\n• Tax Benefits (80C/80D/NPS) 📊\n• Claims, Add-ons, Renewal 📋',
                'నేను భారతీయ బీమా expert — చిన్నది నుండి పెద్దది వరకు! మీ question మళ్ళీ చెప్పగలరా? Motor, health, life, travel, home, cyber, crop, commercial, govt schemes, tax benefits — అన్నీ తెలుసు!'
            ]
        }
    };

    // ===== ENGLISH INSURANCE KNOWLEDGE BASE =====
    const englishKB = {
        greetings: {
            patterns: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'howdy', 'sup', 'yo', 'what\'s up'],
            responses: [
                'Hello! 👋 Welcome to Insurix.India — your one-stop insurance expert! I can help with motor, health, life, travel, home, cyber, or any insurance. What do you need?',
                'Hi there! 🙏 I\'m your insurance buddy. Ask me about ANY insurance — bike, car, health, life, travel, home, crop, government schemes, tax benefits — I know it all!',
                'Hey! Ready to help you with all kinds of insurance. What are you looking for today?'
            ]
        },
        twoWheeler: {
            patterns: ['two wheeler', 'bike', 'motorcycle', 'scooter', 'bike insurance', 'moped', 'scooty', 'activa', 'splendor', 'pulsar', 'bullet'],
            responses: [
                'Two Wheeler Insurance! 🏍️ Enter your registration number and we\'ll fetch all details. IRDAI Third Party rates:\n• Below 75cc: ₹538/year\n• 75-150cc: ₹714/year\n• 150-350cc: ₹1,366/year\n• Above 350cc: ₹2,804/year\n\nAdd-ons: Zero Depreciation, Engine Protect, RSA, Key Replacement. Compare 6+ insurers instantly!',
                'Looking for bike insurance? We compare HDFC ERGO, ICICI Lombard, Bajaj Allianz, Tata AIG, SBI General, Digit & more. Comprehensive or TP Only — get the best quote in 30 seconds!'
            ]
        },
        car: {
            patterns: ['car', 'four wheeler', '4 wheeler', 'sedan', 'suv', 'hatchback', 'car insurance', 'private car', 'auto'],
            responses: [
                'Car Insurance! 🚗 IRDAI Third Party rates:\n• ≤1000cc: ₹2,094/yr\n• 1000-1500cc: ₹3,416/yr\n• >1500cc: ₹7,897/yr\n\nComprehensive covers YOUR car + third party — best for newer cars! Popular add-ons: Zero Depreciation, Engine Protect, RSA, Return to Invoice, NCB Protector.',
                'Private car insurance from top insurers: ICICI Lombard, Bajaj Allianz, HDFC ERGO, Digit, Acko, Tata AIG, SBI General. Get quotes by entering your vehicle number!\n\nOD premium = ~2.2-3.5% of IDV + 18% GST. NCB saves up to 50%!'
            ]
        },
        health: {
            patterns: ['health', 'medical', 'hospital', 'sick', 'doctor', 'health insurance', 'mediclaim', 'hospitalisation', 'hospitalization'],
            responses: [
                'Health Insurance plans start from ₹5,000/year! 🏥\n• Cashless treatment at 10,000+ hospitals\n• Coverage from ₹5L to ₹5Cr\n• Pre-existing diseases covered after 2-4 yrs\n• Day-care procedures, AYUSH included\n• Ambulance, room rent, ICU covered\n\nTop insurers: Star Health, Niva Bupa, HDFC ERGO, Care Health, ICICI Lombard, ManipalCigna.\n\nTax benefit: Section 80D — ₹25,000 deduction!',
                'Health insurance in India covers Individual, Family Floater, Senior Citizen, Critical Illness, Maternity, Top-Up plans and more!\n\nFamily Floater: ₹10,000-₹25,000/yr for ₹10L cover. No Claim Bonus increases sum insured 5-50% each year. Compare 51+ insurers now!'
            ]
        },
        familyHealth: {
            patterns: ['family health', 'family floater', 'family plan', 'family insurance', 'family medical'],
            responses: [
                'Family Floater Health Insurance! 👨‍👩‍👧‍👦 One policy covers the entire family.\n• Coverage: ₹5L to ₹1Cr\n• Premium: ₹10,000-₹25,000/yr for ₹10L\n• Covers: Self + Spouse + 2-4 Children + Parents\n• Cashless at 10,000+ hospitals\n• No Claim Bonus: Sum insured increases each claim-free year\n\nTop picks: Star Family Health Optima, Niva Bupa Reassure, HDFC ERGO Optima Secure, Care Health.',
                'Family floater is the most cost-effective way to cover everyone! One sum insured shared by all. Maternity cover (₹25K-₹75K), newborn from Day 1, free annual health checkup included in most plans.'
            ]
        },
        seniorHealth: {
            patterns: ['senior citizen', 'senior health', 'old age', 'elderly', 'parent insurance', 'parents health', '60 plus', '60+'],
            responses: [
                'Senior Citizen Health Insurance (60+)! 👴👵\n• Coverage: ₹5L to ₹50L\n• Premium: ₹15,000-₹50,000/yr\n• Pre-existing covered after 1-2 yrs\n• No medical test up to ₹5L in some plans\n• Domiciliary treatment covered\n\nTop senior plans: Star Health Senior Citizens Red Carpet, Niva Bupa Senior First, Care Health Senior.\n\nTax: Section 80D — ₹50,000 deduction for senior citizens!',
                'For parents above 60, dedicated senior citizen health plans offer better coverage with higher sum insured limits. Co-payment of 10-20% may apply. Some plans cover AYUSH, home healthcare and rehabilitation too!'
            ]
        },
        criticalIllness: {
            patterns: ['critical illness', 'cancer', 'heart attack', 'stroke', 'kidney', 'critical care', 'serious illness', 'ci cover'],
            responses: [
                'Critical Illness Insurance! 🩺 Lump-sum payout on diagnosis of listed illnesses.\n• Covers: Cancer, Heart Attack, Stroke, Kidney Failure, Major Organ Transplant, Paralysis, Coma, etc.\n• Sum Insured: ₹5L to ₹1Cr\n• Premium: ₹2,000-₹10,000/yr\n• Payout: Lump sum on first diagnosis — use it for anything!\n\nAvailable as standalone or rider with life/health insurance.',
                'Critical illness cover pays a lump sum on diagnosis — unlike regular health insurance that covers hospital bills. You can use the money for treatment, loss of income, or anything else. Cover 30-40 critical illnesses!'
            ]
        },
        life: {
            patterns: ['life', 'term', 'death', 'life insurance', 'term plan', 'term life', 'life cover'],
            responses: [
                'Term Life Insurance from ₹490/month! 💝\n• ₹1 Crore coverage\n• Claim Settlement: LIC 98.6%, Max Life 99.6%, HDFC Life 99.1%, Tata AIA 99.1%\n• Return of Premium option available\n• Riders: Accidental Death, Critical Illness, Disability Waiver\n\nDeath Benefit options: Lump sum, Monthly income, or both!\nTax: Section 80C — ₹1.5L deduction. Section 10(10D) — maturity tax-free!',
                'Life insurance types: Term (cheapest, pure protection), Endowment (savings + insurance), ULIP (investment + insurance), Whole Life, Money Back.\n\nTop insurers: LIC, HDFC Life, ICICI Prudential, SBI Life, Max Life, Tata AIA, Bajaj Allianz Life. Compare and save up to 25% online!'
            ]
        },
        endowment: {
            patterns: ['endowment', 'savings plan', 'money back', 'guaranteed return', 'lump sum', 'maturity benefit'],
            responses: [
                'Endowment & Savings Plans! 💰 Insurance + Guaranteed Returns.\n• LIC Jeevan Labh: 15-25 yr term, guaranteed maturity\n• LIC New Endowment: Sum Assured + Bonus at maturity\n• HDFC Sanchay Plus: Guaranteed income/lump sum\n\nMoney Back Plans: Get periodic payouts every 3-5 years plus maturity benefit.\n\nTax: Premium deductible u/s 80C (₹1.5L). Maturity tax-free u/s 10(10D).',
                'Guaranteed return plans offer safety with decent returns (5-7% IRR). Choose between:\n• Regular Income: Monthly/yearly payouts\n• Lump Sum: Big payout at maturity\n• Combination: Some payouts + maturity benefit\n\nIdeal for risk-averse investors, retirement planning, or children\'s future.'
            ]
        },
        ulip: {
            patterns: ['ulip', 'unit linked', 'investment plan', 'market linked', 'equity insurance'],
            responses: [
                'ULIPs — Investment + Insurance in one! 📈\n• 5-year lock-in period\n• Fund options: Equity, Debt, Balanced, Hybrid\n• Switch between funds (4 free switches/yr usually)\n• Tax: Section 80C on premium, 10(10D) on maturity\n\nTop ULIPs: HDFC Click 2 Invest, ICICI Pru Signature, Bajaj Allianz Life Goal Assure, SBI Life Smart Platina Plus.\n\nBest for: Long-term wealth creation with life cover.',
                'ULIPs invest your premium in market-linked funds (equity/debt). Unlike mutual funds, they also give life cover. Since 2021, ULIPs with premium >₹2.5L/yr are taxed on maturity. Compare charges (mortality, fund management, policy admin) before buying!'
            ]
        },
        childPlan: {
            patterns: ['child', 'children', 'kids', 'education', 'child plan', 'child insurance', 'kid insurance', 'daughter', 'son'],
            responses: [
                'Child Insurance Plans! 👶📚 Secure your child\'s education & future.\n• LIC Jeevan Tarun: Survival benefits at 20-24 yrs\n• HDFC YoungStar Super Premium: ULIP with education milestones\n• ICICI Pru Smart Kid: Goal-based child plan\n• SBI Life Smart Champ: Guaranteed payouts\n\nFeatures: Premium waiver if parent passes away, guaranteed payouts at education milestones.',
                'Start early for your child! A ₹5,000/month SIP-type child plan can build ₹25-50L corpus in 15-18 years for college/marriage.\n\nKey benefit: Waiver of Premium rider — if parent dies, insurer pays remaining premiums. Child gets full maturity benefit!\n\nTax: Section 80C deduction on premiums.'
            ]
        },
        womenPlan: {
            patterns: ['women', 'woman', 'female', 'ladies', 'mahila', 'women insurance', 'lady'],
            responses: [
                'Women\'s Insurance! 👩 Special benefits for women:\n• Term Insurance: 5% lower premiums for women!\n• Health: Maternity cover (₹25K-₹75K), newborn cover from Day 1\n• Critical Illness: Covers breast cancer, ovarian cancer, cervical cancer\n• Stree Suraksha: Special women-only plans from several insurers\n\nWomen have higher life expectancy = lower term premiums. Start early!',
                'Women-specific insurance covers:\n• Maternity & newborn care\n• Female-specific critical illnesses\n• Domestic violence / harassment support (some policies)\n• Pregnancy complications\n\nTop picks: HDFC Life Click 2 Protect for Women, LIC Aadhaar Stree, Star Women Care Health plan.'
            ]
        },
        retirement: {
            patterns: ['retirement', 'pension', 'annuity', 'nps', 'old age plan', 'retire', 'pension plan', 'superannuation'],
            responses: [
                'Retirement & Pension Plans! 👴\n• NPS (National Pension System): Market-linked, tax-efficient (80CCD: extra ₹50K deduction)\n• LIC Jeevan Shanti: Immediate/Deferred annuity with guaranteed pension\n• Tata AIA Fortune Pension: Guaranteed income for life\n• Atal Pension Yojana (APY): ₹1,000-₹5,000/month pension from age 60\n\nTax: 80C + 80CCD(1B) = up to ₹2L total deduction!',
                'Plan your retirement:\n1. NPS — Excellent for salaried (employer contributes too). Extra ₹50K tax benefit!\n2. Annuity Plans — Guaranteed lifelong income\n3. Senior Citizen Savings Scheme (SCSS) — 8%+ returns for 60+\n4. PM Vaya Vandana Yojana (PMVVY) — 7.4% guaranteed by LIC\n\nRule of thumb: Start at 25, invest 15% of income = comfortable retirement at 60.'
            ]
        },
        travel: {
            patterns: ['travel', 'trip', 'abroad', 'international', 'travel insurance', 'visa', 'schengen', 'flight', 'foreign', 'overseas', 'holiday', 'vacation'],
            responses: [
                'Travel Insurance! ✈️ Essential for any trip.\n• International: $50K-$5L coverage from ₹300-₹1,000/day\n• Domestic: ₹2L-₹25L coverage from ₹100-₹300/day\n• Schengen Visa: MANDATORY — minimum €30,000 medical cover\n\nCovers: Medical emergencies abroad, trip cancellation, baggage loss/delay, flight delay, passport loss, emergency evacuation, adventure sports.\n\nTop: Bajaj Allianz, ICICI Lombard, HDFC ERGO, Tata AIG, Digit.',
                'Travel insurance types:\n• Single Trip: One-time coverage\n• Multi-Trip/Annual: Multiple trips in a year\n• Student Travel: For studying abroad (6mo-3yr)\n• Senior Citizen Travel: Specialized for 60+\n• Group Travel: Family/corporate groups\n\nAlways buy BEFORE you travel. Pre-existing conditions covered after waiting period in some plans.'
            ]
        },
        home: {
            patterns: ['home', 'house', 'property', 'home insurance', 'fire', 'flood', 'earthquake', 'building', 'flat', 'apartment', 'burglary', 'theft'],
            responses: [
                'Home Insurance! 🏠 Protect your most valuable asset.\n• Coverage: Building structure + Contents (furniture, electronics, jewelry)\n• Perils: Fire, flood, earthquake, storm, lightning, burglary, theft\n• Sum Insured: ₹10L to ₹5Cr+ based on property value\n• Premium: Just ₹1,000-₹10,000/yr for ₹25L-₹1Cr cover!\n\nAlso covers: Temporary accommodation, rent, third-party liability.\nTop: HDFC ERGO, ICICI Lombard, Bajaj Allianz, SBI General, Tata AIG.',
                'Home insurance is super affordable yet most Indians skip it! Types:\n• Standard Fire & Special Perils: Covers fire, explosion, earthquake, flood, storm, etc.\n• Comprehensive Home: Building + contents + theft + liability\n• Householder\'s Policy: Contents only (for renters)\n\nExclusions: War, nuclear risks, wear & tear, poor maintenance. Add earthquake cover if not included!'
            ]
        },
        cyber: {
            patterns: ['cyber', 'digital', 'online fraud', 'hacking', 'phishing', 'identity theft', 'upi fraud', 'internet', 'data breach', 'cyber insurance'],
            responses: [
                'Cyber Insurance! 🔐 Protection in the digital age.\n• Coverage: Online financial fraud, identity theft, phishing, social media hacking, cyber bullying, malware attacks, unauthorized UPI/banking transactions, cyber extortion, data breach.\n• Sum Insured: ₹50,000 to ₹1 Crore\n• Premium: Just ₹500-₹5,000/year!\n\nWith UPI fraud rising 300%+, this is a MUST-HAVE.\nTop: HDFC ERGO, Bajaj Allianz, ICICI Lombard, Tata AIG.',
                'Digital India = Digital risks! Cyber insurance covers:\n• Unauthorized bank/UPI transactions\n• Credit/debit card fraud\n• Email/social media hacking\n• Phishing & identity theft\n• Cyber bullying & defamation\n• Malware/ransomware attacks\n\nEssential for anyone who uses online banking, UPI, or social media. Starting at just ₹500/year!'
            ]
        },
        ev: {
            patterns: ['electric', 'ev', 'electric vehicle', 'electric car', 'electric bike', 'ev insurance', 'battery', 'tesla', 'ola electric', 'ather', 'nexon ev', 'tiago ev'],
            responses: [
                'Electric Vehicle Insurance! ⚡🔋\n• IRDAI gives 15% discount on OD premium for EVs!\n• Covers: Battery damage, charging equipment, software malfunction\n• EV-specific add-ons: Battery replacement, Charging cable cover, Cyber liability\n• TP rates same as petrol/diesel category\n\nEVs are cheaper to insure due to IRDAI incentives. Top EV insurers: HDFC ERGO, ICICI Lombard, Digit, Acko, Bajaj Allianz.',
                'EV insurance is similar to regular motor insurance but with battery-specific covers.\n\nKey points:\n• Battery is 40-50% of EV cost — get battery protect add-on!\n• 15% OD discount as per IRDAI\n• No engine protect needed (no engine!), but get motor protect\n• Charging station liability available\n\nPopular EVs: Tata Nexon EV, MG ZS EV, Ola S1 Pro, Ather 450X.'
            ]
        },
        commercial: {
            patterns: ['commercial', 'business', 'truck', 'bus', 'taxi', 'fleet', 'goods vehicle', 'commercial vehicle', 'transport', 'lorry', 'auto rickshaw', 'tractor', 'shop', 'office'],
            responses: [
                'Commercial Vehicle & Business Insurance! 🚛\n• Commercial Vehicle: Higher TP rates based on GVW (Gross Vehicle Weight) and use\n• Fleet Insurance: Multi-vehicle policies with volume discounts\n• Shop/Office Package: Fire + burglary + stock damage + business interruption\n• Marine Cargo: Goods in transit (road/rail/sea/air)\n• Professional Indemnity: For doctors, CAs, lawyers, IT consultants\n• Workmen\'s Compensation: Mandatory for employers\n\nTop: New India Assurance, United India, ICICI Lombard, Bajaj Allianz.',
                'Business insurance options:\n1. Shop Insurance: ₹2,000-₹15,000/yr — covers fire, theft, stock, public liability\n2. Professional Indemnity: Covers malpractice/errors — ₹5,000-₹25,000/yr\n3. D&O Liability: Directors & Officers protection\n4. Product Liability: For manufacturers/sellers\n5. Keyman Insurance: Protects business if key person dies\n6. Fidelity Guarantee: Covers employee fraud/dishonesty\n\nEvery business needs at least fire + theft + public liability cover!'
            ]
        },
        crop: {
            patterns: ['crop', 'farm', 'agriculture', 'kisan', 'fasal', 'farmer', 'pmfby', 'farming', 'harvest', 'agricultural'],
            responses: [
                'Crop Insurance — PMFBY! 🌾 India\'s largest crop insurance scheme.\n• Farmer premium: Kharif 2%, Rabi 1.5%, Horticulture 5%\n• Government pays the rest!\n• Covers: Natural calamities, pests, diseases, prevented sowing, post-harvest losses, localized calamities\n• Over 5 Crore farmers enrolled\n\nEnrollment: Kharif (April-July), Rabi (Oct-Dec). Apply through banks, CSCs, or crop insurance portal.',
                'Agricultural insurance in India:\n1. PMFBY (Pradhan Mantri Fasal Bima Yojana): Main scheme, very affordable\n2. WBCIS (Weather-Based Crop Insurance): Payouts based on weather parameters\n3. Livestock Insurance: Covers cattle, buffalo, sheep, goats — govt subsidizes 50%\n4. Fisheries Insurance: For fish farmers and fishermen\n\nContact your nearest bank, cooperative, or Common Service Centre (CSC) to enroll!'
            ]
        },
        govtSchemes: {
            patterns: ['government', 'govt', 'scheme', 'pmjjby', 'pmsby', 'ayushman', 'ayushman bharat', 'pm jay', 'atal pension', 'apy', 'pradhan mantri', 'pm scheme', 'sarkari', 'free insurance'],
            responses: [
                'Government Insurance Schemes! 🇮🇳\n\n1. PMJJBY (Life): ₹2L cover for just ₹436/yr (ages 18-55)\n2. PMSBY (Accident): ₹2L cover for just ₹20/yr! (ages 18-70)\n3. Ayushman Bharat (PM-JAY): FREE ₹5L/family/yr health cover for 12Cr poor families. 25,000+ hospitals, covers pre-existing from Day 1!\n4. APY (Pension): ₹1,000-₹5,000/month pension from age 60\n5. ESI: For employees ≤₹21,000/month salary\n6. PMVVY: Guaranteed 7.4% pension for senior citizens (60+)\n\nEnroll through any bank or post office!',
                'India has some of the best government insurance schemes in the world:\n\n• PMSBY at ₹20/yr is the CHEAPEST accident insurance globally!\n• Ayushman Bharat covers 12Cr families for FREE — world\'s largest health scheme\n• PMJJBY gives ₹2L life cover for just ₹1.2/day\n• APY guarantees pension after retirement\n• ESI covers medical + maternity + disability for low-income employees\n\nEvery Indian should have at least PMJJBY + PMSBY — costs only ₹456/year total for ₹4L combined cover!'
            ]
        },
        tax: {
            patterns: ['tax', '80c', '80d', 'tax benefit', 'tax saving', 'income tax', 'deduction', 'tax exemption', 'section 80', 'tax free'],
            responses: [
                'Insurance Tax Benefits! 📊\n\n• Section 80C: Life insurance premium — up to ₹1.5L/yr deduction\n• Section 80D: Health insurance premium:\n  - Self/Family: ₹25,000\n  - Parents (senior): ₹50,000\n  - Max total: ₹1,00,000\n• Section 80CCD(1B): NPS — extra ₹50,000 deduction\n• Section 10(10D): Life insurance maturity/death benefit tax-free (if premium ≤10% of SA)\n• Section 80DD: Disabled dependant — ₹75K-₹1.25L\n• Section 80DDB: Specified diseases — ₹40K-₹1L\n\nSmart tax planning with insurance = Save ₹50,000-₹2L+ in taxes!',
                'Tax-saving insurance strategy:\n1. Term Plan: Cheapest 80C deduction (₹1.5L)\n2. Health Insurance: 80D for self + parents (₹25K + ₹50K)\n3. NPS: Extra ₹50K under 80CCD(1B)\n4. ELSS Mutual Fund + Insurance combo for max savings\n\nTotal possible deduction: ₹1.5L + ₹1L + ₹50K = ₹3L from insurance alone!'
            ]
        },
        addons: {
            patterns: ['add-on', 'addon', 'rider', 'extra cover', 'zero dep', 'zero depreciation', 'engine protect', 'rsa', 'roadside', 'return to invoice', 'rti', 'consumables', 'key replace', 'tyre protect'],
            responses: [
                'Insurance Add-ons & Riders! 🛡️\n\nMotor Add-ons:\n• Zero Depreciation: Full claim without depreciation deduction (₹300-₹2,000/yr)\n• Engine Protect: Covers engine damage from water/oil leaks\n• RSA (Roadside Assistance): Towing, flat tyre, battery jump-start\n• Return to Invoice: Get full invoice value if total loss/theft\n• NCB Protector: Keep NCB even after 1 claim\n• Key Replacement, Tyre Protect, Consumables Cover, PA Cover\n\nZero Dep is the #1 must-have add-on for vehicles under 5 years!',
                'Health & Life Riders:\n\nHealth: Critical Illness rider, Hospital Cash (₹1,000-₹5,000/day), Maternity rider, OPD Cover, Dental, Mental Health.\n\nLife: Accidental Death Benefit (2x sum assured), Critical Illness rider, Waiver of Premium (if disabled), Terminal Illness (advance payout), Income Benefit (monthly income to family).\n\nRiders are 10-20% of base premium — great value for comprehensive protection!'
            ]
        },
        premium: {
            patterns: ['premium', 'price', 'cost', 'rate', 'how much', 'expensive', 'cheap', 'affordable', 'emi', 'installment'],
            responses: [
                'Insurance premiums vary by type:\n\n🏍️ Two-Wheeler TP: ₹538-₹2,804/yr\n🚗 Car TP: ₹2,094-₹7,897/yr\n🏥 Health (Individual): ₹5,000-₹25,000/yr\n💝 Term Life (₹1Cr): ₹6,000-₹18,000/yr\n✈️ Travel: ₹300-₹1,000/day\n🏠 Home: ₹1,000-₹10,000/yr\n🔐 Cyber: ₹500-₹5,000/yr\n🇮🇳 PMSBY: ₹20/yr | PMJJBY: ₹436/yr\n\nNCB saves up to 50% on motor OD!',
                'Tips to reduce premium:\n1️⃣ Claim your NCB (20-50% off on motor)\n2️⃣ Buy online (5-10% cheaper)\n3️⃣ Renew on time (don\'t lose NCB)\n4️⃣ Compare across insurers\n5️⃣ Choose higher deductible (lower premium)\n6️⃣ Bundle add-ons wisely\n7️⃣ For health: Buy young = lower premium locked in\n8️⃣ Pay annually (monthly costs more)\n\nEMI options available for most policies!'
            ]
        },
        claim: {
            patterns: ['claim', 'accident', 'damage', 'repair', 'cashless', 'reimbursement', 'claim process', 'file claim', 'claim settlement'],
            responses: [
                'Claims Process by type! 📋\n\n🚗 Motor: Intimate insurer → FIR (if accident/theft) → Surveyor inspection → Cashless repair at network garage OR reimbursement → Settlement in 7-30 days\n\n🏥 Health: Pre-authorization (cashless) at network hospital OR pay & submit bills (reimbursement) → TPA verification → Settlement in 15-30 days\n\n💝 Life: Nominee intimation → Death certificate + policy docs → Investigation (if needed) → Settlement within 30 days\n\n✈️ Travel: Intimate within 24-48 hrs → Medical bills/police report → Document submission → Settlement',
                'Cashless vs Reimbursement:\n• Cashless: Insurer pays hospital/garage directly — NO upfront payment from you! Only at network hospitals/garages.\n• Reimbursement: You pay first, submit bills, get money back in 15-30 days.\n\nTop claim settlement ratios:\n• LIC: 98.6% | Max Life: 99.6%\n• HDFC ERGO: 97.8% | Bajaj Allianz: 98.1%\n• Star Health: 96.5% | ICICI Lombard: 96.5%\n\n24/7 claims support available with all major insurers!'
            ]
        },
        rto: {
            patterns: ['rto', 'registration', 'rc', 'vehicle number', 'lookup', 'number plate'],
            responses: [
                'Enter your vehicle registration number and we\'ll fetch all details! 🔍\n\nExample: TS 09 AB 1234, MH 02 CD 5678\n\nOur API covers 30+ states with real-time RTO data. Returns: Make, Model, Year, CC, Fuel Type, IDV, Premium quotes — all in seconds!\n\nTry it on our Two Wheeler or Car Insurance pages!',
                'RTO number format: [State Code] [District/RTO Code] [Series] [Number]\nExamples: TS=Telangana, AP=Andhra Pradesh, MH=Maharashtra, KA=Karnataka, DL=Delhi, TN=Tamil Nadu\n\nJust enter your number and we\'ll show full vehicle details + insurance quotes from 6+ companies!'
            ]
        },
        idv: {
            patterns: ['idv', 'insured declared value', 'market value', 'depreciation', 'vehicle value'],
            responses: [
                'IDV = Current market value of your vehicle 💰\n\nIDV = Ex-Showroom Price - Depreciation\n\nIRDAI Depreciation rates:\n• 6 months: 5%\n• 1 year: 15%\n• 2 years: 20%\n• 3 years: 30%\n• 4 years: 40%\n• 5+ years: 50%\n\nHigher IDV = Higher premium but better claim payout. Choose IDV close to actual market value for fair coverage.',
                'IDV tips:\n• Don\'t over-insure (paying extra for nothing) or under-insure (less compensation on claim)\n• For brand new vehicle: IDV = Ex-Showroom price\n• Check actual resale market value before choosing IDV\n• Some insurers let you choose IDV within a range (±10%)\n• IDV determines your maximum claim amount for total loss/theft'
            ]
        },
        ncb: {
            patterns: ['ncb', 'no claim bonus', 'bonus', 'discount', 'no claim'],
            responses: [
                'NCB (No Claim Bonus) rewards claim-free years! 🎁\n• 1 year: 20% off\n• 2 years: 25% off\n• 3 years: 35% off\n• 4 years: 45% off\n• 5+ years: 50% off\n\nApplies to OD premium only. Can be transferred to a new vehicle! NCB Protector add-on lets you keep NCB even after 1 claim.',
                'NCB is your biggest money-saver! 🎁\n• 5 years claim-free = 50% off OD premium\n• Transfer NCB when changing vehicle\n• Don\'t let policy lapse — you\'ll lose NCB!\n• NCB Protector add-on: Keep NCB even after making a claim\n• NCB certificate from old insurer needed for renewal with new insurer'
            ]
        },
        documents: {
            patterns: ['document', 'papers', 'required', 'what do i need', 'kyc', 'aadhaar', 'aadhar', 'pan card'],
            responses: [
                'Documents needed by insurance type: 📄\n\n🚗 Motor Insurance:\n• RC (Registration Certificate)\n• Previous policy (if renewal)\n• PAN Card, Aadhaar\n• NCB certificate (if switching insurer)\n\n🏥 Health Insurance:\n• Aadhaar/PAN, Age proof\n• Medical reports (if required)\n• Photos\n\n💝 Life Insurance:\n• Aadhaar, PAN, Age proof\n• Income proof (salary slip/ITR)\n• Medical test reports\n\nMost policies can be bought online with just Aadhaar + PAN!',
                'Quick KYC for online insurance:\n1. Aadhaar-based e-KYC: Instant verification\n2. PAN card: For tax-related verification\n3. Mobile OTP: For identity confirmation\n\nNo physical documents needed for most online insurance purchases. Health insurance may require medical tests for higher sum insured or older ages.'
            ]
        },
        comparison: {
            patterns: ['compare', 'comparison', 'which is better', 'best insurance', 'recommend', 'suggest', 'which one', 'top insurance', 'best plan', 'vs'],
            responses: [
                'How to choose the best insurance:\n\n🚗 Motor: Compare OD premium + add-ons. Digit & Acko = cheapest online. Bajaj/HDFC ERGO = best cashless network.\n\n🏥 Health: Compare sum insured, room rent limit, waiting period, network hospitals. Star Health = best health-only. Niva Bupa = best family floater.\n\n💝 Life (Term): Compare claim settlement %, premium, riders. Max Life & Tata AIA = 99%+ settlement. LIC = most trusted.\n\nAlways check: Claim settlement ratio, Network (hospitals/garages), Add-ons, Premium, Customer reviews!',
                'My quick recommendations based on common needs:\n\n• Best Budget Term Plan: ICICI Pru iProtect Smart or Tata AIA Sampoorna Raksha\n• Best Health: Star Family Health Optima or Niva Bupa Reassure\n• Best Motor: Digit (online deals) or HDFC ERGO (network)\n• Best Senior Health: Star Red Carpet or Niva Bupa Senior First\n• Best Child Plan: LIC Jeevan Tarun or HDFC YoungStar\n• Best Govt Scheme: PMJJBY + PMSBY (₹456/yr = ₹4L cover!)\n\nWant me to compare specific plans?'
            ]
        },
        renewal: {
            patterns: ['renew', 'renewal', 'expire', 'expiry', 'lapse', 'expired', 'overdue', 'due date'],
            responses: [
                'Insurance Renewal Tips! 🔄\n\n• Renew BEFORE expiry to keep NCB (motor) and no waiting period reset (health)\n• Motor: If lapsed >90 days, you lose NCB and need inspection\n• Health: If lapsed >30 days, waiting periods restart!\n• Life: Grace period 15-30 days; after that policy lapses, revival with medical test\n\nSet calendar reminders 2 weeks before expiry. Most insurers send SMS/email reminders too.',
                'Renewal checklist:\n1. Compare before renewing — you might get better rates elsewhere\n2. Port health insurance to another insurer without losing benefits (IRDAI rule)\n3. Update sum insured if needed\n4. Review and add/remove riders/add-ons\n5. Pay annually (not monthly) to save 5-10%\n6. Use online renewal for additional discounts\n\n⚠️ Never let your policy lapse! Especially health insurance — you lose continuity benefits.'
            ]
        },
        marine: {
            patterns: ['marine', 'cargo', 'shipping', 'goods in transit', 'hull', 'ship insurance'],
            responses: [
                'Marine Insurance! 🚢\n• Marine Cargo: Covers goods in transit (road, rail, sea, air) — damage, loss, theft\n• Marine Hull: Covers the ship/vessel itself\n• Inland Transit: Goods moving within India by road/rail\n\nTypes: Institute Cargo Clause A (all risks), B (named perils), C (minimum)\nPremium: 0.1% to 2% of cargo value\n\nEssential for importers, exporters, e-commerce businesses, and logistics companies.',
                'Marine insurance covers goods from warehouse to warehouse. If you\'re a business shipping products, this is mandatory for bank financing and LC (Letter of Credit) transactions. Major insurers: New India Assurance, United India, ICICI Lombard, HDFC ERGO.'
            ]
        },
        personalAccident: {
            patterns: ['personal accident', 'pa cover', 'accidental death', 'disability', 'accident cover', 'accident insurance'],
            responses: [
                'Personal Accident Insurance! ⚡\n• Covers: Accidental death, permanent total/partial disability, temporary total disability\n• Cover: ₹5L to ₹1Cr\n• Premium: ₹500-₹5,000/yr\n• Includes: Medical expenses, ambulance, broken bones, burns, loss of limbs/eyes\n\nPMSBY gives ₹2L PA cover for just ₹20/year — cheapest in the world!\n\nPA cover is also available as add-on with motor insurance (mandatory for owner-driver: ₹15L).',
                'Personal Accident insurance pays regardless of where the accident happens — road, home, workplace, anywhere! Unlike health insurance, PA gives a lump-sum payout. Good supplement to health and life cover. Consider it especially if you commute daily or work in risky environments.'
            ]
        },
        help: {
            patterns: ['help', 'what can you do', 'features', 'services', 'options', 'menu', 'what do you know', 'capabilities'],
            responses: [
                'I\'m Insurix — your ALL-IN-ONE insurance expert! 🎯 I can help with:\n\n🏍️ Two Wheeler Insurance\n🚗 Car Insurance\n🏥 Health Insurance (Individual, Family, Senior, Critical)\n💝 Life Insurance (Term, Endowment, ULIP, Child, Women)\n✈️ Travel Insurance\n🏠 Home Insurance\n🔐 Cyber Insurance\n🚛 Commercial/Business Insurance\n🌾 Crop/Agriculture Insurance\n🇮🇳 Government Schemes (PMJJBY, PMSBY, Ayushman Bharat, APY)\n📊 Tax Benefits (80C, 80D, NPS)\n🛡️ Add-ons & Riders\n📋 Claims Process\n\nJust ask me anything!',
                'I know EVERYTHING about Indian insurance! Try asking about:\n• Specific insurance types (health, life, motor, travel, home, cyber)\n• Premium calculation and tips to save money\n• Claims process and settlement ratios\n• Government schemes (PM schemes, Ayushman Bharat)\n• Tax benefits under various sections\n• Comparisons between plans and insurers\n• Documents needed\n• Add-ons and riders\n• Renewal tips\n\nOr just tell me your vehicle number and I\'ll pull up all details!'
            ]
        },
        thanks: {
            patterns: ['thanks', 'thank you', 'great', 'awesome', 'nice', 'good', 'perfect', 'cool', 'appreciate', 'helpful'],
            responses: [
                'You\'re welcome! 😊 Feel free to ask anything else about insurance — motor, health, life, travel, home, cyber, tax benefits — I\'m here for it all!',
                'Glad I could help! 🙏 Insurix.India covers every type of insurance. Come back anytime!',
                'Thank you! 🎯 Remember, the right insurance gives you peace of mind. Ask me anything, anytime!'
            ]
        },
        goodbye: {
            patterns: ['bye', 'goodbye', 'see you', 'exit', 'quit', 'close', 'stop', 'end'],
            responses: [
                'Goodbye! 👋 Stay insured, stay protected! Come back anytime you need help with insurance.',
                'See you later! 🙏 Remember — insurance is not an expense, it\'s peace of mind. Take care!',
                'Bye! If you ever have insurance questions, I\'m just a message away. Stay safe! 🛡️'
            ]
        },
        default: {
            responses: [
                'I can help with ALL types of Indian insurance! 🤔 Try asking about:\n• Motor Insurance (Bike/Car/Commercial) 🏍️🚗\n• Health Insurance (Individual/Family/Senior) 🏥\n• Life Insurance (Term/Endowment/ULIP) 💝\n• Travel, Home, Cyber Insurance ✈️🏠🔐\n• Government Schemes (PMJJBY/PMSBY/Ayushman) 🇮🇳\n• Tax Benefits (80C/80D/NPS) 📊\n• Claims, Add-ons, Renewal 📋',
                'I\'m your expert on every Indian insurance — big or small! Could you rephrase your question? I can help with motor, health, life, travel, home, cyber, crop, commercial insurance, government schemes, tax benefits, and much more!'
            ]
        }
    };

    // ===== TELUGU QUICK REPLIES =====
    const teluguQuickReplies = [
        { text: '🏍️ బైక్ బీమా', query: 'టూ వీలర్ బీమా గురించి చెప్పండి' },
        { text: '🚗 కార్ బీమా', query: 'కార్ బీమా గురించి చెప్పండి' },
        { text: '🏥 ఆరోగ్య బీమా', query: 'ఆరోగ్య బీమా ప్లాన్లు చెప్పండి' },
        { text: '💝 జీవిత బీమా', query: 'జీవిత బీమా గురించి చెప్పండి' },
        { text: '✈️ ట్రావెల్ బీమా', query: 'ట్రావెల్ బీమా గురించి చెప్పండి' },
        { text: '🏠 హోమ్ బీమా', query: 'హోమ్ బీమా గురించి చెప్పండి' },
        { text: '🔐 సైబర్ బీమా', query: 'సైబర్ బీమా గురించి చెప్పండి' },
        { text: '🇮🇳 ప్రభుత్వ పథకాలు', query: 'ప్రభుత్వ బీమా పథకాలు చెప్పండి' },
        { text: '📊 Tax Benefits', query: 'బీమా పన్ను ప్రయోజనాలు చెప్పండి' },
        { text: '📋 క్లెయిమ్', query: 'క్లెయిమ్ ఎలా చేయాలి?' },
        { text: '🎁 NCB', query: 'NCB ఎలా పనిచేస్తుంది?' },
        { text: '🎯 సహాయం', query: 'మీరు ఏమి చేయగలరు?' }
    ];

    const englishQuickReplies = [
        { text: '🏍️ Bike Insurance', query: 'Tell me about two wheeler insurance' },
        { text: '🚗 Car Insurance', query: 'Tell me about car insurance' },
        { text: '🏥 Health Insurance', query: 'Health insurance plans and options' },
        { text: '💝 Life Insurance', query: 'Tell me about life insurance options' },
        { text: '✈️ Travel Insurance', query: 'Tell me about travel insurance' },
        { text: '🏠 Home Insurance', query: 'Tell me about home insurance' },
        { text: '🔐 Cyber Insurance', query: 'Tell me about cyber insurance' },
        { text: '🇮🇳 Govt Schemes', query: 'Government insurance schemes in India' },
        { text: '📊 Tax Benefits', query: 'Insurance tax benefits in India' },
        { text: '📋 Claims', query: 'How to file an insurance claim?' },
        { text: '🎁 NCB', query: 'How does NCB work?' },
        { text: '🎯 Help', query: 'What insurance topics can you help with?' }
    ];

    // ===== INIT SPEECH SYNTHESIS =====
    function initVoices() {
        const voices = window.speechSynthesis.getVoices();
        
        // Find Telugu voice
        teluguVoice = voices.find(v => v.lang === 'te-IN') 
            || voices.find(v => v.lang.startsWith('te'))
            || voices.find(v => v.name.toLowerCase().includes('telugu'));
        
        // Find Indian English voice
        englishVoice = voices.find(v => v.lang === 'en-IN')
            || voices.find(v => v.lang === 'en-US')
            || voices.find(v => v.lang.startsWith('en'));
        
        console.log('🔊 TTS Voices loaded:', {
            telugu: teluguVoice?.name || 'Not available',
            english: englishVoice?.name || 'Not available',
            total: voices.length
        });
    }

    // Load voices (Chrome loads async)
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = initVoices;
        initVoices(); // For Firefox/Safari
    }

    // ===== SPEAK TEXT =====
    function speak(text, lang) {
        if (!voiceEnabled || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean text for speech (remove emojis, bullets, etc.)
        const cleanText = text
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/[•\n]/g, '. ')
            .replace(/[1-9]️⃣/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        if (lang === 'te' || (lang === undefined && currentLang === 'te')) {
            utterance.voice = teluguVoice;
            utterance.lang = 'te-IN';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
        } else {
            utterance.voice = englishVoice;
            utterance.lang = 'en-IN';
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
        }

        utterance.onstart = () => { isSpeaking = true; updateSpeakingUI(true); };
        utterance.onend = () => { isSpeaking = false; updateSpeakingUI(false); };
        utterance.onerror = () => { isSpeaking = false; updateSpeakingUI(false); };

        window.speechSynthesis.speak(utterance);
    }

    // ===== STOP SPEAKING =====
    function stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        updateSpeakingUI(false);
    }

    // ===== MATCH INTENT =====
    function matchIntent(userMessage) {
        const msg = userMessage.toLowerCase().trim();
        const kb = currentLang === 'te' ? teluguKB : englishKB;

        // Check each category
        for (const [category, data] of Object.entries(kb)) {
            if (category === 'default') continue;
            
            for (const pattern of data.patterns) {
                if (msg.includes(pattern.toLowerCase())) {
                    const responses = data.responses;
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }

        // Default response
        const defaults = kb.default.responses;
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    // ===== PROCESS MESSAGE =====
    function processMessage(userMessage) {
        const response = matchIntent(userMessage);
        return response;
    }

    // ===== UI UPDATE HELPERS =====
    function updateSpeakingUI(speaking) {
        const indicator = document.getElementById('speakingIndicator');
        if (indicator) {
            indicator.style.display = speaking ? 'flex' : 'none';
        }
        const voiceBtn = document.getElementById('voiceToggleBtn');
        if (voiceBtn) {
            voiceBtn.classList.toggle('speaking', speaking);
        }
    }

    // ===== GET QUICK REPLIES =====
    function getQuickReplies() {
        return currentLang === 'te' ? teluguQuickReplies : englishQuickReplies;
    }

    // ===== GET WELCOME MESSAGE =====
    function getWelcomeMessage() {
        if (currentLang === 'te') {
            return 'నమస్కారం! 🙏 నేను Insurix AI సహాయకురాలిని. తెలుగులో బీమా గురించి అడగండి! నేను మీతో తెలుగులో మాట్లాడగలను. 🔊';
        }
        return 'Hello! 👋 I\'m the Insurix AI assistant. Ask me anything about insurance! I can speak to you as well. 🔊';
    }

    // ===== PUBLIC API =====
    return {
        processMessage,
        speak,
        stopSpeaking,
        getQuickReplies,
        getWelcomeMessage,
        initVoices,
        get currentLang() { return currentLang; },
        set currentLang(lang) { currentLang = lang; },
        get voiceEnabled() { return voiceEnabled; },
        set voiceEnabled(val) { voiceEnabled = val; },
        get isSpeaking() { return isSpeaking; }
    };
})();

window.InsurixChatbot = InsurixChatbot;
