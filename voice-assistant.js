// ===== INSURIX VOICE ASSISTANT - PREMIUM UI/UX OVERHAUL =====
(function () {
    'use strict';

    // ===== CONFIG =====
    const API_BASE = window.location.origin;
    let currentLang = 'te';
    let isListening = false;
    let isSpeaking = false;
    let isThinking = false;
    let conversationHistory = [];
    let recognition = null;
    let silenceTimer = null;
    let fullTranscript = '';
    const SILENCE_TIMEOUT = 6000;
    let userStoppedManually = false;
    let lastDetectedVehicle = null;
    let state = 'idle';

    // ===== DOM REFS =====
    const $ = id => document.getElementById(id);
    const messagesContainer = $('messagesContainer');
    const voiceOrb = $('voiceOrb');
    const orbIcon = $('orbIcon');
    const orbLabel = $('orbLabel');
    const orbWrap = $('orbWrap');
    const waveCanvas = $('waveCanvas');
    const bgCanvas = $('bgCanvas');
    const textInput = $('textInput');
    const sendBtn = $('sendBtn');
    const langBtn = $('langBtn');
    const langLabel = $('langLabel');
    const statusIndicator = $('statusIndicator');
    const statusText = $('statusText');
    const suggestionsBar = $('suggestionsBar');
    const infoPanel = $('infoPanel');
    const infoPlaceholder = $('infoPlaceholder');
    const infoCards = $('infoCards');
    const ttsAudio = $('ttsAudio');
    const liveTranscript = $('liveTranscript');
    const transcriptText = $('transcriptText');
    const transcriptLabel = $('transcriptLabel');
    const vehicleDetectBanner = $('vehicleDetectBanner');
    const detectedNumber = $('detectedNumber');
    const vehicleNumberInput = $('vehicleNumberInput');
    const vehicleLookupBtn = $('vehicleLookupBtn');
    const numberPlate = $('numberPlate');
    const toastContainer = $('toastContainer');
    const mobilePanelToggle = $('mobilePanelToggle');
    const toggleBadge = $('toggleBadge');

    // ===== LANGUAGE DATA =====
    const langData = {
        te: {
            label: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41',
            welcome: '\u0C39\u0C3E\u0C2F\u0C4D! \uD83D\uDE4F \u0C28\u0C47\u0C28\u0C41 \u0C2E\u0C40 insurance buddy Insurix! \u0C2C\u0C48\u0C15\u0C4D, \u0C15\u0C3E\u0C30\u0C4D, \u0C39\u0C46\u0C32\u0C4D\u0C24\u0C4D \u0C07\u0C28\u0C4D\u0C38\u0C42\u0C30\u0C46\u0C28\u0C4D\u0C38\u0C4D \u2014 \u0C0F\u0C26\u0C3F \u0C15\u0C3E\u0C35\u0C3E\u0C32\u0C28\u0C4D\u0C28\u0C3E \u0C28\u0C28\u0C4D\u0C28\u0C41 \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F. \u0C2E\u0C40 \u0C35\u0C3E\u0C39\u0C28 \u0C28\u0C02\u0C2C\u0C30\u0C4D \u0C1A\u0C46\u0C2A\u0C4D\u0C24\u0C47 \u0C1A\u0C3E\u0C32\u0C41, \u0C05\u0C02\u0C24\u0C3E \u0C28\u0C47\u0C28\u0C41 \u0C1A\u0C42\u0C38\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C3E\u0C28\u0C41! \uD83D\uDE0A',
            found: '\uD83C\uDFCD\uFE0F {num} \u0C26\u0C4A\u0C30\u0C3F\u0C15\u0C3F\u0C02\u0C26\u0C3F! Owner: {owner}, Vehicle: {model} ({year}), Fuel: {fuel}. Insurance: {status}',
            noSpeech: '\u0C2E\u0C3E\u0C1F\u0C32\u0C41 \u0C35\u0C3F\u0C28\u0C2C\u0C21\u0C32\u0C47\u0C26\u0C41. \u0C2E\u0C33\u0C4D\u0C33\u0C40 \u0C2A\u0C4D\u0C30\u0C2F\u0C24\u0C4D\u0C28\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F!',
            placeholder: '\u0C2E\u0C40 \u0C2A\u0C4D\u0C30\u0C36\u0C4D\u0C28 \u0C1F\u0C48\u0C2A\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F...',
            tapToSpeak: '\u0C2E\u0C3E\u0C1F\u0C4D\u0C32\u0C3E\u0C21\u0C1F\u0C3E\u0C28\u0C3F\u0C15\u0C3F \u0C28\u0C4A\u0C15\u0C4D\u0C15\u0C02\u0C21\u0C3F',
            listening: '\u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C02\u0C21\u0C3F, \u0C35\u0C3F\u0C02\u0C1F\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41... \uD83C\uDFA4',
            thinking: '\u0C12\u0C15\u0C4D\u0C15 \u0C38\u0C46\u0C15\u0C28\u0C4D, \u0C1A\u0C42\u0C38\u0C4D\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E...',
            speaking: '\u0C1A\u0C46\u0C2C\u0C41\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41...',
            ready: '\u0C38\u0C3F\u0C26\u0C4D\u0C27\u0C02',
            chips: [
                '\u0C2C\u0C48\u0C15\u0C4D \u0C07\u0C28\u0C4D\u0C38\u0C42\u0C30\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C27\u0C30 \u0C0E\u0C02\u0C24?',
                '\u0C28\u0C3E \u0C35\u0C3E\u0C39\u0C28\u0C02 TS09AB1234',
                '\u0C25\u0C30\u0C4D\u0C21\u0C4D \u0C2A\u0C3E\u0C30\u0C4D\u0C1F\u0C40 vs \u0C15\u0C3E\u0C02\u0C2A\u0C4D\u0C30\u0C39\u0C46\u0C28\u0C4D\u0C38\u0C3F\u0C35\u0C4D',
                '\u0C15\u0C4D\u0C32\u0C46\u0C2F\u0C3F\u0C2E\u0C4D \u0C0E\u0C32\u0C3E \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C3F?',
                'NCB \u0C05\u0C02\u0C1F\u0C47 \u0C0F\u0C2E\u0C3F\u0C1F\u0C3F?',
                '\u0C39\u0C46\u0C32\u0C4D\u0C24\u0C4D \u0C07\u0C28\u0C4D\u0C38\u0C42\u0C30\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C2A\u0C4D\u0C32\u0C3E\u0C28\u0C4D\u0C38\u0C4D'
            ]
        },
        en: {
            label: 'English',
            welcome: "Hey there! \uD83D\uDC4B I'm Insurix, your insurance buddy! Need help with bike, car, or health insurance? Just tell me your vehicle number and I'll pull up everything for you! \uD83D\uDE0A",
            found: '\uD83C\uDFCD\uFE0F Found {num}! Owner: {owner}, Vehicle: {model} ({year}), Fuel: {fuel}. Insurance Status: {status}',
            noSpeech: 'No speech detected. Please try again!',
            placeholder: 'Type your question...',
            tapToSpeak: 'Tap to speak',
            listening: "Go ahead, I'm listening... \uD83C\uDFA4",
            thinking: 'Hang on, checking...',
            speaking: 'Speaking...',
            ready: 'Ready',
            chips: [
                'Two-wheeler insurance price?',
                'My vehicle is TS09AB1234',
                'Third party vs comprehensive',
                'How to file a claim?',
                'What is NCB?',
                'Health insurance plans'
            ]
        },
        hi: {
            label: '\u0939\u093F\u0928\u094D\u0926\u0940',
            welcome: '\u0939\u0947\u0932\u094B \u0926\u094B\u0938\u094D\u0924! \uD83D\uDE4F \u092E\u0948\u0902 Insurix \u0939\u0942\u0901, \u0906\u092A\u0915\u093E insurance buddy! \u092C\u093E\u0907\u0915, \u0915\u093E\u0930, \u0939\u0947\u0932\u094D\u0925 \u0907\u0902\u0936\u094D\u092F\u094B\u0930\u0947\u0902\u0938 \u2014 \u0915\u0941\u091B \u092D\u0940 \u092A\u0942\u091B\u094B\u0964 \u092C\u0938 \u0905\u092A\u0928\u093E \u0935\u093E\u0939\u0928 \u0928\u0902\u092C\u0930 \u092C\u0924\u093E\u0913, \u092C\u093E\u0915\u0940 \u092E\u0948\u0902 \u0926\u0947\u0916 \u0932\u0942\u0901\u0917\u093E! \uD83D\uDE0A',
            found: '\uD83C\uDFCD\uFE0F {num} \u092E\u093F\u0932 \u0917\u092F\u093E! \u092E\u093E\u0932\u093F\u0915: {owner}, \u0935\u093E\u0939\u0928: {model} ({year}), \u0908\u0902\u0927\u0928: {fuel}. \u092C\u0940\u092E\u093E: {status}',
            noSpeech: '\u0906\u0935\u093E\u091C\u093C \u0928\u0939\u0940\u0902 \u0938\u0941\u0928\u093E\u0908\u0964 \u0926\u094B\u092C\u093E\u0930\u093E \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902!',
            placeholder: '\u0905\u092A\u0928\u093E \u0938\u0935\u093E\u0932 \u091F\u093E\u0907\u092A \u0915\u0930\u0947\u0902...',
            tapToSpeak: '\u092C\u094B\u0932\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u091F\u0948\u092A \u0915\u0930\u0947\u0902',
            listening: '\u092C\u094B\u0932\u094B, \u0938\u0941\u0928 \u0930\u0939\u093E \u0939\u0942\u0901... \uD83C\uDFA4',
            thinking: '\u090F\u0915 \u0938\u0947\u0915\u0902\u0921, \u0926\u0947\u0916 \u0930\u0939\u093E \u0939\u0942\u0901...',
            speaking: '\u092C\u094B\u0932 \u0930\u0939\u093E \u0939\u0942\u0901...',
            ready: '\u0924\u0948\u092F\u093E\u0930',
            chips: [
                '\u092C\u093E\u0907\u0915 \u0907\u0902\u0936\u094D\u092F\u094B\u0930\u0947\u0902\u0938 \u092A\u094D\u0930\u093E\u0907\u0938?',
                '\u092E\u0947\u0930\u093E \u0935\u093E\u0939\u0928 TS09AB1234',
                '\u0925\u0930\u094D\u0921 \u092A\u093E\u0930\u094D\u091F\u0940 vs \u0915\u0949\u092E\u094D\u092A\u094D\u0930\u093F\u0939\u0947\u0902\u0938\u093F\u0935',
                '\u0915\u094D\u0932\u0947\u092E \u0915\u0948\u0938\u0947 \u0915\u0930\u0947\u0902?',
                'NCB \u0915\u094D\u092F\u093E \u0939\u0948?',
                '\u0939\u0947\u0932\u094D\u0925 \u0907\u0902\u0936\u094D\u092F\u094B\u0930\u0947\u0902\u0938 \u092A\u094D\u0932\u093E\u0928'
            ]
        }
    };

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type = 'info', duration = 3500) {
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle', vehicle: 'fa-motorcycle' };
        const toast = document.createElement('div');
        toast.className = 'va-toast ' + type;
        toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('va-toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== BACKGROUND PARTICLES =====
    function initBgCanvas() {
        const ctx = bgCanvas.getContext('2d');
        let w, h, particles = [];
        function resize() { w = bgCanvas.width = window.innerWidth; h = bgCanvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        for (let i = 0; i < 50; i++) {
            particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25, o: Math.random() * 0.25 + 0.05 });
        }
        function draw() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, ' + p.o + ')';
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();
    }

    // ===== VOICE WAVEFORM =====
    let waveAmplitude = 0, targetAmplitude = 0;
    function initWaveCanvas() {
        const ctx = waveCanvas.getContext('2d');
        const size = waveCanvas.width;
        const center = size / 2;
        const baseRadius = 65;
        function draw() {
            ctx.clearRect(0, 0, size, size);
            waveAmplitude += (targetAmplitude - waveAmplitude) * 0.08;
            const now = Date.now() / 1000;
            for (let ring = 0; ring < 3; ring++) {
                const ringRadius = baseRadius + 18 + ring * 16;
                const alpha = 0.45 - ring * 0.12;
                ctx.beginPath();
                for (let i = 0; i <= 64; i++) {
                    const angle = (i / 64) * Math.PI * 2;
                    const noise = Math.sin(angle * 4 + now * 3 + ring) * Math.cos(angle * 3 - now * 2) * Math.sin(now * 1.5 + ring * 0.5);
                    const amp = waveAmplitude * (0.6 + ring * 0.2);
                    const r = ringRadius + noise * amp;
                    const x = center + Math.cos(angle) * r;
                    const y = center + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                let color;
                if (isListening) color = 'rgba(239, 68, 68, ' + alpha + ')';
                else if (isThinking) color = 'rgba(245, 158, 11, ' + alpha + ')';
                else if (isSpeaking) color = 'rgba(59, 130, 246, ' + alpha + ')';
                else color = 'rgba(107, 114, 128, ' + (alpha * 0.25) + ')';
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            requestAnimationFrame(draw);
        }
        draw();
    }
    function setWaveAmplitude(val) { targetAmplitude = val; }

    // ===== STATE MANAGEMENT =====
    function setState(newState) {
        state = newState;
        const ld = langData[currentLang];
        voiceOrb.className = 'va-orb ' + state;
        statusIndicator.className = 'va-status ' + state;
        isListening = state === 'listening';
        isThinking = state === 'thinking';
        isSpeaking = state === 'speaking';
        switch (state) {
            case 'listening':
                orbIcon.className = 'fas fa-microphone';
                orbLabel.textContent = ld.listening;
                statusText.textContent = ld.listening;
                setWaveAmplitude(25);
                liveTranscript.classList.add('visible');
                transcriptLabel.textContent = currentLang === 'te' ? '\u0C35\u0C3F\u0C28\u0C4D\u0C1F\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41...' : currentLang === 'hi' ? '\u0938\u0941\u0928 \u0930\u0939\u093E \u0939\u0942\u0901...' : 'Listening...';
                transcriptText.innerHTML = '<span class="interim">...</span>';
                vehicleDetectBanner.classList.remove('visible');
                break;
            case 'thinking':
                orbIcon.className = 'fas fa-spinner';
                orbLabel.textContent = ld.thinking;
                statusText.textContent = ld.thinking;
                setWaveAmplitude(10);
                liveTranscript.classList.remove('visible');
                break;
            case 'speaking':
                orbIcon.className = 'fas fa-volume-up';
                orbLabel.textContent = ld.speaking;
                statusText.textContent = ld.speaking;
                setWaveAmplitude(30);
                liveTranscript.classList.remove('visible');
                break;
            default:
                orbIcon.className = 'fas fa-microphone';
                orbLabel.textContent = ld.tapToSpeak;
                statusText.textContent = ld.ready;
                setWaveAmplitude(0);
                liveTranscript.classList.remove('visible');
        }
    }

    // ===== MESSAGES =====
    function addMessage(text, type, skipScroll) {
        const div = document.createElement('div');
        div.className = 'va-msg ' + type;
        const label = document.createElement('div');
        label.className = 'va-msg-label';
        label.textContent = type === 'user' ? 'You' : 'Insurix AI';
        const bubble = document.createElement('div');
        bubble.className = 'va-msg-bubble';
        bubble.textContent = text;
        div.appendChild(label);
        div.appendChild(bubble);
        if (type !== 'user') {
            const actions = document.createElement('div');
            actions.className = 'msg-actions';
            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-action-btn';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Play';
            speakBtn.onclick = function () { speakText(text); };
            const copyBtn = document.createElement('button');
            copyBtn.className = 'msg-action-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.onclick = function () { navigator.clipboard.writeText(text); showToast('Copied to clipboard!', 'success', 2000); };
            actions.appendChild(speakBtn);
            actions.appendChild(copyBtn);
            div.appendChild(actions);
        }
        messagesContainer.appendChild(div);
        if (!skipScroll) messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return div;
    }

    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'va-msg bot';
        div.id = 'typingIndicator';
        const label = document.createElement('div');
        label.className = 'va-msg-label';
        label.textContent = 'Insurix AI';
        const typing = document.createElement('div');
        typing.className = 'va-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        div.appendChild(label);
        div.appendChild(typing);
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = $('typingIndicator');
        if (el) el.remove();
    }

    // ===== SPOKEN NUMBER & INDIC LETTER CONVERTERS =====
    function convertSpokenNumbers(text) {
        const wordToDigit = {
            'zero': '0', 'oh': '0', 'o': '0', 'one': '1', 'won': '1', 'two': '2', 'to': '2', 'too': '2', 'tu': '2',
            'three': '3', 'tree': '3', 'tri': '3', 'four': '4', 'for': '4', 'fore': '4', 'five': '5',
            'six': '6', 'siks': '6', 'seven': '7', 'eight': '8', 'ate': '8', 'nine': '9', 'nein': '9',
            '\u0C38\u0C41\u0C28\u0C4D\u0C28': '0', '\u0C12\u0C15\u0C1F\u0C3F': '1', '\u0C30\u0C46\u0C02\u0C21\u0C41': '2', '\u0C2E\u0C42\u0C21\u0C41': '3',
            '\u0C28\u0C3E\u0C32\u0C41\u0C17\u0C41': '4', '\u0C10\u0C26\u0C41': '5', '\u0C06\u0C30\u0C41': '6', '\u0C0F\u0C21\u0C41': '7',
            '\u0C0E\u0C28\u0C3F\u0C2E\u0C3F\u0C26\u0C3F': '8', '\u0C24\u0C4A\u0C2E\u0C4D\u0C2E\u0C3F\u0C26\u0C3F': '9',
            '\u0936\u0942\u0928\u094D\u092F': '0', '\u090F\u0915': '1', '\u0926\u094B': '2', '\u0924\u0940\u0928': '3',
            '\u091A\u093E\u0930': '4', '\u092A\u093E\u0901\u091A': '5', '\u091B\u0939': '6', '\u0938\u093E\u0924': '7',
            '\u0906\u0920': '8', '\u0928\u094C': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
            'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
            'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
            'hundred': '00', 'thousand': '000', 'double': ''
        };
        let result = text;
        result = result.replace(/double\s+(\w+)/gi, function (match, word) {
            var digit = wordToDigit[word.toLowerCase()];
            if (digit && digit.length === 1) return digit + digit;
            return match;
        });
        result = result.replace(/triple\s+(\w+)/gi, function (match, word) {
            var digit = wordToDigit[word.toLowerCase()];
            if (digit && digit.length === 1) return digit + digit + digit;
            return match;
        });
        for (var word in wordToDigit) {
            var regex = new RegExp('\\b' + word + '\\b', 'gi');
            result = result.replace(regex, wordToDigit[word]);
        }
        return result;
    }

    function convertIndicLetters(text) {
        let result = text;
        var mergedWords = [
            [/\u0C2C\u0C02\u0C21\u0C3F\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C2C\u0C02\u0C21\u0C3F TS'], [/\u0C2C\u0C02\u0C21\u0C3F\u0C1F\u0C40\u0C0E\u0C38\u0C4D/g, '\u0C2C\u0C02\u0C21\u0C3F TS'],
            [/\u0C2C\u0C02\u0C21\u0C3F\s*\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C2C\u0C02\u0C21\u0C3F TS'],
            [/\u0C2C\u0C48\u0C15\u0C4D\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C2C\u0C48\u0C15\u0C4D TS'], [/\u0C38\u0C4D\u0C15\u0C42\u0C1F\u0C30\u0C4D\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C38\u0C4D\u0C15\u0C42\u0C1F\u0C30\u0C4D TS'],
            [/\u0C17\u0C3E\u0C21\u0C3F\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C17\u0C3E\u0C21\u0C3F TS'], [/\u0C17\u0C3E\u0C21\u0C40\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C17\u0C3E\u0C21\u0C40 TS'],
            [/\u0C15\u0C3E\u0C30\u0C41\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C15\u0C3E\u0C30\u0C41 TS'], [/\u0C15\u0C3E\u0C30\u0C4D\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C15\u0C3E\u0C30\u0C4D TS'],
            [/\u0C2C\u0C02\u0C21\u0C3F\u0C0F\u0C2A\u0C40/g, '\u0C2C\u0C02\u0C21\u0C3F AP'], [/\u0C2C\u0C48\u0C15\u0C4D\u0C0F\u0C2A\u0C40/g, '\u0C2C\u0C48\u0C15\u0C4D AP'],
            [/\u0C35\u0C46\u0C39\u0C3F\u0C15\u0C32\u0C4D\u0C1F\u0C4D\u0C38\u0C4D/g, '\u0C35\u0C46\u0C39\u0C3F\u0C15\u0C32\u0C4D TS'],
            [/\u0917\u093E\u0921\u093C\u0940\u091F\u0940\u090F\u0938/g, '\u0917\u093E\u0921\u093C\u0940 TS'], [/\u092C\u093E\u0907\u0915\u091F\u0940\u090F\u0938/g, '\u092C\u093E\u0907\u0915 TS']
        ];
        for (var i = 0; i < mergedWords.length; i++) {
            result = result.replace(mergedWords[i][0], mergedWords[i][1]);
        }
        var stateCombos = [
            ['\u0C1F\u0C40\u0C0E\u0C38\u0C4D', 'TS'], ['\u0C1F\u0C40 \u0C0E\u0C38\u0C4D', 'TS'], ['\u0C24\u0C40\u0C0E\u0C38\u0C4D', 'TS'], ['\u0C24\u0C40 \u0C0E\u0C38\u0C4D', 'TS'], ['\u0C1F\u0C3F \u0C0E\u0C38\u0C4D', 'TS'],
            ['\u0C0F\u0C2A\u0C40', 'AP'], ['\u0C0F \u0C2A\u0C40', 'AP'], ['\u0C0E\u0C2A\u0C3F', 'AP'], ['\u0C0E \u0C2A\u0C3F', 'AP'], ['\u0C0E\u0C2A\u0C40', 'AP'],
            ['\u0C15\u0C47\u0C0F', 'KA'], ['\u0C15\u0C47 \u0C0F', 'KA'], ['\u0C15\u0C46\u0C0E', 'KA'], ['\u0C15\u0C47\u0C0E', 'KA'],
            ['\u0C0E\u0C02\u0C39\u0C46\u0C1A\u0C4D', 'MH'], ['\u0C0E\u0C02 \u0C39\u0C46\u0C1A\u0C4D', 'MH'],
            ['\u0C21\u0C40\u0C0E\u0C32\u0C4D', 'DL'], ['\u0C21\u0C40 \u0C0E\u0C32\u0C4D', 'DL'],
            ['\u0C1F\u0C40\u0C0E\u0C28\u0C4D', 'TN'], ['\u0C1F\u0C40 \u0C0E\u0C28\u0C4D', 'TN'],
            ['\u0C15\u0C47\u0C0E\u0C32\u0C4D', 'KL'], ['\u0C15\u0C47 \u0C0E\u0C32\u0C4D', 'KL'],
            ['\u0C06\u0C30\u0C4D\u0C1C\u0C47', 'RJ'], ['\u0C06\u0C30\u0C4D \u0C1C\u0C47', 'RJ'],
            ['\u0C2F\u0C42\u0C2A\u0C40', 'UP'], ['\u0C2F\u0C42 \u0C2A\u0C40', 'UP'],
            ['\u0C1C\u0C40\u0C1C\u0C47', 'GJ'], ['\u0C1C\u0C40 \u0C1C\u0C47', 'GJ'],
            ['\u0C39\u0C46\u0C1A\u0C4D\u0C06\u0C30\u0C4D', 'HR'], ['\u0C39\u0C46\u0C1A\u0C4D \u0C06\u0C30\u0C4D', 'HR'],
            ['\u0C0E\u0C02\u0C2A\u0C40', 'MP'], ['\u0C0E\u0C02 \u0C2A\u0C40', 'MP'],
            ['\u0C38\u0C40\u0C1C\u0C40', 'CG'], ['\u0C38\u0C40 \u0C1C\u0C40', 'CG'],
            ['\u0C21\u0C2C\u0C4D\u0C32\u0C4D\u0C2F\u0C42\u0C2C\u0C3F', 'WB'],
            ['\u091F\u0940\u090F\u0938', 'TS'], ['\u090F\u092A\u0940', 'AP'], ['\u0915\u0947\u090F', 'KA'], ['\u090F\u092E\u090F\u091A', 'MH'],
            ['\u0921\u0940\u090F\u0932', 'DL'], ['\u091F\u0940\u090F\u0928', 'TN'], ['\u0915\u0947\u090F\u0932', 'KL'], ['\u0906\u0930\u091C\u0947', 'RJ'],
            ['\u092F\u0942\u092A\u0940', 'UP'], ['\u091C\u0940\u091C\u0947', 'GJ'], ['\u090F\u091A\u0906\u0930', 'HR'], ['\u090F\u092E\u092A\u0940', 'MP']
        ];
        stateCombos.sort(function (a, b) { return b[0].length - a[0].length; });
        for (var i = 0; i < stateCombos.length; i++) {
            result = result.replace(new RegExp(stateCombos[i][0], 'g'), ' ' + stateCombos[i][1] + ' ');
        }
        var letters = [
            ['\u0C0E\u0C15\u0C4D\u0C38\u0C4D', 'X'], ['\u0C21\u0C2C\u0C4D\u0C32\u0C4D\u0C2F\u0C42', 'W'], ['\u0C15\u0C4D\u0C2F\u0C42', 'Q'],
            ['\u0C39\u0C46\u0C1A\u0C4D', 'H'], ['\u0C1C\u0C46\u0C21\u0C4D', 'Z'], ['\u0C0E\u0C2B\u0C4D', 'F'],
            ['\u0C0E\u0C2E\u0C4D', 'M'], ['\u0C0E\u0C28\u0C4D', 'N'], ['\u0C0E\u0C38\u0C4D', 'S'], ['\u0C0E\u0C32\u0C4D', 'L'],
            ['\u0C06\u0C30\u0C4D', 'R'],
            ['\u0C1F\u0C40', 'T'], ['\u0C1F\u0C3F', 'T'], ['\u0C21\u0C40', 'D'], ['\u0C21\u0C3F', 'D'],
            ['\u0C2C\u0C40', 'B'], ['\u0C2C\u0C3F', 'B'], ['\u0C38\u0C40', 'C'], ['\u0C38\u0C3F', 'C'],
            ['\u0C15\u0C47', 'K'], ['\u0C15\u0C46', 'K'], ['\u0C1C\u0C40', 'G'], ['\u0C1C\u0C3F', 'G'],
            ['\u0C2A\u0C40', 'P'], ['\u0C2A\u0C3F', 'P'], ['\u0C35\u0C40', 'V'], ['\u0C35\u0C3F', 'V'],
            ['\u0C2F\u0C42', 'U'], ['\u0C2F\u0C41', 'U'], ['\u0C35\u0C48', 'Y'],
            ['\u0C1C\u0C46', 'J'], ['\u0C1C\u0C47', 'J'],
            ['\u0C0F', 'A'], ['\u0C0E', 'A'], ['\u0C10', 'I'], ['\u0C13', 'O'],
            ['\u090F\u0915\u094D\u0938', 'X'], ['\u0921\u092C\u094D\u0932\u094D\u092F\u0942', 'W'], ['\u0915\u094D\u092F\u0942', 'Q'],
            ['\u090F\u091A', 'H'], ['\u091C\u0947\u0921', 'Z'], ['\u090F\u092B', 'F'],
            ['\u090F\u092E', 'M'], ['\u090F\u0928', 'N'], ['\u090F\u0938', 'S'], ['\u090F\u0932', 'L'],
            ['\u0906\u0930', 'R'], ['\u0935\u093E\u0908', 'Y'],
            ['\u091F\u0940', 'T'], ['\u0921\u0940', 'D'], ['\u092C\u0940', 'B'], ['\u0938\u0940', 'C'],
            ['\u0915\u0947', 'K'], ['\u091C\u0940', 'G'], ['\u092A\u0940', 'P'], ['\u0935\u0940', 'V'],
            ['\u091C\u0947', 'J'], ['\u090F', 'A'], ['\u0913', 'O'], ['\u0906\u0908', 'I']
        ];
        letters.sort(function (a, b) { return b[0].length - a[0].length; });
        for (var i = 0; i < letters.length; i++) {
            result = result.replace(new RegExp(letters[i][0], 'g'), letters[i][1]);
        }
        result = result.replace(/(\S*)\u0C1F\u0C4D\u0C38\u0C4D/g, function (match, prefix) {
            var cleaned = prefix.replace(/[^\u0C00-\u0C7F]/g, '');
            return cleaned ? cleaned + ' TS' : 'TS';
        });
        return result;
    }

    function extractVehicleNumber(text) {
        var processed = convertSpokenNumbers(text);
        processed = convertIndicLetters(processed);
        processed = processed.replace(/\b(my|vehicle|number|is|its|it's|the|naa|n\u0101|mera|meri|\u092E\u0947\u0930\u093E|\u0C28\u0C3E|\u0C35\u0C3E\u0C39\u0C28|\u0C28\u0C02\u0C2C\u0C30\u0C4D|bike|car|scooter|motorcycle|two wheeler|registration|reg|\u092C\u093E\u0907\u0915|\u0915\u093E\u0930|\u0C2C\u0C48\u0C15\u0C4D|\u0C15\u0C3E\u0C30\u0C4D|\u0C2C\u0C02\u0C21\u0C3F|\u0C2C\u0C02\u0C21|\u0C17\u0C3E\u0C21\u0C3F|\u0C17\u0C3E\u0C21\u0C40|\u0917\u093E\u0921\u093C\u0940|\u0C15\u0C3E\u0C30\u0C41|\u0C38\u0C4D\u0C15\u0C42\u0C1F\u0C30\u0C4D|\u0C35\u0C46\u0C39\u0C3F\u0C15\u0C32\u0C4D)\b/gi, ' ');
        var cleaned = processed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        var match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}/);
        if (match) return match[0];
        var looseMatch = cleaned.match(/[A-Z]{2}\d{2}[A-Z]{1,2}\d{1,4}/);
        if (looseMatch) return looseMatch[0];
        var fragMatch = cleaned.match(/([A-Z]{2})\D*?(\d{1,2})\D*?([A-Z]{1,3})\D*?(\d{1,4})/);
        if (fragMatch) {
            var assembled = fragMatch[1] + fragMatch[2].padStart(2, '0') + fragMatch[3] + fragMatch[4];
            if (assembled.length >= 8) return assembled;
        }
        var digits = cleaned.match(/\d+/g) || [];
        var alphas = cleaned.match(/[A-Z]+/g) || [];
        if (alphas.length >= 2 && digits.length >= 2) {
            var candidate = alphas[0] + digits[0].padStart(2, '0') + alphas[1] + digits[1];
            if (/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{1,4}$/.test(candidate)) return candidate;
        }
        return null;
    }

    // Format vehicle number for display: TS08JM2665 -> TS 08 JM 2665
    function formatVehicleNumber(num) {
        if (!num) return '';
        var m = num.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{1,4})$/);
        if (m) return m[1] + ' ' + m[2] + ' ' + m[3] + ' ' + m[4];
        return num;
    }

    // ===== LIVE VEHICLE DETECTION (real-time during speech) =====
    function checkLiveVehicleDetection(text) {
        var num = extractVehicleNumber(text);
        if (num && num !== lastDetectedVehicle) {
            lastDetectedVehicle = num;
            vehicleDetectBanner.classList.add('visible');
            detectedNumber.textContent = formatVehicleNumber(num);
            vehicleNumberInput.value = formatVehicleNumber(num);
            numberPlate.classList.add('detected');
            setTimeout(function () { numberPlate.classList.remove('detected'); }, 2000);
            showToast('Vehicle number detected: ' + formatVehicleNumber(num), 'vehicle', 3000);
        }
    }

    // ===== LOCAL FALLBACK KNOWLEDGE BASE =====
    var localKB = {
        en: {
            greetings: { patterns: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'howdy', 'sup', 'yo'], response: "Hey there! 👋 I'm Insurix, your all-in-one insurance expert! I can help with motor, health, life, travel, home, cyber — ANY insurance. Ask me anything!" },
            // Best plans / comparison — BEFORE vehicle so "best plan" doesn't fall through
            comparison: { patterns: ['compare', 'best insurance', 'recommend', 'suggest', 'which one', 'best plan', 'best plans', 'vs', 'which is best', 'top plans', 'top insurance', 'good plan', 'good insurance'], response: "Quick picks! 🎯\n🏍️ Motor: Digit/Acko (cheap) or Bajaj/HDFC (network)\n🏥 Health: Star Health (best) or Niva Bupa (family)\n💝 Term Life: Max Life/Tata AIA (99%+ claim settlement)\n👴 Senior: Star Red Carpet\n🇮🇳 Govt: PMJJBY+PMSBY (₹456/yr = ₹4L!)\n\nTell me which type you need — I'll give detailed comparison!" },
            life: { patterns: ['life', 'term', 'death', 'term plan', 'term insurance', 'life cover', 'life insurance', 'jeevan bima'], response: "Term Life Insurance from ₹490/month! 💝 ₹1 Crore coverage.\n\nBest Plans:\n1️⃣ Max Life Smart Secure Plus — 99.6% claim settlement\n2️⃣ Tata AIA Sampoorna Raksha — 99.1% settlement\n3️⃣ HDFC Life Click 2 Protect — 99.1% settlement\n4️⃣ ICICI Pru iProtect Smart — 98.5% settlement\n5️⃣ LIC Tech Term — 98.6% settlement (most trusted)\n\nTypes: Term, Endowment, ULIP, Whole Life, Money Back. Tax: 80C (₹1.5L) + 10(10D) tax-free maturity!" },
            health: { patterns: ['health', 'medical', 'hospital', 'doctor', 'family health', 'mediclaim', 'hospitalization'], response: "Health Insurance starts from ₹5,000/year! 🏥\n\nBest Plans:\n1️⃣ Star Family Health Optima — ₹10L cover, 14,000+ hospitals\n2️⃣ Niva Bupa Reassure 2.0 — No room rent limit\n3️⃣ HDFC ERGO Optima Secure — Restore benefit\n4️⃣ Care Health Supreme — ₹5L-₹6Cr cover\n5️⃣ Aditya Birla Activ One Max — Comprehensive cover\n\nTax benefit: Section 80D — ₹25,000-₹1,00,000 deduction!" },
            car: { patterns: ['car insurance', 'four wheeler', '4 wheeler', 'sedan', 'suv', 'hatchback', 'private car'], response: "Car Insurance! 🚗 IRDAI TP rates: ≤1000cc: ₹2,094/yr | 1000-1500cc: ₹3,416/yr | >1500cc: ₹7,897/yr. Comprehensive covers YOUR car + third party. Add-ons: Zero Dep, Engine Protect, RSA, Return to Invoice!" },
            vehicle: { patterns: ['vehicle', 'bike', 'scooter', 'motorcycle', 'two wheeler', 'my number', 'registration'], response: "Got it! Tell me your vehicle number and I'll pull up the details! 🔍 Or ask me about any insurance type — motor, health, life, travel, home, cyber!" },
            premium: { patterns: ['premium', 'price', 'cost', 'rate', 'how much', 'expensive', 'cheap', 'affordable', 'emi'], response: "Premium varies by type:\n🏍️ 2W TP: ₹538-₹2,804/yr\n🚗 Car TP: ₹2,094-₹7,897/yr\n🏥 Health: ₹5,000-₹25,000/yr\n💝 Term Life (₹1Cr): ₹6,000-₹18,000/yr\n✈️ Travel: ₹300-₹1,000/day\n🏠 Home: ₹1,000-₹10,000/yr\n\nNCB saves up to 50% on motor OD! 💰" },
            familyHealth: { patterns: ['family floater', 'family plan', 'family insurance', 'family medical'], response: "Family Floater Health! 👨‍👩‍👧‍👦 One policy covers everyone — ₹10K-₹25K/yr for ₹10L cover. Self + Spouse + Kids + Parents. Top: Star Family Health Optima, Niva Bupa Reassure, HDFC ERGO Optima." },
            seniorHealth: { patterns: ['senior citizen', 'senior health', 'old age', 'parent insurance', '60 plus', '60+'], response: "Senior Citizen Health (60+)! 👴👵 ₹5L-₹50L cover, ₹15K-₹50K/yr. Pre-existing covered after 1-2 yrs. Tax: Section 80D — ₹50,000 deduction for seniors! Top: Star Red Carpet, Niva Bupa Senior First." },
            criticalIllness: { patterns: ['critical illness', 'cancer', 'heart attack', 'stroke', 'kidney', 'serious illness'], response: "Critical Illness Insurance! 🩺 Lump-sum payout on diagnosis of cancer, heart attack, stroke, kidney failure etc. ₹5L-₹1Cr cover, ₹2K-₹10K/yr. Available standalone or as rider with life/health policy." },
            endowment: { patterns: ['endowment', 'savings plan', 'money back', 'guaranteed return', 'maturity benefit'], response: "Endowment & Savings Plans! 💰 Insurance + Guaranteed Returns. LIC Jeevan Labh, HDFC Sanchay Plus. Money Back: periodic payouts every 3-5 years. Tax: 80C deduction + 10(10D) maturity tax-free. 5-7% IRR returns." },
            childPlan: { patterns: ['child', 'children', 'education', 'kid', 'daughter', 'son', 'child plan'], response: "Child Plans! 👶📚 LIC Jeevan Tarun, HDFC YoungStar, ICICI Pru Smart Kid. Key benefit: Premium waiver if parent passes away — insurer pays remaining premiums. ₹5K/month SIP = ₹25-50L in 15-18 years for education!" },
            womenPlan: { patterns: ['women', 'woman', 'female', 'ladies', 'women insurance'], response: "Women's Insurance! 👩 5% lower term premiums for women! Maternity cover (₹25K-₹75K), Newborn from Day 1. Covers breast/ovarian/cervical cancer. Top: HDFC Life Click 2 Protect for Women, Star Women Care Health." },
            retirement: { patterns: ['retirement', 'pension', 'annuity', 'nps', 'old age plan', 'retire'], response: "Retirement Plans! 👴 NPS: Market-linked + extra ₹50K tax benefit (80CCD). LIC Jeevan Shanti: Guaranteed pension. APY: ₹1K-₹5K/month pension from age 60. PMVVY: 7.4% guaranteed for 60+. Start at 25, invest 15% = comfortable retirement!" },
            travel: { patterns: ['travel', 'trip', 'abroad', 'international', 'visa', 'schengen', 'flight', 'foreign', 'vacation'], response: "Travel Insurance! ✈️ International: $50K-$5L from ₹300-₹1,000/day. Domestic: ₹2L-₹25L from ₹100-₹300/day. Schengen: MANDATORY €30K medical. Covers: Medical, cancellation, baggage loss, flight delay, evacuation. Top: Bajaj Allianz, ICICI, HDFC ERGO." },
            home: { patterns: ['home', 'house', 'property', 'fire', 'flood', 'earthquake', 'building', 'flat', 'apartment', 'burglary', 'theft'], response: "Home Insurance! 🏠 Covers building + contents (furniture, electronics, jewelry) against fire, flood, earthquake, storm, burglary, theft. ₹10L-₹5Cr+ cover for just ₹1,000-₹10,000/yr! Also: temporary accommodation, rent, third-party liability." },
            cyber: { patterns: ['cyber', 'digital', 'online fraud', 'hacking', 'phishing', 'upi fraud', 'identity theft', 'data breach'], response: "Cyber Insurance! 🔐 Covers online fraud, identity theft, phishing, UPI fraud, social media hacking, cyber bullying, malware. ₹50K-₹1Cr cover for just ₹500-₹5,000/yr! UPI fraud up 300%+ — MUST-HAVE for anyone using online banking!" },
            ev: { patterns: ['electric', 'ev', 'electric vehicle', 'battery', 'ola electric', 'ather', 'nexon ev'], response: "EV Insurance! ⚡ IRDAI gives 15% OD discount! Covers battery damage, charging equipment, software issues. Battery = 40-50% of EV cost — get battery protect add-on! Top: HDFC ERGO, ICICI, Digit, Acko." },
            commercial: { patterns: ['commercial', 'business', 'truck', 'bus', 'taxi', 'fleet', 'shop', 'office', 'auto rickshaw', 'tractor'], response: "Commercial & Business Insurance! 🚛 Commercial vehicles, fleet, shop/office package (fire+burglary+stock), marine cargo, professional indemnity (doctors/CAs/lawyers), workmen's compensation. Every business needs fire + theft + public liability!" },
            crop: { patterns: ['crop', 'farm', 'agriculture', 'kisan', 'fasal', 'farmer', 'pmfby', 'farming'], response: "Crop Insurance — PMFBY! 🌾 Farmer premium: Kharif 2%, Rabi 1.5%, Horticulture 5%. Govt pays the rest! Covers natural calamities, pests, diseases, post-harvest losses. 5Cr+ farmers enrolled. Apply through banks or CSCs." },
            govtSchemes: { patterns: ['government', 'govt', 'scheme', 'pmjjby', 'pmsby', 'ayushman', 'atal pension', 'apy', 'pradhan mantri', 'free insurance'], response: "Govt Schemes! 🇮🇳\n1. PMJJBY: ₹2L life cover = ₹436/yr\n2. PMSBY: ₹2L accident = ₹20/yr!\n3. Ayushman Bharat: FREE ₹5L/family for 12Cr families\n4. APY: ₹1K-₹5K/month pension from 60\n5. ESI: For employees ≤₹21K salary\n\nEvery Indian should have PMJJBY+PMSBY = ₹456/yr for ₹4L cover!" },
            tax: { patterns: ['tax', '80c', '80d', 'tax benefit', 'tax saving', 'income tax', 'deduction'], response: "Tax Benefits! 📊 80C: Life premium ₹1.5L. 80D: Health premium ₹25K (self) + ₹50K (senior parents) = ₹1L max. 80CCD(1B): NPS ₹50K extra. 10(10D): Life maturity tax-free. Smart insurance = Save ₹50K-₹2L+ in taxes!" },
            addons: { patterns: ['add-on', 'addon', 'rider', 'zero dep', 'zero depreciation', 'engine protect', 'rsa', 'roadside', 'return to invoice'], response: "Add-ons & Riders! 🛡️ Motor: Zero Dep (#1 must-have!), Engine Protect, RSA, Return to Invoice, NCB Protector, Key Replace, Tyre Protect. Health: Critical Illness, Hospital Cash, Maternity. Life: Accidental Death (2x), Critical Illness, Waiver of Premium." },
            claim: { patterns: ['claim', 'file claim', 'claim process', 'claim settlement', 'cashless', 'reimbursement'], response: "Claims by type! 📋\n🚗 Motor: Intimate→FIR→Surveyor→Cashless/Reimburse (7-30 days)\n🏥 Health: Pre-auth (cashless) or bills (reimburse) (15-30 days)\n💝 Life: Nominee→Docs→Settlement (30 days)\n\nCashless = no upfront payment at network hospitals/garages!" },
            ncb: { patterns: ['ncb', 'no claim bonus', 'bonus', 'discount'], response: "NCB rewards claim-free years! 🎁 1yr: 20% | 2yr: 25% | 3yr: 35% | 4yr: 45% | 5yr+: 50% off OD premium. Transfer to new vehicle! NCB Protector add-on keeps NCB even after 1 claim." },
            idv: { patterns: ['idv', 'insured declared', 'market value', 'depreciation'], response: "IDV = Current market value 💰 IDV = Ex-Showroom - Depreciation. 6mo: 5%, 1yr: 15%, 2yr: 20%, 3yr: 30%, 4yr: 40%, 5yr+: 50%. Higher IDV = better claim but higher premium. Choose close to actual market value." },
            comprehensive: { patterns: ['comprehensive', 'third party', 'tp vs', 'comp vs', 'which policy', 'which insurance', 'difference', 'types'], response: "Insurance types! 🛡️\n• Third Party: Covers damage to OTHERS — legally mandatory, cheapest\n• Comprehensive: Covers YOUR vehicle + third party — best protection!\n• Standalone OD: Own damage only (if TP already active)\n\nFor newer vehicles always go Comprehensive + Zero Dep!" },
            renewal: { patterns: ['renew', 'renewal', 'expire', 'expiry', 'lapse', 'expired'], response: "Renewal tips! 🔄 Motor: Renew before expiry to keep NCB. 90+ days lapse = NCB lost! Health: 30+ days lapse = waiting periods restart! Life: 15-30 day grace period. NEVER let health insurance lapse!" },
            documents: { patterns: ['document', 'papers', 'required', 'kyc', 'aadhaar', 'pan card'], response: "Documents! 📄 Motor: RC, previous policy, PAN, Aadhaar. Health: Aadhaar/PAN, age proof, medical reports. Life: Aadhaar, PAN, income proof, medical test. Online: Just Aadhaar + PAN + OTP = instant!" },
            help: { patterns: ['help', 'what can you do', 'features', 'services', 'options', 'menu'], response: "I'm Insurix — ALL insurance expert! 🎯 Motor (bike/car/commercial), Health (individual/family/senior/critical), Life (term/endowment/ULIP/child/women), Travel, Home, Cyber, Crop, Commercial, Govt Schemes, Tax Benefits, Claims, Add-ons — ask me ANYTHING!" },
            thanks: { patterns: ['thanks', 'thank you', 'great', 'awesome', 'nice', 'good', 'perfect', 'cool', 'ok'], response: "You're welcome! 😊 Ask me about ANY insurance — motor, health, life, travel, home, cyber, govt schemes, tax benefits — I know it all!" }
        },
        te: {
            greetings: { patterns: ['హలో', 'హాయ్', 'నమస్కారం', 'నమస్తే', 'హై'], response: 'హాయ్! 🙏 నేను Insurix, అన్ని బీమాల expert! Motor, health, life, travel, home, cyber — ఏదైనా అడగండి!' },
            // Best plans / comparison — BEFORE vehicle so follow-up questions match correctly
            comparison: { patterns: ['ఉత్తమ', 'బెస్ట్', 'మంచి', 'ఏది మంచిది', 'best', 'recommend', 'suggest', 'compare', 'ఏ ప్లాన్', 'which plan', 'best plan', 'best plans', 'top plans', 'top', 'ఏది బాగుంటుంది'], response: 'ఉత్తమ ప్లాన్లు! 🎯\n🏥 Health: Star Family Health Optima, Niva Bupa Reassure\n💝 Term Life: Max Life (99.6%), Tata AIA (99.1%), HDFC Life (99.1%)\n🏍️ Motor: Digit/Acko (చౌక) or Bajaj/HDFC (network)\n👴 Senior: Star Red Carpet\n🇮🇳 Govt: PMJJBY+PMSBY = ₹456/సం = ₹4L cover!\n\nఏ type బీమా కావాలో చెప్పండి — detailed comparison ఇస్తాను!' },
            life: { patterns: ['జీవితం', 'లైఫ్', 'టర్మ్', 'మరణం', 'జీవిత బీమా', 'life insurance', 'life'], response: 'జీవిత బీమా ₹490/నెల నుండి! 💝 ₹1 Cr cover.\n\nBest Plans:\n1️⃣ Max Life Smart Secure Plus — 99.6% claim settlement\n2️⃣ Tata AIA Sampoorna Raksha — 99.1%\n3️⃣ HDFC Life Click 2 Protect — 99.1%\n4️⃣ ICICI Pru iProtect Smart — 98.5%\n5️⃣ LIC Tech Term — 98.6% (most trusted)\n\nTerm, Endowment, ULIP, Child Plans, Money Back ఉన్నాయి. Tax: 80C ₹1.5L తగ్గింపు!' },
            health: { patterns: ['ఆరోగ్యం', 'హెల్త్', 'ఆసుపత్రి', 'వైద్యం', 'మెడికల్'], response: 'ఆరోగ్య బీమా ₹5,000/సం నుండి! 🏥\n\nBest Plans:\n1️⃣ Star Family Health Optima — 14,000+ hospitals\n2️⃣ Niva Bupa Reassure 2.0\n3️⃣ HDFC ERGO Optima Secure\n4️⃣ Care Health Supreme\n\n₹5L-₹5Cr cover. Tax: 80D — ₹25K-₹1L తగ్గింపు!' },
            childPlan: { patterns: ['పిల్లల బీమా', 'చైల్డ్', 'విద్య', 'పిల్లలు', 'కూతురు', 'కొడుకు', 'child', 'education'], response: 'పిల్లల ప్లాన్లు! 👶📚 LIC Jeevan Tarun, HDFC YoungStar, ICICI Pru Smart Kid. Parent మరణిస్తే insurer premiums చెల్లిస్తుంది! ₹5K/నెల = ₹25-50L 15-18 సంవత్సరాలలో education కోసం!' },
            womenPlan: { patterns: ['మహిళల బీమా', 'స్త్రీల బీమా', 'మహిళ', 'women'], response: 'మహిళల బీమా! 👩 Women కి 5% తక్కువ premium! Maternity cover ₹25K-₹75K. HDFC Life Click 2 Protect for Women, Star Women Care Health.' },
            retirement: { patterns: ['రిటైర్మెంట్', 'పెన్షన్', 'retirement', 'pension', 'nps'], response: 'Retirement Plans! 👴 NPS: ₹50K extra tax benefit. LIC Jeevan Shanti: Guaranteed pension. APY: ₹1K-₹5K/నెల pension 60 తర్వాత.' },
            endowment: { patterns: ['ఎండోమెంట్', 'savings', 'మనీ బ్యాక్', 'guaranteed return'], response: 'Endowment Plans! 💰 Insurance + Guaranteed Returns. LIC Jeevan Labh, HDFC Sanchay Plus. Money Back: 3-5 సంవత్సరాలకు payouts. 5-7% returns!' },
            vehicle: { patterns: ['బైక్', 'కార్', 'వాహనం', 'బండి', 'స్కూటర్', 'నంబర్'], response: 'అర్థమైంది! మీ వాహన వివరాలు తీసుకుస్తున్నాను! 🔍' },
            travel: { patterns: ['ట్రావెల్', 'ప్రయాణం', 'విదేశ', 'flight'], response: 'ట్రావెల్ బీమా! ✈️ International: $50K-$5L, ₹300-₹1,000/రోజు. Schengen: MANDATORY €30K. Medical, cancellation, baggage, flight delay cover!' },
            home: { patterns: ['ఇల్లు', 'హోమ్', 'ఆస్తి', 'fire', 'flood', 'దొంగతనం'], response: 'Home Insurance! 🏠 Building + contents cover. Fire, flood, earthquake, burglary. ₹1,000-₹10,000/సం! చాలా affordable!' },
            cyber: { patterns: ['సైబర్', 'హ్యాకింగ్', 'UPI fraud', 'ఆన్‌లైన్'], response: 'Cyber Insurance! 🔐 Online fraud, UPI fraud, hacking, phishing cover. ₹500-₹5,000/సం! Digital banking ఉపయోగించే అందరికీ MUST-HAVE!' },
            govtSchemes: { patterns: ['ప్రభుత్వం', 'govt', 'pmjjby', 'pmsby', 'ఆయుష్మాన్', 'atal pension'], response: 'Govt Schemes! 🇮🇳 PMJJBY: ₹2L = ₹436/సం. PMSBY: ₹2L = ₹20/సం! Ayushman: FREE ₹5L. APY: pension 60 తర్వాత. PMJJBY+PMSBY = ₹456/సం = ₹4L cover!' },
            tax: { patterns: ['పన్ను', 'tax', '80c', '80d'], response: '80C: Life ₹1.5L. 80D: Health ₹25K+₹50K. 80CCD: NPS ₹50K extra. Insurance తో ₹50K-₹2L+ tax save! 📊' },
            premium: { patterns: ['ధర', 'ప్రీమియం', 'ఎంత', 'రేటు', 'ఖర్చు'], response: '🏍️ 2W TP: ₹538-₹2,804/సం\n🚗 Car TP: ₹2,094-₹7,897/సం\n🏥 Health: ₹5,000-₹25,000/సం\n💝 Term Life: ₹6,000-₹18,000/సం\n🇮🇳 PMSBY: ₹20/సం!\n\nNCB తో 50% save! 💰' },
            claim: { patterns: ['క్లెయిమ్', 'ప్రమాదం', 'నష్టం'], response: 'Motor: Intimate→FIR→Surveyor→Cashless/Reimburse. Health: Pre-auth/bills→TPA→Settlement. Life: Nominee→Docs→30 రోజులు. Cashless = మీరు pay చేయనవసరం లేదు! 📋' },
            ncb: { patterns: ['ncb', 'ఎన్సీబీ', 'బోనస్'], response: 'NCB: 1సం 20%, 2సం 25%, 3సం 35%, 4సం 45%, 5+ 50% off OD! Transfer చేయవచ్చు. NCB Protector add-on ఉంటే 1 claim తర్వాత కూడా NCB! 🎁' },
            thanks: { patterns: ['ధన్యవాదం', 'థ్యాంక్స్', 'బాగుంది', 'సూపర్'], response: 'ధన్యవాదాలు! 😊 Motor, health, life, travel, home, cyber — ఏదైనా అడగండి!' }
        },
        hi: {
            greetings: { patterns: ['हेलो', 'हाइ', 'नमस्ते', 'हैलो'], response: 'हेलो! 🙏 मैं Insurix हूँ — सब insurance का expert! Motor, health, life, travel, home, cyber — कुछ भी पूछो!' },
            comparison: { patterns: ['बेस्ट', 'सबसे अच्छा', 'कौन सा', 'recommend', 'best', 'compare', 'top plan', 'अच्छा प्लान'], response: 'Best Plans! 🎯\n🏥 Health: Star Health, Niva Bupa\n💝 Term: Max Life (99.6%), Tata AIA (99.1%)\n🏍️ Motor: Digit/Acko (सस्ता) or Bajaj/HDFC\n🇮🇳 Govt: PMJJBY+PMSBY = ₹456/साल = ₹4L cover!\n\nकौन सा insurance चाहिए — detail में बताता हूँ!' },
            life: { patterns: ['जीवन', 'लाइफ', 'टर्म', 'मृत्यु', 'जीवन बीमा', 'life insurance'], response: 'Term Life ₹490/महीना! � ₹1 Cr cover.\n\nBest Plans:\n1️⃣ Max Life — 99.6% settlement\n2️⃣ Tata AIA — 99.1%\n3️⃣ HDFC Life — 99.1%\n4️⃣ LIC Tech Term — 98.6%\n\nTerm, Endowment, ULIP, Child Plans सब हैं. Tax: 80C ₹1.5L!' },
            health: { patterns: ['स्वास्थ्य', 'हेल्थ', 'अस्पताल', 'डॉक्टर', 'मेडिकल'], response: 'Health Insurance ₹5,000/साल से! 🏥 Best: Star Health, Niva Bupa, HDFC ERGO, Care Health. 10,000+ hospitals में cashless. ₹5L-₹5Cr cover. Tax: 80D — ₹25K-₹1L deduction!' },
            vehicle: { patterns: ['बाइक', 'कार', 'वाहन', 'गाड़ी', 'स्कूटर', 'नंबर'], response: 'समझ गया! आपकी गाड़ी की details लाता हूँ! 🔍' },
            travel: { patterns: ['ट्रैवल', 'यात्रा', 'विदेश', 'फ्लाइट'], response: 'Travel Insurance! ✈️ International: ₹300-₹1,000/दिन. Schengen: MANDATORY. Medical, cancellation, baggage loss cover!' },
            govtSchemes: { patterns: ['सरकारी', 'govt', 'pmjjby', 'pmsby', 'आयुष्मान', 'अटल पेंशन'], response: 'सरकारी योजनाएँ! 🇮🇳 PMJJBY: ₹2L = ₹436/साल. PMSBY: ₹2L = ₹20/साल! आयुष्मान: FREE ₹5L. PMJJBY+PMSBY = ₹456/साल = ₹4L cover!' },
            premium: { patterns: ['प्रीमियम', 'कीमत', 'कितना', 'रेट', 'खर्च'], response: '🏍️ 2W TP: ₹538-₹2,804\n🚗 Car TP: ₹2,094-₹7,897\n🏥 Health: ₹5,000-₹25,000/साल\n💝 Term (₹1Cr): ₹6,000-₹18,000/साल\n🇮🇳 PMSBY: ₹20/साल!\n\nNCB से 50% बचत! 💰' },
            thanks: { patterns: ['धन्यवाद', 'शुक्रिया', 'अच्छा', 'बढ़िया'], response: 'शुक्रिया! 😊 Motor, health, life, travel, home, cyber — कुछ भी पूछो, सब बताऊँगा!' }
        }
    };

    function getLocalReply(userText) {
        var text = userText.toLowerCase();
        var kb = localKB[currentLang] || localKB.en;
        var checks = [kb, localKB.en];
        for (var c = 0; c < checks.length; c++) {
            for (var key in checks[c]) {
                var data = checks[c][key];
                for (var p = 0; p < data.patterns.length; p++) {
                    if (text.includes(data.patterns[p].toLowerCase())) return data.response;
                }
            }
        }
        if (window.InsurixChatbot) {
            try { window.InsurixChatbot.currentLang = currentLang; return window.InsurixChatbot.processMessage(userText); } catch (e) { }
        }
        return currentLang === 'te' ? 'మీ ప్రశ్నకు సమాధానం ఇస్తాను! బీమా గురించి అడగండి — బైక్, కార్, హెల్త్, లైఫ్, ట్రావెల్, హోమ్, సైబర్, ప్రభుత్వ పథకాలు — ఏదైనా! 🤔'
            : currentLang === 'hi' ? 'कोई बात नहीं! बीमा के बारे में कुछ भी पूछो — बाइक, कार, हेल्थ, लाइफ, ट्रैवल, होम, साइबर, सरकारी योजनाएँ — सब बताऊँगा! 🤔'
                : "No worries! Ask me about ANY insurance — motor, health, life, travel, home, cyber, govt schemes, tax benefits, claims, crop insurance — I know it all! 🤔";
    }

    // ===== SEND TO AI =====
    // Check if user message is about motor/vehicle insurance
    function isMotorQuery(text) {
        var motorKeywords = ['vehicle', 'bike', 'car', 'scooter', 'motorcycle', 'two wheeler', 'four wheeler',
            'registration', 'motor', 'automobile', 'driving', 'accident', 'garage',
            'బైక్', 'కార్', 'వాహనం', 'బండి', 'స్కూటర్', 'గాడి', 'మోటార్',
            'बाइक', 'कार', 'वाहन', 'गाड़ी', 'स्कूटर', 'मोटर',
            'my number is', 'naa number', 'నా నంబర్', 'मेरा नंबर'];
        var lower = text.toLowerCase();
        for (var i = 0; i < motorKeywords.length; i++) {
            if (lower.includes(motorKeywords[i].toLowerCase())) return true;
        }
        return false;
    }

    async function sendToAI(userText) {
        addMessage(userText, 'user');
        conversationHistory.push({ role: 'user', text: userText });

        // Only extract vehicle number if the message is about motor/vehicle insurance
        if (isMotorQuery(userText)) {
            var vehicleNum = extractVehicleNumber(userText);
            if (vehicleNum) {
                lastDetectedVehicle = vehicleNum;
                if (vehicleNumberInput) vehicleNumberInput.value = formatVehicleNumber(vehicleNum);
                showToast('Vehicle Detected: ' + formatVehicleNumber(vehicleNum), 'success');
                await lookupAndShowVehicle(vehicleNum);
                return;
            }
        }
        addTypingIndicator();
        try {
            // Send conversation history so AI has context for follow-up questions
            var historyToSend = conversationHistory.slice(-10); // Last 10 messages for context
            var resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText, language: currentLang, history: historyToSend })
            });
            if (!resp.ok) throw new Error('Server error');
            var data = await resp.json();
            removeTypingIndicator();
            var reply = data.reply || data.response || data.message || '';
            addMessage(reply, 'assistant');
            conversationHistory.push({ role: 'assistant', text: reply });
            speakText(reply);
            // Only look for vehicle numbers in reply if conversation is about motor insurance
            if (isMotorQuery(userText)) {
                var vn = extractVehicleNumber(reply);
                if (vn) {
                    lastDetectedVehicle = vn;
                    await lookupAndShowVehicle(vn);
                }
            }
            // Detect and display policies mentioned in AI reply
            var detectedPolicies = detectPolicies(reply);
            if (detectedPolicies.length > 0) {
                showPolicyCards(detectedPolicies);
                switchPanel('policies');
            }
        } catch (e) {
            removeTypingIndicator();
            var localReply = getLocalReply(userText);
            addMessage(localReply, 'assistant');
            conversationHistory.push({ role: 'assistant', text: localReply });
            speakText(localReply);
            // Detect policies in fallback reply too
            var detectedPoliciesFB = detectPolicies(localReply);
            if (detectedPoliciesFB.length > 0) {
                showPolicyCards(detectedPoliciesFB);
                switchPanel('policies');
            }
        }
        renderSuggestions();
    }

    // ===== INSURANCE POLICY DATABASE =====
    var POLICY_DATABASE = {
        // ===== LIFE INSURANCE =====
        'SBI Life eShield': {
            company: 'SBI Life', name: 'eShield', type: 'Term Life',
            logo: 'assets/sbi-life-insurance.jpg',
            minAge: 18, maxAge: 65, coverMin: '₹25L', coverMax: '₹5Cr',
            premiumFrom: '₹490/mo', claimRatio: '97.8%',
            policyTerm: '10-40 years', paymentModes: 'Monthly, Yearly, Single',
            features: ['Pure term protection', 'Online discount 5-8%', 'Accidental death rider', 'Critical illness rider', 'Terminal illness benefit'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#2563EB', icon: 'fa-shield-halved'
        },
        'Max Life Smart Secure Plus': {
            company: 'Max Life', name: 'Smart Secure Plus', type: 'Term Life',
            logo: 'assets/max-life-insurance.jpg',
            minAge: 18, maxAge: 60, coverMin: '₹25L', coverMax: '₹25Cr',
            premiumFrom: '₹520/mo', claimRatio: '99.6%',
            policyTerm: '10-50 years', paymentModes: 'Monthly, Yearly, Limited Pay',
            features: ['Highest claim settlement 99.6%', 'Lump sum + monthly income option', 'Return of premium option', 'Waiver of premium rider', 'Joint life cover'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#DC2626', icon: 'fa-heart-pulse'
        },
        'Tata AIA Sampoorna Raksha': {
            company: 'Tata AIA', name: 'Sampoorna Raksha', type: 'Term Life',
            logo: 'assets/tata-aia-life-insurance.jpg',
            minAge: 18, maxAge: 65, coverMin: '₹25L', coverMax: '₹25Cr',
            premiumFrom: '₹480/mo', claimRatio: '99.1%',
            policyTerm: '10-50 years', paymentModes: 'Monthly, Yearly, 5/7/10 Pay',
            features: ['99.1% claim settlement', 'Increasing cover option', 'Terminal illness benefit', 'Accidental death benefit', 'Premium waiver on critical illness'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#0369A1', icon: 'fa-umbrella'
        },
        'HDFC Life Click 2 Protect': {
            company: 'HDFC Life', name: 'Click 2 Protect Life', type: 'Term Life',
            logo: 'assets/hdfc-life-insurance.jpg',
            minAge: 18, maxAge: 65, coverMin: '₹25L', coverMax: '₹10Cr',
            premiumFrom: '₹550/mo', claimRatio: '99.1%',
            policyTerm: '10-40 years', paymentModes: 'Monthly, Yearly, Limited Pay',
            features: ['3D Life Protection', 'Life, health & income cover', 'Whole life option to 99', 'Income replacement option', 'Extra payout for accidents'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#7C3AED', icon: 'fa-shield-heart'
        },
        'ICICI Pru iProtect Smart': {
            company: 'ICICI Prudential', name: 'iProtect Smart', type: 'Term Life',
            logo: 'assets/icici-prudential-life-insurance.png',
            minAge: 18, maxAge: 65, coverMin: '₹50L', coverMax: '₹25Cr',
            premiumFrom: '₹530/mo', claimRatio: '98.5%',
            policyTerm: '10-40 years', paymentModes: 'Monthly, Yearly, Limited Pay',
            features: ['All-in-one protection', 'Critical illness cover 34 diseases', 'Disability benefit', 'Terminal illness lump sum', 'Spouse cover option'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#EA580C', icon: 'fa-user-shield'
        },
        'LIC Tech Term': {
            company: 'LIC', name: 'Tech Term (Plan 854)', type: 'Term Life',
            logo: 'assets/lic-logo.png',
            minAge: 18, maxAge: 65, coverMin: '₹50L', coverMax: '₹25Cr',
            premiumFrom: '₹600/mo', claimRatio: '98.6%',
            policyTerm: '10-40 years', paymentModes: 'Yearly, Half-Yearly',
            features: ['Most trusted brand in India', 'Government backed', 'Online only — low premium', 'Rebate for high sum assured', 'Special women premium discount'],
            taxBenefit: '80C: ₹1.5L + 10(10D) tax-free',
            color: '#1D4ED8', icon: 'fa-landmark'
        },
        // ===== HEALTH INSURANCE =====
        'Star Family Health Optima': {
            company: 'Star Health', name: 'Family Health Optima', type: 'Health',
            logo: 'assets/star-health.png',
            minAge: 18, maxAge: 65, coverMin: '₹5L', coverMax: '₹1Cr',
            premiumFrom: '₹8,500/yr', claimRatio: '65%',
            policyTerm: '1 year (renewable)', paymentModes: 'Yearly',
            features: ['14,000+ network hospitals', 'No room rent capping', 'Automatic recharge 100%', 'Day care procedures covered', 'AYUSH treatment covered'],
            taxBenefit: '80D: ₹25K (self) + ₹50K (parents senior)',
            color: '#059669', icon: 'fa-hospital'
        },
        'Niva Bupa Reassure 2.0': {
            company: 'Niva Bupa', name: 'Reassure 2.0', type: 'Health',
            logo: 'assets/niva-bupa.png',
            minAge: 18, maxAge: 65, coverMin: '₹5L', coverMax: '₹2Cr',
            premiumFrom: '₹7,200/yr', claimRatio: '63%',
            policyTerm: '1 year (renewable)', paymentModes: 'Yearly, Monthly EMI',
            features: ['No room rent limit', 'Unlimited restoration', 'Annual health checkup', 'Maternity cover option', 'Mental health covered'],
            taxBenefit: '80D: ₹25K (self) + ₹50K (parents senior)',
            color: '#0891B2', icon: 'fa-heart'
        },
        'HDFC ERGO Optima Secure': {
            company: 'HDFC ERGO', name: 'Optima Secure', type: 'Health',
            logo: 'assets/hdfc-life-insurance.jpg',
            minAge: 18, maxAge: 65, coverMin: '₹5L', coverMax: '₹1Cr',
            premiumFrom: '₹9,000/yr', claimRatio: '68%',
            policyTerm: '1-3 years', paymentModes: 'Yearly',
            features: ['Restore benefit 100%', 'Multiplier benefit', 'In-patient & OPD cover', 'Pre & post hospitalization', 'Global emergency cover'],
            taxBenefit: '80D: ₹25K (self) + ₹50K (parents senior)',
            color: '#6D28D9', icon: 'fa-hand-holding-medical'
        },
        'Care Health Supreme': {
            company: 'Care Health', name: 'Care Supreme', type: 'Health',
            logo: 'assets/care-health.png',
            minAge: 18, maxAge: 65, coverMin: '₹5L', coverMax: '₹6Cr',
            premiumFrom: '₹6,500/yr', claimRatio: '58%',
            policyTerm: '1-3 years', paymentModes: 'Yearly, Half-Yearly',
            features: ['Unlimited restoration', 'Air ambulance cover', 'No sub-limits on claims', 'Wellness benefits', 'OPD cover add-on'],
            taxBenefit: '80D: ₹25K (self) + ₹50K (parents senior)',
            color: '#0D9488', icon: 'fa-notes-medical'
        },
        // ===== CHILD PLANS =====
        'LIC Jeevan Tarun': {
            company: 'LIC', name: 'Jeevan Tarun', type: 'Child Plan',
            logo: 'assets/lic-logo.png',
            minAge: 0, maxAge: 12, coverMin: '₹75K', coverMax: '₹10L',
            premiumFrom: '₹3,000/yr', claimRatio: '98.6%',
            policyTerm: 'Till child turns 25', paymentModes: 'Yearly, Half-Yearly',
            features: ['Premium waiver on parent death', 'Survival benefits at 20-24 yrs', 'Maturity at 25 years', 'Government backed LIC', 'Bonus additions'],
            taxBenefit: '80C: ₹1.5L + 10(10D)',
            color: '#B45309', icon: 'fa-baby'
        },
        'HDFC YoungStar': {
            company: 'HDFC Life', name: 'YoungStar Super Premium', type: 'Child ULIP',
            logo: 'assets/hdfc-life-insurance.jpg',
            minAge: 0, maxAge: 17, coverMin: '₹1L', coverMax: 'No limit',
            premiumFrom: '₹5,000/yr', claimRatio: '99.1%',
            policyTerm: '5-25 years', paymentModes: 'Yearly, Monthly',
            features: ['Market-linked returns', 'Premium waiver rider', 'Partial withdrawals', 'Fund switching 12/yr free', 'Life cover + investment'],
            taxBenefit: '80C: ₹1.5L + 10(10D)',
            color: '#7C3AED', icon: 'fa-graduation-cap'
        },
        // ===== RETIREMENT =====
        'LIC Jeevan Shanti': {
            company: 'LIC', name: 'Jeevan Shanti', type: 'Pension Plan',
            logo: 'assets/lic-logo.png',
            minAge: 30, maxAge: 79, coverMin: '₹1.5L', coverMax: 'No limit',
            premiumFrom: '₹1.5L (single premium)', claimRatio: '98.6%',
            policyTerm: 'Lifetime', paymentModes: 'Single Premium',
            features: ['Guaranteed pension for life', 'Joint life option', 'Return of purchase price', 'Tax-free accumulation', 'Government backed'],
            taxBenefit: '80CCC: ₹1.5L + Pension taxable',
            color: '#1E40AF', icon: 'fa-person-cane'
        }
    };

    // Detect policy mentions in AI reply text
    function detectPolicies(text) {
        var found = [];
        var textLower = text.toLowerCase();
        for (var key in POLICY_DATABASE) {
            // Check for exact policy name or company+product combination
            if (textLower.includes(key.toLowerCase())) {
                found.push(POLICY_DATABASE[key]);
            } else {
                // Also check for company name + product name separately
                var policy = POLICY_DATABASE[key];
                var companyLower = policy.company.toLowerCase();
                var nameLower = policy.name.toLowerCase().split(' ')[0]; // First word of name
                if (textLower.includes(companyLower) && textLower.includes(nameLower)) {
                    found.push(policy);
                }
            }
        }
        // Deduplicate by name
        var unique = [];
        var seen = {};
        for (var i = 0; i < found.length; i++) {
            var fullName = found[i].company + ' ' + found[i].name;
            if (!seen[fullName]) {
                seen[fullName] = true;
                unique.push(found[i]);
            }
        }
        return unique.slice(0, 5); // Max 5 policies
    }

    // ===== POLICY CARD =====
    function showPolicyCards(policies) {
        if (!infoCards || !policies.length) return;
        var html = '<div class="pp-section">' +
            '<div class="pp-header">' +
            '<div class="pp-header-icon"><i class="fas fa-shield-halved"></i></div>' +
            '<div><div class="pp-header-title">Recommended Policies</div>' +
            '<div class="pp-header-sub">' + policies.length + ' plan' + (policies.length > 1 ? 's' : '') + ' matched</div></div>' +
            '</div>';

        policies.forEach(function (p, i) {
            var delay = (i * 0.12).toFixed(2);
            var logoSrc = p.logo || '';
            var initials = p.company.split(' ').map(function (w) { return w[0] }).join('').slice(0, 2);

            html += '<div class="pp-card" style="animation-delay:' + delay + 's;border-left:4px solid ' + p.color + '">';

            // Header: Logo + Name + Type badge
            html += '<div class="pp-card-top">';
            if (logoSrc) {
                html += '<div class="pp-logo"><img src="' + logoSrc + '" alt="' + p.company + '" class="pp-logo-img"></div>';
            } else {
                html += '<div class="pp-logo" style="background:' + p.color + '"><span>' + initials + '</span></div>';
            }
            html += '<div class="pp-card-info">' +
                '<div class="pp-name">' + p.company + '</div>' +
                '<div class="pp-plan-name">' + p.name + '</div>' +
                '</div>' +
                '<div class="pp-type-badge" style="background:' + p.color + '20;color:' + p.color + '">' + p.type + '</div>' +
                '</div>';

            // Key stats
            html += '<div class="pp-stats">' +
                '<div class="pp-stat">' +
                '<div class="pp-stat-val" style="color:' + p.color + '">' + p.premiumFrom + '</div>' +
                '<div class="pp-stat-lbl">Premium From</div>' +
                '</div>' +
                '<div class="pp-stat">' +
                '<div class="pp-stat-val pp-val-green">' + p.claimRatio + '</div>' +
                '<div class="pp-stat-lbl">Claim Ratio</div>' +
                '</div>' +
                '<div class="pp-stat">' +
                '<div class="pp-stat-val">' + p.coverMax + '</div>' +
                '<div class="pp-stat-lbl">Max Cover</div>' +
                '</div>' +
                '</div>';

            // Features
            html += '<div class="pp-features">';
            p.features.slice(0, 4).forEach(function (f) {
                html += '<span class="pp-feature"><i class="fas fa-check" style="color:' + p.color + '"></i> ' + f + '</span>';
            });
            html += '</div>';

            // Details row
            html += '<div class="pp-details">' +
                '<div class="pp-detail"><span class="pp-detail-lbl">Age</span><span class="pp-detail-val">' + p.minAge + '-' + p.maxAge + ' yrs</span></div>' +
                '<div class="pp-detail"><span class="pp-detail-lbl">Term</span><span class="pp-detail-val">' + p.policyTerm + '</span></div>' +
                '<div class="pp-detail"><span class="pp-detail-lbl">Tax</span><span class="pp-detail-val">' + p.taxBenefit.split(':')[0] + '</span></div>' +
                '</div>';

            // Action buttons
            html += '<div class="pp-actions">' +
                '<button class="pp-apply-btn" style="background:' + p.color + '" onclick="showToast(\'Redirecting to ' + p.company + ' website...\', \'success\')"><i class="fas fa-arrow-right"></i> Apply Now</button>' +
                '<button class="pp-compare-btn" onclick="showToast(\'Added to comparison\', \'info\')"><i class="fas fa-scale-balanced"></i></button>' +
                '</div>';

            html += '</div>'; // pp-card
        });

        html += '</div>'; // pp-section
        infoCards.innerHTML = html;
        if (infoPlaceholder) infoPlaceholder.style.display = 'none';
    }
    window.showPolicyCards = showPolicyCards;

    // ===== AUDIO PIPELINE =====
    var audioCtx, gainNode, compressorNode, eqNode;
    function ensureAudioBoost() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Warm EQ: gentle low-shelf boost for fuller voice body
            eqNode = audioCtx.createBiquadFilter();
            eqNode.type = 'lowshelf';
            eqNode.frequency.value = 300;
            eqNode.gain.value = 3;
            // Gentle compressor for consistent smooth volume
            compressorNode = audioCtx.createDynamicsCompressor();
            compressorNode.threshold.value = -18;
            compressorNode.knee.value = 20;
            compressorNode.ratio.value = 3;
            compressorNode.attack.value = 0.01;
            compressorNode.release.value = 0.15;
            // Clean gain — comfortable listening level
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.8;
            // Chain: source → EQ → compressor → gain → speakers
            eqNode.connect(compressorNode);
            compressorNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    // ===== TTS =====
    var currentAudio = null;
    function cleanTextForTTS(text) {
        return text
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
            .replace(/[*#_~`|\[\](){}]/g, '')
            .replace(/\bhttps?:\/\/\S+/g, '')
            .replace(/\n+/g, '. ')
            .replace(/\.\.+/g, '.')
            .replace(/\s+/g, ' ')
            .replace(/\. \./g, '.')
            .trim();
    }

    async function speakText(text) {
        stopSpeaking();
        var clean = cleanTextForTTS(text);
        if (!clean) return;
        ensureAudioBoost();
        try {
            var resp = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: clean, language: currentLang })
            });
            if (!resp.ok) throw new Error('TTS server error');
            var audioBlob = await resp.blob();
            var arrayBuf = await audioBlob.arrayBuffer();
            var audioBuf = await audioCtx.decodeAudioData(arrayBuf);
            var source = audioCtx.createBufferSource();
            source.buffer = audioBuf;
            source.playbackRate.value = 1.0;
            source.connect(eqNode);
            source.start(0);
            currentAudio = source;
            setState('speaking');
            source.onended = function () {
                currentAudio = null;
                if (state === 'speaking') setState('idle');
            };
        } catch (e) {
            console.warn('TTS fallback to browser:', e);
            try {
                var utter = new SpeechSynthesisUtterance(clean);
                var langTag = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
                utter.lang = langTag;
                // Try to pick the best available voice for the language
                var voices = speechSynthesis.getVoices();
                var bestVoice = null;
                for (var vi = 0; vi < voices.length; vi++) {
                    if (voices[vi].lang === langTag || voices[vi].lang.startsWith(langTag.split('-')[0])) {
                        if (!bestVoice || voices[vi].name.indexOf('Natural') >= 0 || voices[vi].name.indexOf('Online') >= 0) {
                            bestVoice = voices[vi];
                        }
                    }
                }
                if (bestVoice) utter.voice = bestVoice;
                utter.volume = 1; utter.rate = 0.95; utter.pitch = 1.05;
                utter.onstart = function () { setState('speaking'); };
                utter.onend = function () { if (state === 'speaking') setState('idle'); };
                speechSynthesis.speak(utter);
            } catch (e2) { console.error('All TTS failed:', e2); }
        }
    }

    function stopSpeaking() {
        if (currentAudio) { try { currentAudio.stop(); } catch (e) { } currentAudio = null; }
        try { speechSynthesis.cancel(); } catch (e) { }
        if (state === 'speaking') setState('idle');
    }

    // ===== SPEECH RECOGNITION =====

    function initSpeechRecognition() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showToast('Speech recognition not supported. Use Chrome!', 'error'); return; }
        recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onstart = function () {
            setState('listening');
            showToast(langData[currentLang].listening, 'info');
        };

        recognition.onresult = function (e) {
            clearTimeout(silenceTimer);
            var finalText = '', interimText = '';
            for (var i = 0; i < e.results.length; i++) {
                var t = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalText += t + ' ';
                else interimText += t;
            }
            var displayFinal = finalText.trim();
            var displayInterim = interimText.trim();
            // Live transcript
            if (transcriptText) {
                var html = '';
                if (displayFinal) html += '<span style="color:var(--va-text)">' + displayFinal + '</span> ';
                if (displayInterim) html += '<span style="color:var(--va-text-muted);font-style:italic">' + displayInterim + '</span>';
                transcriptText.innerHTML = html || '<span style="color:var(--va-text-muted)">Listening...</span>';
            }
            // Live vehicle detection on interim too
            var combined = (displayFinal + ' ' + displayInterim).trim();
            checkLiveVehicleDetection(combined);
            // Update text input
            if (textInput) textInput.value = combined;
            // Reset silence
            silenceTimer = setTimeout(function () {
                if (recognition && state === 'listening') {
                    recognition.stop();
                }
            }, SILENCE_TIMEOUT);
        };

        recognition.onend = function () {
            clearTimeout(silenceTimer);
            var finalInput = textInput ? textInput.value.trim() : '';
            if (finalInput && state === 'listening') {
                setState('thinking');
                // Apply converters
                var processed = convertSpokenNumbers(finalInput);
                processed = convertIndicLetters(processed);
                if (textInput) textInput.value = processed;
                sendToAI(processed);
            } else {
                setState('idle');
            }
            // Hide live transcript
            if (liveTranscript) liveTranscript.classList.remove('visible');
        };

        recognition.onerror = function (e) {
            clearTimeout(silenceTimer);
            if (e.error === 'no-speech') {
                showToast(langData[currentLang].noSpeech || 'No speech detected', 'warning');
            } else if (e.error !== 'aborted') {
                showToast('Mic error: ' + e.error, 'error');
            }
            setState('idle');
            if (liveTranscript) liveTranscript.classList.remove('visible');
        };
    }

    function toggleListening() {
        ensureAudioBoost();
        if (state === 'listening') {
            recognition && recognition.stop();
            return;
        }
        stopSpeaking();
        if (!recognition) initSpeechRecognition();
        recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
        // Reset transcript
        if (transcriptText) transcriptText.innerHTML = '<span style="color:var(--va-text-muted)">Listening...</span>';
        if (vehicleDetectBanner) vehicleDetectBanner.classList.remove('visible');
        if (liveTranscript) liveTranscript.classList.add('visible');
        if (textInput) textInput.value = '';
        try { recognition.start(); } catch (e) { console.warn('Recognition restart:', e); }
    }

    // ===== VEHICLE LOOKUP =====
    async function lookupAndShowVehicle(vehicleNum) {
        addTypingIndicator();
        setState('thinking');
        try {
            var resp = await fetch('/api/vehicle/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: vehicleNum })
            });
            var data = await resp.json();
            removeTypingIndicator();
            var formatted = formatVehicleNumber(vehicleNum);
            if (data.success) {
                var v = data.data;
                var reply = langData[currentLang].found
                    .replace('{num}', formatted)
                    .replace('{owner}', v.ownerName || 'N/A')
                    .replace('{model}', v.make + ' ' + v.model)
                    .replace('{year}', v.year)
                    .replace('{fuel}', v.fuel)
                    .replace('{status}', v.insuranceStatus || 'Unknown');
                addMessage(reply, 'assistant');
                speakText(reply);
                showVehicleCard(v, formatted);
                // Switch to vehicle tab
                switchPanel('vehicle');
                // Auto-fetch quotes using vehicle data from lookup
                try {
                    var qResp = await fetch('/api/insurance/quotes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ make: v.make, model: v.model, year: v.year, cc: v.cc })
                    });
                    var qData = await qResp.json();
                    if (qData.success && qData.quotes) showQuotesCard(qData, formatted);
                    else if (data.data.quotes) showQuotesCard({ quotes: data.data.quotes }, formatted);
                } catch (qe) {
                    console.warn('Quotes fetch failed, using lookup quotes:', qe);
                    if (data.data.quotes) showQuotesCard({ quotes: data.data.quotes }, formatted);
                }
            } else {
                var notFound = currentLang === 'te' ? formatted + ' \u0C15\u0C3F \u0C38\u0C02\u0C2C\u0C02\u0C27\u0C3F\u0C02\u0C1A\u0C3F\u0C28 \u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32\u0C41 \u0C26\u0C4A\u0C30\u0C15\u0C32\u0C47\u0C26\u0C41. \u0C2E\u0C33\u0C4D\u0C33\u0C40 \u0C2A\u0C4D\u0C30\u0C2F\u0C24\u0C4D\u0C28\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F!'
                    : currentLang === 'hi' ? formatted + ' \u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0940\u0964 \u0926\u094B\u092C\u093E\u0930\u093E \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902!'
                        : 'Vehicle ' + formatted + ' not found in our database. Please check the number and try again!';
                addMessage(notFound, 'assistant');
                speakText(notFound);
            }
        } catch (e) {
            removeTypingIndicator();
            addMessage('Network error looking up vehicle. Please try again!', 'assistant');
        }
        setState('idle');
        renderSuggestions();
    }

    // ===== VEHICLE CARD =====
    function showVehicleCard(v, formatted) {
        if (!infoCards) return;
        var insStatus = v.insuranceStatus || 'Unknown';
        var isActive = insStatus.indexOf('Active') >= 0;
        var statusClass = isActive ? 'vp-status-active' : 'vp-status-expired';
        var statusDot = isActive ? 'vp-dot-active' : 'vp-dot-expired';
        var fuelClass = (v.fuel || 'Petrol').toLowerCase();
        if (fuelClass === 'electric') fuelClass = 'ev';
        infoCards.innerHTML =
            '<div class="vp-vehicle-card">' +
            '<div class="vp-card-glow"></div>' +
            '<div class="vp-plate-wrap">' +
            '<div class="vp-plate">' +
            '<div class="vp-plate-country"><span>IND</span></div>' +
            '<div class="vp-plate-number">' + formatted + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="vp-owner-row">' +
            '<div class="vp-avatar"><i class="fas fa-user"></i></div>' +
            '<div><div class="vp-owner-name">' + (v.ownerName || 'N/A') + '</div>' +
            '<div class="vp-owner-sub">' + (v.state || '') + (v.rtoName ? ' \u2022 ' + v.rtoName : '') + '</div></div>' +
            '</div>' +
            '<div class="vp-specs">' +
            '<div class="vp-spec"><div class="vp-spec-icon"><i class="fas fa-motorcycle"></i></div><div class="vp-spec-val">' + v.make + ' ' + v.model + '</div><div class="vp-spec-lbl">Vehicle</div></div>' +
            '<div class="vp-spec"><div class="vp-spec-icon"><i class="fas fa-calendar"></i></div><div class="vp-spec-val">' + v.year + '</div><div class="vp-spec-lbl">Year</div></div>' +
            '<div class="vp-spec"><div class="vp-spec-icon vp-fuel-' + fuelClass + '"><i class="fas fa-' + (fuelClass === 'ev' ? 'bolt' : 'gas-pump') + '"></i></div><div class="vp-spec-val">' + v.fuel + '</div><div class="vp-spec-lbl">Fuel</div></div>' +
            '<div class="vp-spec"><div class="vp-spec-icon"><i class="fas fa-cog"></i></div><div class="vp-spec-val">' + (v.cc || 'N/A') + 'cc</div><div class="vp-spec-lbl">Engine</div></div>' +
            '</div>' +
            '<div class="vp-insurance-strip ' + statusClass + '">' +
            '<div class="vp-ins-left"><span class="vp-dot ' + statusDot + '"></span><span class="vp-ins-label">Insurance</span></div>' +
            '<div class="vp-ins-right">' + insStatus + (v.fitnessValidUpto ? ' <span class="vp-exp">Exp: ' + v.fitnessValidUpto + '</span>' : '') + '</div>' +
            '</div>' +
            (v.idv ? '<div class="vp-idv-bar"><div class="vp-idv-left"><i class="fas fa-shield-halved"></i> IDV</div><div class="vp-idv-val">\u20B9' + v.idv.toLocaleString() + '</div></div>' : '') +
            '</div>';
        if (infoPlaceholder) infoPlaceholder.style.display = 'none';
    }

    // ===== QUOTES CARD =====
    function showQuotesCard(qData, formatted) {
        var quotes = qData.quotes || [];
        if (!quotes.length) return;

        // Logo map for known insurers (fallback to first letters)
        var logoMap = {
            'hdfc': 'assets/hdfc-life-insurance.jpg',
            'icici': 'assets/icici-prudential-life-insurance.png',
            'bajaj': 'assets/bajaj-allianz-life-insurance.png',
            'tata': 'assets/tata-aia-life-insurance.jpg',
            'sbi': 'assets/sbi-life-insurance.jpg',
            'max': 'assets/max-life-insurance.jpg'
        };

        // Find cheapest for "best value" badge
        var cheapestIdx = 0;
        var cheapestVal = Infinity;
        quotes.forEach(function (q, i) {
            var p = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.total : (q.premium || q.finalPremium || 999999);
            if (p < cheapestVal) { cheapestVal = p; cheapestIdx = i; }
        });

        var quotesHtml = '<div class="vq-section">' +
            '<div class="vq-header">' +
            '<div class="vq-header-icon"><i class="fas fa-chart-bar"></i></div>' +
            '<div><div class="vq-header-title">Insurance Quotes</div>' +
            '<div class="vq-header-sub">' + quotes.length + ' plans for ' + formatted + '</div></div>' +
            '</div>';

        quotes.forEach(function (q, i) {
            var delay = (i * 0.12).toFixed(2);
            var qName = q.insurerName || q.provider || 'Insurer';
            var qId = q.insurerId || qName.toLowerCase().split(' ')[0];
            var qPremium = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.total : (q.premium || q.finalPremium || 0);
            var qOD = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.ownDamage : 0;
            var qTP = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.thirdParty : 0;
            var qPlanType = q.planType || q.type || 'Comprehensive';
            var qFeatures = q.features || q.coverages || ['Third Party', 'Own Damage', 'Personal Accident'];
            var claimRatio = q.claimSettlementRatio || 95;
            var garages = q.networkGarages || 5000;
            var rating = q.rating || 4.0;
            var discount = q.discount || 0;
            var isBest = (i === cheapestIdx);
            var logoSrc = q.logo || logoMap[qId] || '';

            // Generate star HTML
            var starsHtml = '';
            var fullStars = Math.floor(rating);
            var halfStar = (rating - fullStars) >= 0.3;
            for (var s = 0; s < fullStars; s++) starsHtml += '<i class="fas fa-star"></i>';
            if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
            for (var e = fullStars + (halfStar ? 1 : 0); e < 5; e++) starsHtml += '<i class="far fa-star"></i>';

            quotesHtml += '<div class="vq-card' + (isBest ? ' vq-best' : '') + '" style="animation-delay:' + delay + 's">';

            // Best value crown
            if (isBest) {
                quotesHtml += '<div class="vq-crown"><i class="fas fa-crown"></i> BEST VALUE</div>';
            }

            // Row 1: Logo + Name/Rating + Price
            quotesHtml += '<div class="vq-card-top">';
            if (logoSrc) {
                quotesHtml += '<div class="vq-logo"><img src="' + logoSrc + '" alt="' + qName + '" class="vq-logo-img"></div>';
            } else {
                var initials = qName.split(' ').map(function (w) { return w[0] }).join('').slice(0, 2);
                quotesHtml += '<div class="vq-logo"><span>' + initials + '</span></div>';
            }
            quotesHtml += '<div class="vq-card-info">' +
                '<div class="vq-name">' + qName + '</div>' +
                '<div class="vq-stars">' + starsHtml + '<span>' + rating.toFixed(1) + '</span></div>' +
                '</div>' +
                '<div class="vq-price-col">' +
                '<div class="vq-price">\u20B9' + (typeof qPremium === 'number' ? qPremium.toLocaleString() : qPremium) + '</div>' +
                '<div class="vq-price-sub">' + qPlanType + (discount ? ' | ' + discount + '% off' : '') + '</div>' +
                '</div>' +
                '</div>';

            // Row 2: Stats (Claim Ratio, Garages, Discount)
            quotesHtml += '<div class="vq-stats">' +
                '<div class="vq-stat">' +
                '<div class="vq-stat-val vq-val-green">' + claimRatio + '%</div>' +
                '<div class="vq-stat-lbl">Claim Ratio</div>' +
                '<div class="vq-stat-bar"><div class="vq-stat-fill vq-fill-green" style="width:' + claimRatio + '%"></div></div>' +
                '</div>' +
                '<div class="vq-stat">' +
                '<div class="vq-stat-val">' + (garages >= 1000 ? (garages / 1000).toFixed(1) + 'K+' : garages) + '</div>' +
                '<div class="vq-stat-lbl">Garages</div>' +
                '<div class="vq-stat-bar"><div class="vq-stat-fill vq-fill-cyan" style="width:' + Math.min(garages / 80, 100) + '%"></div></div>' +
                '</div>' +
                '<div class="vq-stat">' +
                '<div class="vq-stat-val" style="color:#F59E0B">' + discount + '%</div>' +
                '<div class="vq-stat-lbl">Discount</div>' +
                '<div class="vq-stat-bar"><div class="vq-stat-fill" style="width:' + Math.min(discount * 5, 100) + '%"></div></div>' +
                '</div>' +
                '</div>';

            // Row 3: Feature tags
            quotesHtml += '<div class="vq-tags">';
            qFeatures.slice(0, 4).forEach(function (f) {
                quotesHtml += '<span class="vq-tag">' + f + '</span>';
            });
            quotesHtml += '</div>';

            // Row 4: TP/OD Breakdown + Buy Now
            quotesHtml += '<div class="vq-card-bottom">';
            if (qTP || qOD) {
                quotesHtml += '<div class="vq-breakdown">' +
                    '<span>TP \u20B9' + qTP.toLocaleString() + '</span>' +
                    '<span>OD \u20B9' + qOD.toLocaleString() + '</span>' +
                    '</div>';
            }
            quotesHtml += '<button class="vq-buy-btn' + (isBest ? ' vq-buy-best' : '') + '" onclick="handlePayment(\'' + qName.replace(/'/g, "\\'") + '\',' + qPremium + ',\'' + qPlanType + '\')">' +
                '<i class="fas fa-shield-halved"></i> Buy Now</button>' +
                '</div>';

            quotesHtml += '</div>'; // close vq-card
        });

        quotesHtml += '</div>'; // close vq-section

        // Append to existing content (vehicle card stays, quotes go after)
        if (infoCards) infoCards.innerHTML += quotesHtml;

        // Show quotes message
        var cheapest = quotes[cheapestIdx];
        var cheapestPremium = (cheapest.premium && cheapest.premium.comprehensive) ? cheapest.premium.comprehensive.total : (cheapest.premium || cheapest.finalPremium || 0);
        var cheapestName = cheapest.insurerName || cheapest.provider || 'Insurer';
        var qMsg = '\uD83D\uDCCA Found ' + quotes.length + ' insurance plans! Best rate: \u20B9' + (typeof cheapestPremium === 'number' ? cheapestPremium.toLocaleString() : cheapestPremium) + '/yr from ' + cheapestName + '. Tap "Buy Now" to proceed!';
        addMessage(qMsg, 'assistant');
    }

    // ===== PAYMENT =====
    function handlePayment(provider, premium, planType) {
        showPaymentOptions(provider, premium, planType);
    }

    function showPaymentOptions(provider, premium, planType) {
        var formatted = lastDetectedVehicle ? formatVehicleNumber(lastDetectedVehicle) : 'Your Vehicle';
        if (infoCards) {
            infoCards.innerHTML =
                '<div class="vp-payment" style="animation:slideUp 0.4s ease">' +
                '<div class="vp-pay-header">' +
                '<div class="vp-pay-icon"><i class="fas fa-credit-card"></i></div>' +
                '<div><div class="vp-pay-title">Secure Checkout</div>' +
                '<div class="vp-pay-sub">' + provider + ' &bull; ' + planType + '</div></div>' +
                '</div>' +
                '<div class="vp-pay-amount">' +
                '<div class="vp-pay-label">Total Premium</div>' +
                '<div class="vp-pay-price">\u20B9' + premium.toLocaleString() + '</div>' +
                '<div class="vp-pay-gst">incl. 18% GST &bull; ' + formatted + '</div>' +
                '</div>' +
                '<div class="vp-pay-methods">' +
                '<button class="vp-pay-btn" onclick="processPayment(\'UPI\',\'' + provider + '\',' + premium + ')">' +
                '<div class="vp-pay-btn-left"><div class="vp-pay-btn-icon vp-upi"><i class="fas fa-mobile-screen-button"></i></div><div><div class="vp-pay-btn-name">UPI</div><div class="vp-pay-btn-desc">GPay, PhonePe, Paytm</div></div></div><i class="fas fa-chevron-right vp-pay-arrow"></i></button>' +
                '<button class="vp-pay-btn" onclick="processPayment(\'Card\',\'' + provider + '\',' + premium + ')">' +
                '<div class="vp-pay-btn-left"><div class="vp-pay-btn-icon vp-card"><i class="fas fa-credit-card"></i></div><div><div class="vp-pay-btn-name">Card</div><div class="vp-pay-btn-desc">Credit / Debit Card</div></div></div><i class="fas fa-chevron-right vp-pay-arrow"></i></button>' +
                '<button class="vp-pay-btn" onclick="processPayment(\'NetBanking\',\'' + provider + '\',' + premium + ')">' +
                '<div class="vp-pay-btn-left"><div class="vp-pay-btn-icon vp-bank"><i class="fas fa-building-columns"></i></div><div><div class="vp-pay-btn-name">Net Banking</div><div class="vp-pay-btn-desc">All major banks</div></div></div><i class="fas fa-chevron-right vp-pay-arrow"></i></button>' +
                '</div>' +
                '<div class="vp-pay-secure"><i class="fas fa-lock"></i> 256-bit SSL encrypted payment</div>' +
                '</div>';
        }
        switchPanel('quotes');
        addMessage('\uD83D\uDCB3 Ready to buy ' + planType + ' from ' + provider + ' for \u20B9' + premium.toLocaleString() + '. Choose your payment method!', 'assistant');
    }

    // Make globally accessible
    window.handlePayment = handlePayment;

    function processPayment(method, provider, premium) {
        showToast('Processing ' + method + ' payment...', 'info');
        if (infoCards) {
            infoCards.innerHTML =
                '<div class="vp-processing" style="animation:slideUp 0.4s ease">' +
                '<div class="vp-proc-spinner"><div class="vp-proc-ring"></div><i class="fas fa-lock"></i></div>' +
                '<h3 class="vp-proc-title">Processing Payment</h3>' +
                '<p class="vp-proc-sub">Connecting securely to ' + method + '...</p>' +
                '<div class="vp-proc-steps">' +
                '<div class="vp-proc-step active"><i class="fas fa-check-circle"></i> Verifying details</div>' +
                '<div class="vp-proc-step"><i class="fas fa-spinner fa-spin"></i> Connecting to gateway</div>' +
                '<div class="vp-proc-step"><i class="fas fa-circle"></i> Confirming payment</div>' +
                '</div>' +
                '</div>';
        }
        setTimeout(function () {
            showToast('\u2705 Payment successful!', 'success');
            var policyNo = 'INS' + Date.now().toString().slice(-8);
            var startDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            var endDate = new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            if (infoCards) {
                infoCards.innerHTML =
                    '<div class="vp-success" style="animation:slideUp 0.4s ease">' +
                    '<div class="vp-success-check"><div class="vp-success-ring"></div><i class="fas fa-check"></i></div>' +
                    '<h3 class="vp-success-title">Payment Successful!</h3>' +
                    '<p class="vp-success-amount">\u20B9' + premium.toLocaleString() + ' via ' + method + '</p>' +
                    '<div class="vp-policy-card">' +
                    '<div class="vp-policy-header"><i class="fas fa-shield-halved"></i> ' + provider + '</div>' +
                    '<div class="vp-policy-rows">' +
                    '<div class="vp-policy-row"><span class="vp-policy-lbl">Policy No</span><span class="vp-policy-val">' + policyNo + '</span></div>' +
                    '<div class="vp-policy-row"><span class="vp-policy-lbl">Vehicle</span><span class="vp-policy-val">' + (lastDetectedVehicle ? formatVehicleNumber(lastDetectedVehicle) : 'N/A') + '</span></div>' +
                    '<div class="vp-policy-row"><span class="vp-policy-lbl">Period</span><span class="vp-policy-val">' + startDate + ' \\u2014 ' + endDate + '</span></div>' +
                    '<div class="vp-policy-row"><span class="vp-policy-lbl">Status</span><span class="vp-policy-val vp-status-green"><i class="fas fa-circle" style="font-size:6px"></i> Active</span></div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="vp-success-actions">' +
                    '<button class="vp-action-btn" onclick="showToast(\'Policy document will be emailed\',\'success\')"><i class="fas fa-download"></i> Download Policy</button>' +
                    '<button class="vp-action-btn vp-action-share" onclick="showToast(\'Share link copied!\',\'success\')"><i class="fas fa-share-nodes"></i> Share</button>' +
                    '</div>' +
                    '</div>';
            }
            var successMsg = '\u2705 Payment of \u20B9' + premium.toLocaleString() + ' via ' + method + ' successful! Your ' + provider + ' policy is now active. Policy document will be sent to your email. Stay insured! \uD83D\uDE4F';
            addMessage(successMsg, 'assistant');
            speakText(successMsg);
        }, 2500);
    }
    window.processPayment = processPayment;

    // ===== PANEL TABS =====
    function switchPanel(tabName) {
        var tabs = document.querySelectorAll('.va-panel-tab');
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        // Update mobile badge
        if (mobilePanelToggle) {
            var badge = mobilePanelToggle.querySelector('.va-toggle-badge');
            if (badge) {
                badge.textContent = tabName === 'vehicle' ? '\uD83C\uDFCD\uFE0F' : tabName === 'quotes' ? '\uD83D\uDCCA' : tabName === 'policies' ? '\uD83D\uDEE1\uFE0F' : '\uD83D\uDCCB';
            }
        }
    }

    // ===== SUGGESTIONS =====
    function renderSuggestions() {
        if (!suggestionsBar) return;
        var ld = langData[currentLang] || langData.en;
        var chips = ld.chips || ld.suggestions || [];
        suggestionsBar.innerHTML = '';
        chips.forEach(function (text) {
            var btn = document.createElement('button');
            btn.className = 'va-suggestion';
            btn.textContent = text;
            btn.addEventListener('click', function () {
                if (textInput) textInput.value = text;
                sendToAI(text);
            });
            suggestionsBar.appendChild(btn);
        });
    }

    // ===== LANGUAGE TOGGLE =====
    function toggleLanguage() {
        var langs = ['en', 'te', 'hi'];
        var idx = langs.indexOf(currentLang);
        currentLang = langs[(idx + 1) % langs.length];
        var ld = langData[currentLang] || langData.en;
        if (langLabel) langLabel.textContent = ld.label || ld.langLabel;
        if (textInput) textInput.placeholder = ld.placeholder;
        if (recognition) {
            recognition.lang = currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
        }
        renderSuggestions();
        showToast('Language: ' + (ld.label || ld.langLabel), 'info');
    }

    // ===== TEXT SEND =====
    function handleTextSend() {
        var text = textInput ? textInput.value.trim() : '';
        if (!text) return;
        textInput.value = '';
        var processed = convertSpokenNumbers(text);
        processed = convertIndicLetters(processed);
        sendToAI(processed);
    }

    // ===== INIT & EVENT HANDLERS =====
    function init() {
        // Canvas
        initBgCanvas();
        initWaveCanvas();
        renderSuggestions();

        // Orb click
        if (voiceOrb) {
            voiceOrb.addEventListener('click', function () {
                if (state === 'speaking') { stopSpeaking(); return; }
                toggleListening();
            });
        }

        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', handleTextSend);
        }

        // Text input enter
        if (textInput) {
            textInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSend();
                }
            });
        }

        // Language toggle
        if (langBtn) {
            langBtn.addEventListener('click', toggleLanguage);
        }

        // Panel tabs
        document.querySelectorAll('.va-panel-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchPanel(tab.dataset.tab);
            });
        });

        // Vehicle number plate input
        if (vehicleNumberInput) {
            vehicleNumberInput.addEventListener('input', function () {
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
            vehicleNumberInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    var val = this.value.trim().replace(/\s/g, '').toUpperCase();
                    if (val.length >= 6) {
                        lastDetectedVehicle = val;
                        showToast('Looking up: ' + formatVehicleNumber(val), 'info');
                        lookupAndShowVehicle(val);
                    } else {
                        showToast('Enter a valid vehicle number (e.g. TS08JM2665)', 'warning');
                    }
                }
            });
        }
        if (vehicleLookupBtn) {
            vehicleLookupBtn.addEventListener('click', function () {
                var val = vehicleNumberInput ? vehicleNumberInput.value.trim().replace(/\s/g, '').toUpperCase() : '';
                if (val.length >= 6) {
                    lastDetectedVehicle = val;
                    showToast('Looking up: ' + formatVehicleNumber(val), 'info');
                    lookupAndShowVehicle(val);
                } else {
                    showToast('Enter a valid vehicle number (e.g. TS08JM2665)', 'warning');
                }
            });
        }

        // Example buttons
        document.querySelectorAll('.va-example-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var num = btn.dataset.number;
                if (num) {
                    if (vehicleNumberInput) vehicleNumberInput.value = num;
                    lastDetectedVehicle = num;
                    showToast('Looking up: ' + formatVehicleNumber(num), 'info');
                    lookupAndShowVehicle(num);
                }
            });
        });

        // Mobile panel toggle
        if (mobilePanelToggle) {
            mobilePanelToggle.addEventListener('click', function () {
                var panel = document.querySelector('.va-info-panel');
                if (panel) panel.classList.toggle('mobile-open');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') {
                e.preventDefault();
                if (state === 'speaking') stopSpeaking();
                else toggleListening();
            }
            if (e.key === 'l' || e.key === 'L') {
                toggleLanguage();
            }
            if (e.key === 'Escape') {
                if (state === 'listening') recognition && recognition.stop();
                stopSpeaking();
            }
        });

        // Set initial lang label
        var ld = langData[currentLang] || langData.en;
        if (langLabel) langLabel.textContent = ld.label || ld.langLabel;
        if (textInput) textInput.placeholder = ld.placeholder;

        // Greeting
        setTimeout(function () {
            var greeting = langData[currentLang].welcome || langData[currentLang].greeting || 'Hey! I\'m Insurix, your insurance assistant. Tell me your vehicle number or ask anything about insurance!';
            addMessage(greeting, 'assistant');
            speakText(greeting);
        }, 800);
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
