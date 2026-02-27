// ===== Insurix.India Clone - Full Interactive JavaScript =====

document.addEventListener('DOMContentLoaded', function() {

    // ===== HEADER SCROLL EFFECT =====
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ===== MOBILE NAVIGATION =====
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('mainNav');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Mobile dropdown toggle
    document.querySelectorAll('.has-dropdown').forEach(function(item) {
        item.querySelector('.nav-link').addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && mainNav.classList.contains('active')) {
                e.preventDefault();
                item.classList.toggle('open');
            }
        });
    });

    // ===== HERO SLIDER =====
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    let currentSlide = 0;
    let heroInterval;

    function showSlide(index) {
        heroSlides.forEach(function(slide) { slide.classList.remove('active'); });
        heroDots.forEach(function(dot) { dot.classList.remove('active'); });
        heroSlides[index].classList.add('active');
        heroDots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        var next = (currentSlide + 1) % heroSlides.length;
        showSlide(next);
    }

    function startHeroSlider() {
        heroInterval = setInterval(nextSlide, 4000);
    }

    heroDots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            clearInterval(heroInterval);
            showSlide(parseInt(this.getAttribute('data-slide')));
            startHeroSlider();
        });
    });

    if (heroSlides.length > 0) {
        startHeroSlider();
    }

    // ===== SIGN IN MODAL =====
    const signinBtn = document.getElementById('signinBtn');
    const signinModal = document.getElementById('signinModal');
    const modalClose = document.getElementById('modalClose');
    const signinForm = document.getElementById('signinForm');
    const otpSection = document.getElementById('otpSection');

    if (signinBtn) {
        signinBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signinModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', function() {
            signinModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (signinModal) {
        signinModal.addEventListener('click', function(e) {
            if (e.target === signinModal) {
                signinModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var phone = document.getElementById('signinPhone');
            if (phone.value.length === 10) {
                signinForm.style.display = 'none';
                otpSection.style.display = 'block';
                // Auto focus first OTP box
                var firstOtp = otpSection.querySelector('.otp-box');
                if (firstOtp) firstOtp.focus();
            } else {
                phone.style.borderColor = '#EF4444';
                phone.addEventListener('input', function() {
                    this.style.borderColor = '';
                }, { once: true });
            }
        });
    }

    // OTP auto-advance
    document.querySelectorAll('.otp-box').forEach(function(box, index, boxes) {
        box.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 1 && index < boxes.length - 1) {
                boxes[index + 1].focus();
            }
        });
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                boxes[index - 1].focus();
            }
        });
    });

    // Verify OTP
    var verifyOtp = document.getElementById('verifyOtp');
    if (verifyOtp) {
        verifyOtp.addEventListener('click', function() {
            var otpBoxes = document.querySelectorAll('.otp-box');
            var otp = '';
            otpBoxes.forEach(function(b) { otp += b.value; });
            if (otp.length === 4) {
                this.textContent = '✓ Verified Successfully!';
                this.style.background = '#16A34A';
                setTimeout(function() {
                    signinModal.classList.remove('active');
                    document.body.style.overflow = '';
                    // Reset form
                    signinForm.style.display = '';
                    otpSection.style.display = 'none';
                    verifyOtp.textContent = 'Verify OTP';
                    verifyOtp.style.background = '';
                    otpBoxes.forEach(function(b) { b.value = ''; });
                    document.getElementById('signinPhone').value = '';
                }, 1500);
            }
        });
    }

    // ===== TALK TO EXPERT MODAL =====
    var talkExpertBtn = document.querySelector('.talk-expert');
    var expertModal = document.getElementById('expertModal');
    var expertModalClose = document.getElementById('expertModalClose');
    var expertForm = document.getElementById('expertForm');

    if (talkExpertBtn) {
        talkExpertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            expertModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (expertModalClose) {
        expertModalClose.addEventListener('click', function() {
            expertModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (expertModal) {
        expertModal.addEventListener('click', function(e) {
            if (e.target === expertModal) {
                expertModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (expertForm) {
        expertForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = this.querySelector('.btn-modal-submit');
            btn.textContent = '✓ Callback Requested!';
            btn.style.background = '#16A34A';
            setTimeout(function() {
                expertModal.classList.remove('active');
                document.body.style.overflow = '';
                btn.textContent = 'Request Callback';
                btn.style.background = '';
                expertForm.reset();
            }, 2000);
        });
    }

    // ===== LIVE CHAT =====
    var chatBtn = document.getElementById('chatBtn');
    var chatWindow = document.getElementById('chatWindow');
    var chatClose = document.getElementById('chatClose');
    var chatInput = document.getElementById('chatInput');
    var chatSend = document.getElementById('chatSend');
    var chatBody = document.getElementById('chatBody');

    if (chatBtn) {
        chatBtn.addEventListener('click', function() {
            chatWindow.classList.toggle('active');
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', function() {
            chatWindow.classList.remove('active');
        });
    }

    function addChatMessage(text, type) {
        var msg = document.createElement('div');
        msg.className = 'chat-message ' + type;
        msg.innerHTML = '<p>' + text + '</p>';
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    var botResponses = [
        "I'd be happy to help you with that! Could you tell me which type of insurance you're looking for?",
        "We have great plans starting from ₹490/month for term life insurance. Would you like me to share more details?",
        "You can compare plans from 51+ insurers on our platform. Let me help you find the best one!",
        "Our team of experts is available 24/7. Would you like me to connect you with an advisor?",
        "That's a great question! Let me find the best answer for you.",
        "We offer cashless claims at 7000+ network hospitals. Would you like to know more about health insurance?",
        "You can save up to 25% on your insurance premium by buying online through Insurix.India!"
    ];

    function sendChat() {
        var text = chatInput.value.trim();
        if (text) {
            addChatMessage(text, 'user');
            chatInput.value = '';
            // Bot response after delay
            setTimeout(function() {
                var response = botResponses[Math.floor(Math.random() * botResponses.length)];
                addChatMessage(response, 'bot');
            }, 1000);
        }
    }

    if (chatSend) {
        chatSend.addEventListener('click', sendChat);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendChat();
        });
    }

    // ===== PRODUCT ITEM CLICK =====
    document.querySelectorAll('.product-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var name = this.querySelector('.product-name').textContent;
            // Scroll to top and show a brief notification
            showNotification('Exploring ' + name + ' plans...');
        });
    });

    // ===== NOTIFICATION SYSTEM =====
    function showNotification(message) {
        var existing = document.querySelector('.notification');
        if (existing) existing.remove();

        var notif = document.createElement('div');
        notif.className = 'notification';
        notif.style.cssText = 'position:fixed;top:80px;right:24px;background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;font-family:Inter,sans-serif;';
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(function() {
            notif.style.opacity = '0';
            notif.style.transform = 'translateX(20px)';
            notif.style.transition = 'all 0.3s ease';
            setTimeout(function() { notif.remove(); }, 300);
        }, 2500);
    }

    // Add notification animation
    var style = document.createElement('style');
    style.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(style);

    // ===== SCROLL ANIMATIONS =====
    var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in class to animatable elements
    var animElements = document.querySelectorAll(
        '.product-item, .also-buy-tag, .promo-card, .why-card, .info-card, .calc-card, .advantage-item, .testimonial-card, .partner-logo, .help-contact-card'
    );

    animElements.forEach(function(el) {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // ===== PHONE INPUT VALIDATION =====
    document.querySelectorAll('input[type="tel"]').forEach(function(input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    });

    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', function(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(function(modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
            if (chatWindow) chatWindow.classList.remove('active');
        }
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                var target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // ===== ALSO BUY TAG HOVER EFFECT =====
    document.querySelectorAll('.also-buy-tag').forEach(function(tag) {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Exploring ' + this.textContent.trim() + '...');
        });
    });

    // ===== CALCULATOR LINKS =====
    document.querySelectorAll('.calc-list a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Opening ' + this.textContent.trim() + '...');
        });
    });

    // ===== HERO CTA =====
    document.querySelectorAll('.hero-cta').forEach(function(cta) {
        cta.addEventListener('click', function(e) {
            e.preventDefault();
            // Scroll to products section
            var products = document.querySelector('.products-section');
            if (products) {
                products.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ===== VIEW ALL PRODUCTS =====
    var viewAllBtn = document.querySelector('.btn-view-all');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var row2 = document.querySelector('.products-row.row-2');
            if (row2) {
                if (row2.style.display === 'none') {
                    row2.style.display = 'grid';
                    this.textContent = 'Show less';
                } else {
                    row2.style.display = 'none';
                    this.textContent = 'View all products';
                }
            }
        });
    }

    // ===== PROMO CARD INTERACTIONS =====
    document.querySelectorAll('.promo-card').forEach(function(card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            var label = this.querySelector('.promo-label');
            if (label) {
                showNotification('Exploring ' + label.textContent + '...');
            }
        });
    });

    // ===== KNOW MORE LINK =====
    var knowMore = document.querySelector('.know-more-link');
    if (knowMore) {
        knowMore.addEventListener('click', function(e) {
            e.preventDefault();
            var list = document.querySelector('.advantage-list');
            if (list) {
                list.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // ===== APP STORE BUTTONS =====
    document.querySelectorAll('.app-store-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Redirecting to app store...');
        });
    });

    // ===== PARTNER LOGO CLICK =====
    document.querySelectorAll('.partner-logo').forEach(function(logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function() {
            var img = this.querySelector('img');
            if (img) {
                showNotification('Viewing ' + img.alt + ' plans...');
            }
        });
    });

    // ===== FOOTER EXPANDABLE SECTIONS (Mobile) =====
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.footer-col h4').forEach(function(heading) {
            heading.style.cursor = 'pointer';
            heading.addEventListener('click', function() {
                var ul = this.nextElementSibling;
                if (ul && ul.tagName === 'UL') {
                    if (ul.style.display === 'none') {
                        ul.style.display = 'block';
                    } else {
                        ul.style.display = 'none';
                    }
                }
            });
        });
    }

    // ===== TESTIMONIAL AUTO-SCROLL =====
    var testimonialCards = document.querySelectorAll('.testimonial-card');
    var testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
    var currentTestimonial = 0;

    if (testimonialCards.length > 0 && window.innerWidth <= 768) {
        setInterval(function() {
            currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
            testimonialCards.forEach(function(card, i) {
                card.style.display = i === currentTestimonial ? 'block' : 'none';
            });
            testimonialDots.forEach(function(dot, i) {
                dot.classList.toggle('active', i === currentTestimonial);
            });
        }, 3000);
    }

});
