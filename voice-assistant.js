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
            speakBtn.onclick = function() { speakText(text); };
            const copyBtn = document.createElement('button');
            copyBtn.className = 'msg-action-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.onclick = function() { navigator.clipboard.writeText(text); showToast('Copied to clipboard!', 'success', 2000); };
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
            'zero':'0','oh':'0','o':'0','one':'1','won':'1','two':'2','to':'2','too':'2','tu':'2',
            'three':'3','tree':'3','tri':'3','four':'4','for':'4','fore':'4','five':'5',
            'six':'6','siks':'6','seven':'7','eight':'8','ate':'8','nine':'9','nein':'9',
            '\u0C38\u0C41\u0C28\u0C4D\u0C28':'0','\u0C12\u0C15\u0C1F\u0C3F':'1','\u0C30\u0C46\u0C02\u0C21\u0C41':'2','\u0C2E\u0C42\u0C21\u0C41':'3',
            '\u0C28\u0C3E\u0C32\u0C41\u0C17\u0C41':'4','\u0C10\u0C26\u0C41':'5','\u0C06\u0C30\u0C41':'6','\u0C0F\u0C21\u0C41':'7',
            '\u0C0E\u0C28\u0C3F\u0C2E\u0C3F\u0C26\u0C3F':'8','\u0C24\u0C4A\u0C2E\u0C4D\u0C2E\u0C3F\u0C26\u0C3F':'9',
            '\u0936\u0942\u0928\u094D\u092F':'0','\u090F\u0915':'1','\u0926\u094B':'2','\u0924\u0940\u0928':'3',
            '\u091A\u093E\u0930':'4','\u092A\u093E\u0901\u091A':'5','\u091B\u0939':'6','\u0938\u093E\u0924':'7',
            '\u0906\u0920':'8','\u0928\u094C':'9',
            'ten':'10','eleven':'11','twelve':'12','thirteen':'13','fourteen':'14','fifteen':'15',
            'sixteen':'16','seventeen':'17','eighteen':'18','nineteen':'19','twenty':'20',
            'thirty':'30','forty':'40','fifty':'50','sixty':'60','seventy':'70','eighty':'80','ninety':'90',
            'hundred':'00','thousand':'000','double':''
        };
        let result = text;
        result = result.replace(/double\s+(\w+)/gi, function(match, word) {
            var digit = wordToDigit[word.toLowerCase()];
            if (digit && digit.length === 1) return digit + digit;
            return match;
        });
        result = result.replace(/triple\s+(\w+)/gi, function(match, word) {
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
            ['\u0C1F\u0C40\u0C0E\u0C38\u0C4D','TS'],['\u0C1F\u0C40 \u0C0E\u0C38\u0C4D','TS'],['\u0C24\u0C40\u0C0E\u0C38\u0C4D','TS'],['\u0C24\u0C40 \u0C0E\u0C38\u0C4D','TS'],['\u0C1F\u0C3F \u0C0E\u0C38\u0C4D','TS'],
            ['\u0C0F\u0C2A\u0C40','AP'],['\u0C0F \u0C2A\u0C40','AP'],['\u0C0E\u0C2A\u0C3F','AP'],['\u0C0E \u0C2A\u0C3F','AP'],['\u0C0E\u0C2A\u0C40','AP'],
            ['\u0C15\u0C47\u0C0F','KA'],['\u0C15\u0C47 \u0C0F','KA'],['\u0C15\u0C46\u0C0E','KA'],['\u0C15\u0C47\u0C0E','KA'],
            ['\u0C0E\u0C02\u0C39\u0C46\u0C1A\u0C4D','MH'],['\u0C0E\u0C02 \u0C39\u0C46\u0C1A\u0C4D','MH'],
            ['\u0C21\u0C40\u0C0E\u0C32\u0C4D','DL'],['\u0C21\u0C40 \u0C0E\u0C32\u0C4D','DL'],
            ['\u0C1F\u0C40\u0C0E\u0C28\u0C4D','TN'],['\u0C1F\u0C40 \u0C0E\u0C28\u0C4D','TN'],
            ['\u0C15\u0C47\u0C0E\u0C32\u0C4D','KL'],['\u0C15\u0C47 \u0C0E\u0C32\u0C4D','KL'],
            ['\u0C06\u0C30\u0C4D\u0C1C\u0C47','RJ'],['\u0C06\u0C30\u0C4D \u0C1C\u0C47','RJ'],
            ['\u0C2F\u0C42\u0C2A\u0C40','UP'],['\u0C2F\u0C42 \u0C2A\u0C40','UP'],
            ['\u0C1C\u0C40\u0C1C\u0C47','GJ'],['\u0C1C\u0C40 \u0C1C\u0C47','GJ'],
            ['\u0C39\u0C46\u0C1A\u0C4D\u0C06\u0C30\u0C4D','HR'],['\u0C39\u0C46\u0C1A\u0C4D \u0C06\u0C30\u0C4D','HR'],
            ['\u0C0E\u0C02\u0C2A\u0C40','MP'],['\u0C0E\u0C02 \u0C2A\u0C40','MP'],
            ['\u0C38\u0C40\u0C1C\u0C40','CG'],['\u0C38\u0C40 \u0C1C\u0C40','CG'],
            ['\u0C21\u0C2C\u0C4D\u0C32\u0C4D\u0C2F\u0C42\u0C2C\u0C3F','WB'],
            ['\u091F\u0940\u090F\u0938','TS'],['\u090F\u092A\u0940','AP'],['\u0915\u0947\u090F','KA'],['\u090F\u092E\u090F\u091A','MH'],
            ['\u0921\u0940\u090F\u0932','DL'],['\u091F\u0940\u090F\u0928','TN'],['\u0915\u0947\u090F\u0932','KL'],['\u0906\u0930\u091C\u0947','RJ'],
            ['\u092F\u0942\u092A\u0940','UP'],['\u091C\u0940\u091C\u0947','GJ'],['\u090F\u091A\u0906\u0930','HR'],['\u090F\u092E\u092A\u0940','MP']
        ];
        stateCombos.sort(function(a, b) { return b[0].length - a[0].length; });
        for (var i = 0; i < stateCombos.length; i++) {
            result = result.replace(new RegExp(stateCombos[i][0], 'g'), ' ' + stateCombos[i][1] + ' ');
        }
        var letters = [
            ['\u0C0E\u0C15\u0C4D\u0C38\u0C4D','X'],['\u0C21\u0C2C\u0C4D\u0C32\u0C4D\u0C2F\u0C42','W'],['\u0C15\u0C4D\u0C2F\u0C42','Q'],
            ['\u0C39\u0C46\u0C1A\u0C4D','H'],['\u0C1C\u0C46\u0C21\u0C4D','Z'],['\u0C0E\u0C2B\u0C4D','F'],
            ['\u0C0E\u0C2E\u0C4D','M'],['\u0C0E\u0C28\u0C4D','N'],['\u0C0E\u0C38\u0C4D','S'],['\u0C0E\u0C32\u0C4D','L'],
            ['\u0C06\u0C30\u0C4D','R'],
            ['\u0C1F\u0C40','T'],['\u0C1F\u0C3F','T'],['\u0C21\u0C40','D'],['\u0C21\u0C3F','D'],
            ['\u0C2C\u0C40','B'],['\u0C2C\u0C3F','B'],['\u0C38\u0C40','C'],['\u0C38\u0C3F','C'],
            ['\u0C15\u0C47','K'],['\u0C15\u0C46','K'],['\u0C1C\u0C40','G'],['\u0C1C\u0C3F','G'],
            ['\u0C2A\u0C40','P'],['\u0C2A\u0C3F','P'],['\u0C35\u0C40','V'],['\u0C35\u0C3F','V'],
            ['\u0C2F\u0C42','U'],['\u0C2F\u0C41','U'],['\u0C35\u0C48','Y'],
            ['\u0C1C\u0C46','J'],['\u0C1C\u0C47','J'],
            ['\u0C0F','A'],['\u0C0E','A'],['\u0C10','I'],['\u0C13','O'],
            ['\u090F\u0915\u094D\u0938','X'],['\u0921\u092C\u094D\u0932\u094D\u092F\u0942','W'],['\u0915\u094D\u092F\u0942','Q'],
            ['\u090F\u091A','H'],['\u091C\u0947\u0921','Z'],['\u090F\u092B','F'],
            ['\u090F\u092E','M'],['\u090F\u0928','N'],['\u090F\u0938','S'],['\u090F\u0932','L'],
            ['\u0906\u0930','R'],['\u0935\u093E\u0908','Y'],
            ['\u091F\u0940','T'],['\u0921\u0940','D'],['\u092C\u0940','B'],['\u0938\u0940','C'],
            ['\u0915\u0947','K'],['\u091C\u0940','G'],['\u092A\u0940','P'],['\u0935\u0940','V'],
            ['\u091C\u0947','J'],['\u090F','A'],['\u0913','O'],['\u0906\u0908','I']
        ];
        letters.sort(function(a, b) { return b[0].length - a[0].length; });
        for (var i = 0; i < letters.length; i++) {
            result = result.replace(new RegExp(letters[i][0], 'g'), letters[i][1]);
        }
        result = result.replace(/(\S*)\u0C1F\u0C4D\u0C38\u0C4D/g, function(match, prefix) {
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
            setTimeout(function() { numberPlate.classList.remove('detected'); }, 2000);
            showToast('Vehicle number detected: ' + formatVehicleNumber(num), 'vehicle', 3000);
        }
    }

    // ===== LOCAL FALLBACK KNOWLEDGE BASE =====
    var localKB = {
        en: {
            greetings: { patterns: ['hello','hi','hey','namaste','good morning','good evening','howdy','sup','yo'], response: "Hey there! \uD83D\uDC4B I'm Insurix, your insurance buddy! Tell me your vehicle number and I'll pull up all the details \u2014 or ask me anything about insurance!" },
            vehicle: { patterns: ['vehicle','bike','car','scooter','motorcycle','two wheeler','my number','registration','ts','ap','mh','ka','dl','tn','kl'], response: "Got it! Let me pull up your vehicle details real quick! \uD83D\uDD0D" },
            premium: { patterns: ['premium','price','cost','rate','how much','expensive','cheap','affordable'], response: "Premium depends on vehicle age, IDV & CC! IRDAI Third Party rates:\n\u2022 \u226475cc: \u20B9538/yr\n\u2022 75-150cc: \u20B9714/yr\n\u2022 150-350cc: \u20B91,366/yr\n\u2022 350cc+: \u20B92,804/yr\n\nNCB can save you up to 50%! \uD83D\uDCB0" },
            health: { patterns: ['health','medical','hospital','doctor','family health'], response: "Health Insurance starts from \u20B9500/month! \uD83C\uDFE5 Cashless treatment at 7000+ hospitals, coverage from \u20B95L to \u20B91Cr. Want me to compare plans?" },
            life: { patterns: ['life','term','death','term plan','term insurance'], response: "Term Life Insurance from just \u20B9490/month! \uD83D\uDC9D Get \u20B91 Crore coverage with 99.1% claim settlement. That's only \u20B925/day for complete family protection!" },
            claim: { patterns: ['claim','accident','damage','repair','cashless','file claim'], response: "Filing a claim is easy! \uD83D\uDCCB\n1\uFE0F\u20E3 File FIR (if accident)\n2\uFE0F\u20E3 Call insurer helpline\n3\uFE0F\u20E3 Submit documents\n4\uFE0F\u20E3 Surveyor inspection\n5\uFE0F\u20E3 Cashless repair or reimbursement\n\n24/7 claims support available!" },
            ncb: { patterns: ['ncb','no claim bonus','bonus','discount'], response: "NCB (No Claim Bonus) rewards claim-free years! \uD83C\uDF81\n\u2022 1 yr: 20% off\n\u2022 2 yrs: 25% off\n\u2022 3 yrs: 35% off\n\u2022 4 yrs: 45% off\n\u2022 5+ yrs: 50% off\n\nApplies on OD premium only." },
            idv: { patterns: ['idv','insured declared','market value','depreciation'], response: "IDV = Current market value of your vehicle \uD83D\uDCB0\n\nIDV = Ex-Showroom - Depreciation\n\u2022 6 months: 5%\n\u2022 1 yr: 15%\n\u2022 2 yrs: 20%\n\u2022 3 yrs: 30%\n\u2022 4 yrs: 40%\n\u2022 5+ yrs: 50%" },
            comprehensive: { patterns: ['comprehensive','third party','tp vs','comp vs','which policy','which insurance','difference','types'], response: "Great question! \uD83D\uDEE1\uFE0F\n\n\u2022 Third Party Only \u2014 Covers damage to others, legally required. Cheapest option.\n\u2022 Comprehensive \u2014 Covers YOUR vehicle + third party. Best protection!\n\nFor newer vehicles, always go Comprehensive." },
            thanks: { patterns: ['thanks','thank you','great','awesome','nice','good','perfect','cool','ok'], response: "You're welcome! \uD83D\uDE0A Happy to help with any insurance questions. Feel free to ask anytime!" }
        },
        te: {
            greetings: { patterns: ['\u0C39\u0C32\u0C4B','\u0C39\u0C3E\u0C2F\u0C4D','\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C02','\u0C28\u0C2E\u0C38\u0C4D\u0C24\u0C47','\u0C39\u0C48'], response: '\u0C39\u0C3E\u0C2F\u0C4D! \uD83D\uDE4F \u0C28\u0C47\u0C28\u0C41 Insurix, \u0C2E\u0C40 insurance buddy! \u0C2E\u0C40 \u0C35\u0C3E\u0C39\u0C28 \u0C28\u0C02\u0C2C\u0C30\u0C4D \u0C1A\u0C46\u0C2A\u0C4D\u0C24\u0C47 \u0C05\u0C28\u0C4D\u0C28\u0C3F details \u0C1A\u0C42\u0C2A\u0C3F\u0C38\u0C4D\u0C24\u0C3E\u0C28\u0C41!' },
            vehicle: { patterns: ['\u0C2C\u0C48\u0C15\u0C4D','\u0C15\u0C3E\u0C30\u0C4D','\u0C35\u0C3E\u0C39\u0C28\u0C02','\u0C2C\u0C02\u0C21\u0C3F','\u0C38\u0C4D\u0C15\u0C42\u0C1F\u0C30\u0C4D','\u0C28\u0C02\u0C2C\u0C30\u0C4D'], response: '\u0C05\u0C30\u0C4D\u0C25\u0C2E\u0C48\u0C02\u0C26\u0C3F! \u0C2E\u0C40 \u0C35\u0C3E\u0C39\u0C28 \u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32\u0C41 \u0C24\u0C40\u0C38\u0C41\u0C15\u0C41\u0C38\u0C4D\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41! \uD83D\uDD0D' },
            premium: { patterns: ['\u0C27\u0C30','\u0C2A\u0C4D\u0C30\u0C40\u0C2E\u0C3F\u0C2F\u0C02','\u0C0E\u0C02\u0C24','\u0C30\u0C47\u0C1F\u0C41','\u0C16\u0C30\u0C4D\u0C1A\u0C41'], response: 'IRDAI TP \u0C30\u0C47\u0C1F\u0C4D\u0C32\u0C41:\n\u2022 \u226475cc: \u20B9538\n\u2022 75-150cc: \u20B9714\n\u2022 150-350cc: \u20B91,366\n\u2022 350cc+: \u20B92,804\n\nNCB \u0C24\u0C4B 50% \u0C35\u0C30\u0C15\u0C41 \u0C24\u0C17\u0C4D\u0C17\u0C3F\u0C02\u0C2A\u0C41! \uD83D\uDCB0' },
            thanks: { patterns: ['\u0C27\u0C28\u0C4D\u0C2F\u0C35\u0C3E\u0C26\u0C02','\u0C25\u0C4D\u0C2F\u0C3E\u0C02\u0C15\u0C4D\u0C38\u0C4D','\u0C2C\u0C3E\u0C17\u0C41\u0C02\u0C26\u0C3F','\u0C38\u0C42\u0C2A\u0C30\u0C4D'], response: '\u0C27\u0C28\u0C4D\u0C2F\u0C35\u0C3E\u0C26\u0C3E\u0C32\u0C41! \uD83D\uDE0A \u0C07\u0C02\u0C15\u0C3E \u0C0F\u0C26\u0C48\u0C28\u0C3E \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F!' }
        },
        hi: {
            greetings: { patterns: ['\u0939\u0947\u0932\u094B','\u0939\u093E\u0907','\u0928\u092E\u0938\u094D\u0924\u0947','\u0939\u0948\u0932\u094B'], response: '\u0939\u0947\u0932\u094B! \uD83D\uDE4F \u092E\u0948\u0902 Insurix \u0939\u0942\u0901, \u0906\u092A\u0915\u093E insurance buddy! \u0917\u093E\u0921\u093C\u0940 \u0928\u0902\u092C\u0930 \u092C\u0924\u093E\u0913, \u0938\u092C details \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0942\u0901!' },
            vehicle: { patterns: ['\u092C\u093E\u0907\u0915','\u0915\u093E\u0930','\u0935\u093E\u0939\u0928','\u0917\u093E\u0921\u093C\u0940','\u0938\u094D\u0915\u0942\u091F\u0930','\u0928\u0902\u092C\u0930'], response: '\u0938\u092E\u091D \u0917\u092F\u093E! \u0906\u092A\u0915\u0940 \u0917\u093E\u0921\u093C\u0940 \u0915\u0940 details \u0932\u093E\u0924\u093E \u0939\u0942\u0901! \uD83D\uDD0D' },
            thanks: { patterns: ['\u0927\u0928\u094D\u092F\u0935\u093E\u0926','\u0936\u0941\u0915\u094D\u0930\u093F\u092F\u093E','\u0905\u091A\u094D\u091B\u093E','\u092C\u0922\u093C\u093F\u092F\u093E'], response: '\u0936\u0941\u0915\u094D\u0930\u093F\u092F\u093E! \uD83D\uDE0A \u0914\u0930 \u0915\u0941\u091B \u092A\u0942\u091B\u0928\u093E \u0939\u094B \u0924\u094B \u092C\u0924\u093E\u0907\u090F!' }
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
            try { window.InsurixChatbot.currentLang = currentLang; return window.InsurixChatbot.processMessage(userText); } catch(e) {}
        }
        return currentLang === 'te' ? '\u0C2E\u0C40 \u0C2A\u0C4D\u0C30\u0C36\u0C4D\u0C28\u0C15\u0C41 \u0C38\u0C2E\u0C3E\u0C27\u0C3E\u0C28\u0C02 \u0C07\u0C38\u0C4D\u0C24\u0C3E\u0C28\u0C41! \u0C2C\u0C40\u0C2E\u0C3E \u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F \u2014 \u0C2C\u0C48\u0C15\u0C4D, \u0C39\u0C46\u0C32\u0C4D\u0C24\u0C4D, \u0C32\u0C48\u0C2B\u0C4D \u0C07\u0C28\u0C4D\u0C38\u0C42\u0C30\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C0F\u0C26\u0C48\u0C28\u0C3E \u0C38\u0C30\u0C47! \uD83E\uDD14'
            : currentLang === 'hi' ? '\u0915\u094B\u0908 \u092C\u093E\u0924 \u0928\u0939\u0940\u0902! \u092C\u0940\u092E\u093E \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u0941\u091B \u092D\u0940 \u092A\u0942\u091B\u094B \u2014 \u092C\u093E\u0907\u0915, \u0939\u0947\u0932\u094D\u0925, \u0932\u093E\u0907\u092B \u0907\u0902\u0936\u094D\u092F\u094B\u0930\u0947\u0902\u0938! \uD83E\uDD14'
            : "No worries! Ask me about insurance \u2014 bike, health, life, claims, NCB, or just tell me your vehicle number! \uD83E\uDD14";
    }

    // ===== SEND TO AI =====
    async function sendToAI(userText) {
        addMessage(userText, 'user');
        var vehicleNum = extractVehicleNumber(userText);
        if (vehicleNum) {
            lastDetectedVehicle = vehicleNum;
            if (vehicleNumberInput) vehicleNumberInput.value = formatVehicleNumber(vehicleNum);
            showToast('Vehicle Detected: ' + formatVehicleNumber(vehicleNum), 'success');
            await lookupAndShowVehicle(vehicleNum);
            return;
        }
        addTypingIndicator();
        try {
            var resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText, language: currentLang })
            });
            if (!resp.ok) throw new Error('Server error');
            var data = await resp.json();
            removeTypingIndicator();
            var reply = data.reply || data.response || data.message || '';
            addMessage(reply, 'assistant');
            speakText(reply);
            var vn = extractVehicleNumber(reply);
            if (vn) {
                lastDetectedVehicle = vn;
                await lookupAndShowVehicle(vn);
            }
        } catch(e) {
            removeTypingIndicator();
            var localReply = getLocalReply(userText);
            addMessage(localReply, 'assistant');
            speakText(localReply);
        }
        renderSuggestions();
    }

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
            source.onended = function() {
                currentAudio = null;
                if (state === 'speaking') setState('idle');
            };
        } catch(e) {
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
                utter.onstart = function() { setState('speaking'); };
                utter.onend = function() { if (state === 'speaking') setState('idle'); };
                speechSynthesis.speak(utter);
            } catch(e2) { console.error('All TTS failed:', e2); }
        }
    }

    function stopSpeaking() {
        if (currentAudio) { try { currentAudio.stop(); } catch(e) {} currentAudio = null; }
        try { speechSynthesis.cancel(); } catch(e) {}
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

        recognition.onstart = function() {
            setState('listening');
            showToast(langData[currentLang].listening, 'info');
        };

        recognition.onresult = function(e) {
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
            silenceTimer = setTimeout(function() {
                if (recognition && state === 'listening') {
                    recognition.stop();
                }
            }, SILENCE_TIMEOUT);
        };

        recognition.onend = function() {
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

        recognition.onerror = function(e) {
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
        try { recognition.start(); } catch(e) { console.warn('Recognition restart:', e); }
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
            if (data.success) {
                var v = data.data;
                var formatted = formatVehicleNumber(vehicleNum);
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
                } catch(qe) {
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
        } catch(e) {
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
        quotes.forEach(function(q, i) {
            var p = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.total : (q.premium || q.finalPremium || 999999);
            if (p < cheapestVal) { cheapestVal = p; cheapestIdx = i; }
        });

        var quotesHtml = '<div class="vq-section">' +
            '<div class="vq-header">' +
                '<div class="vq-header-icon"><i class="fas fa-chart-bar"></i></div>' +
                '<div><div class="vq-header-title">Insurance Quotes</div>' +
                '<div class="vq-header-sub">' + quotes.length + ' plans for ' + formatted + '</div></div>' +
            '</div>';

        quotes.forEach(function(q, i) {
            var delay = (i * 0.12).toFixed(2);
            var qName = q.insurerName || q.provider || 'Insurer';
            var qId = q.insurerId || qName.toLowerCase().split(' ')[0];
            var qPremium = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.total : (q.premium || q.finalPremium || 0);
            var qOD = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.ownDamage : 0;
            var qTP = (q.premium && q.premium.comprehensive) ? q.premium.comprehensive.thirdParty : 0;
            var qPlanType = q.planType || q.type || 'Comprehensive';
            var qFeatures = q.features || q.coverages || ['Third Party','Own Damage','Personal Accident'];
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
                var initials = qName.split(' ').map(function(w){return w[0]}).join('').slice(0,2);
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
            qFeatures.slice(0, 4).forEach(function(f) {
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
        setTimeout(function() {
            showToast('\u2705 Payment successful!', 'success');
            var policyNo = 'INS' + Date.now().toString().slice(-8);
            var startDate = new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
            var endDate = new Date(Date.now()+365*86400000).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
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
        tabs.forEach(function(t) {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        // Update mobile badge
        if (mobilePanelToggle) {
            var badge = mobilePanelToggle.querySelector('.va-toggle-badge');
            if (badge) {
                badge.textContent = tabName === 'vehicle' ? '\uD83C\uDFCD\uFE0F' : tabName === 'quotes' ? '\uD83D\uDCCA' : '\uD83D\uDCCB';
            }
        }
    }

    // ===== SUGGESTIONS =====
    function renderSuggestions() {
        if (!suggestionsBar) return;
        var ld = langData[currentLang] || langData.en;
        var chips = ld.chips || ld.suggestions || [];
        suggestionsBar.innerHTML = '';
        chips.forEach(function(text) {
            var btn = document.createElement('button');
            btn.className = 'va-suggestion';
            btn.textContent = text;
            btn.addEventListener('click', function() {
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
            voiceOrb.addEventListener('click', function() {
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
            textInput.addEventListener('keydown', function(e) {
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
        document.querySelectorAll('.va-panel-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                switchPanel(tab.dataset.tab);
            });
        });

        // Vehicle number plate input
        if (vehicleNumberInput) {
            vehicleNumberInput.addEventListener('input', function() {
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
            vehicleNumberInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var val = this.value.trim();
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
            vehicleLookupBtn.addEventListener('click', function() {
                var val = vehicleNumberInput ? vehicleNumberInput.value.trim() : '';
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
        document.querySelectorAll('.va-example-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
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
            mobilePanelToggle.addEventListener('click', function() {
                var panel = document.querySelector('.va-info-panel');
                if (panel) panel.classList.toggle('mobile-open');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
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
        setTimeout(function() {
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
