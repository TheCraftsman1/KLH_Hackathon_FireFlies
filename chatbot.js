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
                'నమస్కారం! 🙏 Insurix.India కి స్వాగతం. మీకు ఏ రకమైన బీమా గురించి సహాయం కావాలి?',
                'హలో! 👋 నేను మీ బీమా సహాయకురాలిని. మీకు ఎలా సహాయం చేయగలను?',
                'నమస్తే! మీ బీమా అవసరాలకు నేను సిద్ధంగా ఉన్నాను. చెప్పండి!'
            ]
        },

        // Two-wheeler insurance
        twoWheeler: {
            patterns: ['టూ వీలర్', 'బైక్', 'బండి', 'two wheeler', 'bike', 'motorcycle', 'స్కూటర్', 'scooter', 'బైక్ బీమా', 'బండి బీమా', 'వాహనం', 'vehicle'],
            responses: [
                'టూ వీలర్ బీమా గురించి! 🏍️ మీ బైక్ రిజిస్ట్రేషన్ నంబర్ ఇస్తే, మేము IDV, ప్రీమియం అన్నీ చెప్తాం. IRDAI రేట్లు ప్రకారం:\n• 75cc కింద: ₹538/సంవత్సరం\n• 75-150cc: ₹714/సంవత్సరం\n• 150-350cc: ₹1,366/సంవత్సరం\n• 350cc పైన: ₹2,804/సంవత్సరం',
                'బైక్ ఇన్సూరెన్స్ కోసం మేము 6 బీమా కంపెనీల నుండి quotes ఇస్తాము! 🛡️ Comprehensive లేదా Third Party Only - మీకు ఏది కావాలి?',
                'మీ బండికి బీమా కావాలా? మా Two Wheeler Insurance పేజీలో మీ వాహన నంబర్ ఎంటర్ చేస్తే, 30 సెకన్లలో quotes వస్తాయి!'
            ]
        },

        // Health insurance
        health: {
            patterns: ['ఆరోగ్య బీమా', 'హెల్త్', 'health', 'medical', 'hospital', 'ఆరోగ్యం', 'ఆసుపత్రి', 'వైద్యం', 'మెడికల్'],
            responses: [
                'ఆరోగ్య బీమా చాలా ముఖ్యం! 🏥 కుటుంబ ఆరోగ్య బీమా ₹500/నెలకు మొదలవుతుంది. ప్రధాన ప్రయోజనాలు:\n• క్యాష్‌లెస్ చికిత్స 7000+ ఆసుపత్రులలో\n• ముందుగా ఉన్న వ్యాధులకు కవరేజ్\n• రూమ్ రెంట్ లేకుండా కవరేజ్',
                'హెల్త్ ఇన్సూరెన్స్ ప్లాన్లు ₹5 లక్షల నుండి ₹1 కోటి వరకు కవరేజ్ అందిస్తాయి. 51+ బీమా కంపెనీలను compare చేయండి!',
                'మీ కుటుంబం ఆరోగ్యంగా ఉండాలంటే, ఆరోగ్య బీమా తీసుకోండి! మేము ఉత్తమ ప్లాన్ కనుగొనడంలో సహాయం చేస్తాము.'
            ]
        },

        // Life insurance
        life: {
            patterns: ['జీవిత బీమా', 'లైఫ్', 'life', 'term', 'టర్మ్', 'మరణం', 'death', 'జీవితం'],
            responses: [
                'జీవిత బీమా మీ కుటుంబాన్ని రక్షిస్తుంది! 💝 టర్మ్ లైఫ్ ఇన్సూరెన్స్ ₹490/నెలకు మొదలవుతుంది:\n• ₹1 కోటి కవరేజ్\n• ప్రీమియం తిరిగి ఇవ్వడం ఆప్షన్\n• 99.1% క్లెయిమ్ సెటిల్మెంట్ రేషియో',
                'టర్మ్ ప్లాన్ తో ₹25/రోజుకు ₹1 కోటి కవరేజ్ పొందండి! మీ వయసు, ఆదాయం బట్టి ఉత్తమ ప్లాన్ సూచిస్తాము.',
                'లైఫ్ ఇన్సూరెన్స్ మీ కుటుంబ భవిష్యత్తుకు భద్రత ఇస్తుంది. ఇప్పుడే compare చేసి, save చేయండి!'
            ]
        },

        // Premium / price
        premium: {
            patterns: ['ధర', 'ప్రీమియం', 'premium', 'price', 'cost', 'ఎంత', 'rate', 'రేటు', 'ఖర్చు', 'డబ్బు'],
            responses: [
                'ప్రీమియం మీ వాహనం వయసు, IDV, CC బట్టి మారుతుంది. IRDAI నిర్ణయించిన Third Party రేట్లు:\n• 75cc కింద: ₹538\n• 75-150cc: ₹714\n• 150-350cc: ₹1,366\n• 350cc పైన: ₹2,804\n\nNCB (No Claim Bonus) తో 50% వరకు తగ్గింపు పొందవచ్చు!',
                'ప్రీమియం తగ్గించడానికి టిప్స్:\n1️⃣ NCB క్లెయిమ్ చేయండి (20-50% తగ్గింపు)\n2️⃣ ఆన్‌లైన్‌లో కొనండి (తక్కువ ధర)\n3️⃣ సకాలంలో రెన్యూ చేయండి\n4️⃣ కంపెనీలను compare చేయండి',
                'ధర తెలుసుకోవాలా? మా ప్రీమియం కాలుక్యులేటర్ ఉపయోగించండి - IDV మరియు NCB ఆధారంగా ఖచ్చితమైన quote ఇస్తుంది!'
            ]
        },

        // Claim
        claim: {
            patterns: ['క్లెయిమ్', 'claim', 'ప్రమాదం', 'accident', 'damage', 'నష్టం', 'దెబ్బ'],
            responses: [
                'క్లెయిమ్ చేయడం సులభం! 📋 స్టెప్స్:\n1️⃣ ఫస్ట్ FIR ఫైల్ చేయండి (ప్రమాదం జరిగితే)\n2️⃣ బీమా కంపెనీకి తెలియజేయండి (హెల్ప్‌లైన్ కాల్)\n3️⃣ డాక్యుమెంట్లు సబ్మిట్ చేయండి\n4️⃣ సర్వేయర్ తనిఖీ\n5️⃣ క్యాష్‌లెస్ రిపేర్ లేదా రీయింబర్స్‌మెంట్',
                'క్లెయిమ్ సెటిల్మెంట్ రేషియో ముఖ్యం! మా టాప్ insurers:\n• Bajaj Allianz: 98.1%\n• HDFC ERGO: 97.8%\n• ICICI Lombard: 96.5%\n\n24/7 క్లెయిమ్ సపోర్ట్ అందుబాటులో ఉంది.',
                'ప్రమాదం జరిగిందా? చింతించకండి! మా 24/7 హెల్ప్‌లైన్ కి కాల్ చేయండి. క్యాష్‌లెస్ రిపేర్ 5000+ గ్యారేజీలలో అందుబాటులో ఉంది.'
            ]
        },

        // RTO / Registration
        rto: {
            patterns: ['rto', 'ఆర్టీఓ', 'రిజిస్ట్రేషన్', 'registration', 'rc', 'నంబర్', 'number', 'వాహన నంబర్'],
            responses: [
                'మీ వాహన రిజిస్ట్రేషన్ నంబర్ ఎంటర్ చేస్తే, మేము అన్ని వివరాలు చూపిస్తాము! 🔍\n\nఉదాహరణ: TS 09 AB 1234, AP 28 CD 5678\n\nమా Vehicle Lookup API 30+ రాష్ట్రాల RTO డేటాబేస్ నుండి రియల్-టైమ్ సమాచారం ఇస్తుంది.',
                'RTO వివరాలు కావాలా? Two Wheeler Insurance పేజీలో "Enter Vehicle Number" టాబ్ క్లిక్ చేసి, మీ నంబర్ ఎంటర్ చేయండి. Make, Model, Year, IDV అన్నీ ఆటోమేటిక్ గా వస్తాయి!',
                'రిజిస్ట్రేషన్ నంబర్ ఫార్మాట్: [రాష్ట్ర కోడ్] [జిల్లా కోడ్] [సీరీస్] [నంబర్]\nఉదాహరణ: TS 09 AB 1234\n\nTS = తెలంగాణ, 09 = హైదరాబాద్ RTO'
            ]
        },

        // IDV
        idv: {
            patterns: ['idv', 'ఐడీవీ', 'విలువ', 'value', 'insured declared value', 'మార్కెట్ విలువ'],
            responses: [
                'IDV (Insured Declared Value) అంటే మీ వాహనం యొక్క ప్రస్తుత మార్కెట్ విలువ. 💰\n\nIDV = Ex-Showroom Price - Depreciation\n\nDepreciation రేట్లు (IRDAI):\n• 6 నెలల్లోపు: 5%\n• 1 సంవత్సరం: 15%\n• 2 సంవత్సరాలు: 20%\n• 3 సంవత్సరాలు: 30%\n• 4 సంవత్సరాలు: 40%\n• 5+ సంవత్సరాలు: 50%',
                'IDV ఎక్కువ ఉంటే ప్రీమియం ఎక్కువ, కానీ క్లెయిమ్ ఎక్కువ వస్తుంది. IDV తక్కువ ఉంటే ప్రీమియం తక్కువ, కానీ నష్టపరిహారం తక్కువ. సరైన IDV ఎంచుకోవడం ముఖ్యం!'
            ]
        },

        // Documents
        documents: {
            patterns: ['డాక్యుమెంట్', 'document', 'పత్రాలు', 'papers', 'ఏమి కావాలి', 'required'],
            responses: [
                'బీమా కొనడానికి కావలసిన డాక్యుమెంట్లు: 📄\n\nకొత్త వాహనం:\n• వాహన ఇన్వాయిస్\n• RC (రిజిస్ట్రేషన్ సర్టిఫికేట్)\n• PAN కార్డ్\n• ఆధార్ కార్డ్\n\nరెన్యూవల్:\n• గత పాలసీ కాపీ\n• RC\n• NCB సర్టిఫికేట్',
                'డాక్యుమెంట్లు సిద్ధం చేసుకోండి: RC, PAN కార్డ్, ఆధార్, మరియు గత పాలసీ (రెన్యూవల్ అయితే). అన్నీ ఆన్‌లైన్‌లో అప్‌లోడ్ చేయవచ్చు!'
            ]
        },

        // NCB
        ncb: {
            patterns: ['ncb', 'ఎన్సీబీ', 'no claim', 'నో క్లెయిమ్', 'బోనస్', 'bonus', 'తగ్గింపు', 'discount'],
            responses: [
                'NCB (No Claim Bonus) - క్లెయిమ్ చేయకపోతే తగ్గింపు! 🎁\n\n• 1 సంవత్సరం: 20% తగ్గింపు\n• 2 సంవత్సరాలు: 25%\n• 3 సంవత్సరాలు: 35%\n• 4 సంవత్సరాలు: 45%\n• 5+ సంవత్సరాలు: 50% తగ్గింపు\n\nNCB OD ప్రీమియంపై మాత్రమే వర్తిస్తుంది.',
                'NCB ను బదిలీ (transfer) చేయడం కూడా సాధ్యమే! మీరు వాహనం మారిస్తే కొత్త వాహనానికి NCB బదిలీ చేయవచ్చు. బీమా రెన్యూవల్ సమయంలో NCB క్లెయిమ్ చేయడం మర్చిపోకండి!'
            ]
        },

        // Thanks
        thanks: {
            patterns: ['ధన్యవాదం', 'thanks', 'thank you', 'థ్యాంక్స్', 'బాగుంది', 'సూపర్', 'great', 'nice', 'good'],
            responses: [
                'ధన్యవాదాలు! 😊 మీకు ఇంకా ఏదైనా సహాయం కావాలంటే అడగండి. మీ బీమా విషయాల్లో మేము ఎల్లప్పుడూ సిద్ధంగా ఉన్నాము!',
                'మీ feedback కి ధన్యవాదాలు! 🙏 Insurix.India తో మీ బీమా అనుభవం ఇంకా మెరుగ్గా ఉంటుంది. మరిన్ని ప్రశ్నలు ఉంటే తప్పక అడగండి!',
                'థ్యాంక్ యూ! మీకు ఉత్తమమైన బీమా అందించడం మా లక్ష్యం. 🎯'
            ]
        },

        // Default
        default: {
            responses: [
                'నాకు అర్థం కాలేదు. 🤔 దయచేసి కింది అంశాల గురించి అడగండి:\n• టూ వీలర్ బీమా 🏍️\n• ఆరోగ్య బీమా 🏥\n• జీవిత బీమా 💝\n• ప్రీమియం/ధర 💰\n• క్లెయిమ్ 📋\n• IDV/NCB విలువ',
                'క్షమించండి, ఆ విషయం గురించి నాకు తెలియదు. కానీ బీమా సంబంధమైన ఏ ప్రశ్నకైనా సమాధానం ఇస్తాను! మీ ప్రశ్న మళ్ళీ చెప్పగలరా?',
                'నేను బీమా విషయాల్లో expertise కలిగి ఉన్నాను. బైక్ బీమా, హెల్త్ బీమా, లైఫ్ బీమా - ఏది కావాలో చెప్పండి!'
            ]
        }
    };

    // ===== ENGLISH INSURANCE KNOWLEDGE BASE =====
    const englishKB = {
        greetings: {
            patterns: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'howdy'],
            responses: [
                'Hello! 👋 Welcome to Insurix.India. How can I help you with insurance today?',
                'Hi there! 🙏 I\'m your insurance assistant. Ask me anything about bike, health, or life insurance!',
                'Hey! Ready to help you find the best insurance plans. What are you looking for?'
            ]
        },
        twoWheeler: {
            patterns: ['two wheeler', 'bike', 'motorcycle', 'scooter', 'vehicle', 'bike insurance', 'motor'],
            responses: [
                'Two Wheeler Insurance! 🏍️ Enter your registration number and we\'ll fetch all details. IRDAI Third Party rates:\n• Below 75cc: ₹538/year\n• 75-150cc: ₹714/year\n• 150-350cc: ₹1,366/year\n• Above 350cc: ₹2,804/year\n\nCompare 6 insurers instantly!',
                'Looking for bike insurance? We compare HDFC ERGO, ICICI Lombard, Bajaj Allianz, Tata AIG, SBI General & Max Life. Get the best quote in 30 seconds!'
            ]
        },
        health: {
            patterns: ['health', 'medical', 'hospital', 'sick', 'doctor', 'health insurance'],
            responses: [
                'Health Insurance plans start from ₹500/month! 🏥\n• Cashless treatment at 7000+ hospitals\n• Coverage from ₹5L to ₹1Cr\n• Pre-existing disease coverage\n• No room rent capping\n\nCompare 51+ insurers now!',
                'Protect your family with health insurance! We\'ll help you find the perfect plan based on your needs and budget.'
            ]
        },
        life: {
            patterns: ['life', 'term', 'death', 'life insurance', 'term plan'],
            responses: [
                'Term Life Insurance from ₹490/month! 💝\n• ₹1 Crore coverage\n• 99.1% claim settlement ratio\n• Premium return option available\n\nThat\'s just ₹25/day for ₹1 Crore protection!',
                'Life insurance protects your family\'s financial future. Compare plans from top insurers and save up to 25% online!'
            ]
        },
        premium: {
            patterns: ['premium', 'price', 'cost', 'rate', 'how much', 'expensive', 'cheap', 'affordable'],
            responses: [
                'Premium depends on your vehicle age, IDV, and CC. IRDAI fixed TP rates:\n• Below 75cc: ₹538\n• 75-150cc: ₹714\n• 150-350cc: ₹1,366\n• Above 350cc: ₹2,804\n\nGet up to 50% NCB discount!',
                'Tips to reduce premium:\n1️⃣ Claim your NCB (20-50% off)\n2️⃣ Buy online (lower rates)\n3️⃣ Renew on time\n4️⃣ Compare across insurers'
            ]
        },
        claim: {
            patterns: ['claim', 'accident', 'damage', 'repair', 'cashless'],
            responses: [
                'Filing a claim is easy! 📋\n1. File FIR (if accident)\n2. Notify insurer (helpline call)\n3. Submit documents\n4. Surveyor inspection\n5. Cashless repair or reimbursement\n\n24/7 claims support available!',
                'Our top insurers have excellent claim ratios:\n• Bajaj Allianz: 98.1%\n• HDFC ERGO: 97.8%\n• ICICI Lombard: 96.5%\n\nCashless repairs at 5000+ garages nationwide.'
            ]
        },
        rto: {
            patterns: ['rto', 'registration', 'rc', 'number', 'vehicle number', 'lookup'],
            responses: [
                'Enter your vehicle registration number and we\'ll fetch all details! 🔍\n\nExample: TS 09 AB 1234, MH 02 CD 5678\n\nOur API covers 30+ states with real-time RTO data. Try it on the Two Wheeler Insurance page!',
                'Vehicle lookup returns: Make, Model, Year, CC, IDV, Premium, and insurance quotes — all from your registration number!'
            ]
        },
        idv: {
            patterns: ['idv', 'insured declared value', 'market value', 'depreciation'],
            responses: [
                'IDV = Current market value of your vehicle 💰\n\nIDV = Ex-Showroom Price - Depreciation\n\nDepreciation rates (IRDAI):\n• 6 months: 5%\n• 1 year: 15%\n• 2 years: 20%\n• 3 years: 30%\n• 4 years: 40%\n• 5+ years: 50%',
                'Higher IDV = Higher premium but better claim payout. Lower IDV = Lower premium but less compensation. Choose wisely!'
            ]
        },
        ncb: {
            patterns: ['ncb', 'no claim bonus', 'bonus', 'discount'],
            responses: [
                'NCB (No Claim Bonus) rewards claim-free years! 🎁\n• 1 year: 20% off\n• 2 years: 25% off\n• 3 years: 35% off\n• 4 years: 45% off\n• 5+ years: 50% off\n\nApplies to OD premium only.',
                'You can transfer NCB to a new vehicle! Don\'t forget to claim NCB during renewal.'
            ]
        },
        thanks: {
            patterns: ['thanks', 'thank you', 'great', 'awesome', 'nice', 'good', 'perfect', 'cool'],
            responses: [
                'You\'re welcome! 😊 Feel free to ask anything else about insurance. We\'re always here to help!',
                'Glad I could help! 🙏 Insurix.India is committed to giving you the best insurance experience.',
                'Thank you! 🎯 Our goal is to make insurance simple for everyone.'
            ]
        },
        default: {
            responses: [
                'I\'m not sure about that. 🤔 Try asking about:\n• Two Wheeler Insurance 🏍️\n• Health Insurance 🏥\n• Life Insurance 💝\n• Premium/Pricing 💰\n• Claims 📋\n• IDV/NCB',
                'I specialize in insurance topics. Could you rephrase your question? I can help with bike insurance, health insurance, life insurance, and more!'
            ]
        }
    };

    // ===== TELUGU QUICK REPLIES =====
    const teluguQuickReplies = [
        { text: '🏍️ బైక్ బీమా', query: 'బైక్ బీమా గురించి చెప్పండి' },
        { text: '🏥 ఆరోగ్య బీమా', query: 'ఆరోగ్య బీమా ప్లాన్లు చెప్పండి' },
        { text: '💰 ప్రీమియం', query: 'ప్రీమియం ఎంత?' },
        { text: '📋 క్లెయిమ్', query: 'క్లెయిమ్ ఎలా చేయాలి?' },
        { text: '🔍 IDV', query: 'IDV అంటే ఏమిటి?' },
        { text: '🎁 NCB', query: 'NCB ఎలా పనిచేస్తుంది?' }
    ];

    const englishQuickReplies = [
        { text: '🏍️ Bike Insurance', query: 'Tell me about two wheeler insurance' },
        { text: '🏥 Health Insurance', query: 'Health insurance plans' },
        { text: '💰 Premium', query: 'How much is the premium?' },
        { text: '📋 Claims', query: 'How to file a claim?' },
        { text: '🔍 IDV', query: 'What is IDV?' },
        { text: '🎁 NCB', query: 'How does NCB work?' }
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
