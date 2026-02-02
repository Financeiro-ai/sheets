// --- Lenis Setup ---
const lenis = new Lenis({
    duration: 1.5, // Increased from 1.2
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    wheelMultiplier: 0.9, // Lighter scroll (was 0.7)
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- Custom Scroll Triggers ---
// Hero Image Trigger (Manual)
const heroImage = document.getElementById('hero-image');
if (heroImage) {
    const heroScrollHandler = ({ scroll }) => {
        if (scroll > 50) {
            heroImage.classList.add('reveal-visible');
            lenis.off('scroll', heroScrollHandler);
        }
    };
    lenis.on('scroll', heroScrollHandler);
}

// --- Reveal on Scroll ---
// Add reveal class to elements that should animate on scroll
document.querySelectorAll('.card, .pricing-card, h2, .workflow-text, .book-scene').forEach(el => {
    if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
    }
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-delay') || 0;

            setTimeout(() => {
                entry.target.classList.add('reveal-visible');
            }, parseInt(delay));

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// Observe all reveal elements except hero image (has its own scroll trigger)
document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    if (el.id !== 'hero-image') {
        revealObserver.observe(el);
    }
});

// --- Book Specific Logic (Preserving Component) ---
const bookScene = document.querySelector('.book-scene');
if (bookScene) {
    const bookObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                bookObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    bookObserver.observe(bookScene);
}

// --- Canvas Grid Background ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let strength = 40;

// Mouse state
const mouse = { x: -1000, y: -1000 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Grid Configuration
const spacing = 50;
const points = [];
let cols = 0;
let rows = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Initialize Grid Points
function initGrid() {
    points.length = 0;
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            points.push({
                x: i * spacing,
                y: j * spacing,
                originX: i * spacing,
                originY: j * spacing,
                vx: 0,
                vy: 0
            });
        }
    }
}
initGrid();
window.addEventListener('resize', initGrid);

// Animation Loop
function animateGrid() {
    ctx.clearRect(0, 0, width, height);

    // Line style
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // Subtle white lines
    ctx.lineWidth = 1;

    // Update Points Physics
    points.forEach(p => {
        // Distance from mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Physics: "Magnet/Repel" effect
        // We want a "lift" effect. Since it's 2D, we can simulate lift by distorting the grid
        // Let's pull points slightly TOWARDS the mouse or push AWAY to simulate a 3D hill/valley

        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;

        // An "Elevation" effect is better simulated by slight expansion or lens effect
        // Let's try pushing points AWAY from cursor to simulate a "hill" coming up towards camera
        // or pulling IN to simulate a "valley"

        const maxDistance = 250;
        let force = 0;

        if (distance < maxDistance) {
            force = (maxDistance - distance) / maxDistance;
            // Easing
            force = Math.pow(force, 2);

            // Move point away from origin based on mouse proximity
            // But we need to return to origin

            // Target position based on mouse interaction
            // Let's simply offset based on distance
            const angle = Math.atan2(dy, dx);
            // Move AWAY from mouse:
            const moveX = Math.cos(angle) * force * -strength;
            const moveY = Math.sin(angle) * force * -strength;

            // Reduced spring constant (0.1 -> 0.03) for slower reaction aka "weight"
            p.vx += (p.originX + moveX - p.x) * 0.03;
            p.vy += (p.originY + moveY - p.y) * 0.03;
        } else {
            // Spring back to origin
            p.vx += (p.originX - p.x) * 0.03;
            p.vy += (p.originY - p.y) * 0.03;
        }

        // Increased friction (0.85 -> 0.90) to prevent wobble with low spring force
        // Actually to make it sluggish, we want high friction
        p.vx *= 0.9;
        p.vy *= 0.9;

        p.x += p.vx;
        p.y += p.vy;
    });

    // Draw Grid Lines
    ctx.beginPath();

    // Horizontal Lines
    for (let j = 0; j < rows; j++) {
        // Draw spline or lines along the row
        // Simple lines between points
        for (let i = 0; i < cols - 1; i++) {
            const p1 = points[i * rows + j];
            const p2 = points[(i + 1) * rows + j];
            if (p1 && p2) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
    }

    // Vertical Lines
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows - 1; j++) {
            const p1 = points[i * rows + j];
            const p2 = points[i * rows + j + 1];
            if (p1 && p2) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
    }

    ctx.stroke();

    requestAnimationFrame(animateGrid);
}

animateGrid();
