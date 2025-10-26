// Confetti Animation Module
// Creates a celebratory confetti effect when results are calculated

class ConfettiAnimation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isActive = false;
  }

  // Initialize confetti canvas
  init() {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    this.canvas.style.opacity = '0';
    this.canvas.style.transition = 'opacity 0.3s ease-out';

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }

  // Resize canvas to match window
  resize() {
    if (!this.canvas) return;
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Create confetti particles
  createParticles(targetElement) {
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
      '#10b981', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'
    ];

    // Create multiple bursts of particles
    for (let burst = 0; burst < 3; burst++) {
      const particleCount = 15 + Math.random() * 10;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = 2 + Math.random() * 3;
        const delay = burst * 200 + Math.random() * 100;

        this.particles.push({
          x: centerX + (Math.random() - 0.5) * 20,
          y: centerY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          gravity: 0.1,
          bounce: 0.6,
          life: 1.0,
          decay: 0.015,
          delay: delay,
          shape: Math.random() > 0.5 ? 'circle' : 'square'
        });
      }
    }
  }

  // Update particle positions
  updateParticles() {
    const now = Date.now();
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Skip delayed particles
      if (now < particle.delay) continue;
      
      // Update physics
      particle.vy += particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      particle.life -= particle.decay;

      // Bounce off bottom
      if (particle.y > this.canvas.height - particle.size) {
        particle.y = this.canvas.height - particle.size;
        particle.vy *= -particle.bounce;
        particle.vx *= 0.8; // Friction
      }

      // Remove dead particles
      if (particle.life <= 0 || particle.x < -50 || particle.x > this.canvas.width + 50) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Draw particles
  drawParticles() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      if (Date.now() < particle.delay) return;

      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      this.ctx.fillStyle = particle.color;

      if (particle.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
      }

      this.ctx.restore();
    });
  }

  // Animation loop
  animate() {
    if (!this.isActive) return;

    this.updateParticles();
    this.drawParticles();

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.stop();
    }
  }

  // Start confetti animation
  start(targetElement) {
    this.init();
    this.createParticles(targetElement);
    
    if (this.particles.length === 0) return;

    this.isActive = true;
    this.canvas.style.opacity = '1';
    this.animate();
  }

  // Stop confetti animation
  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.canvas) {
      this.canvas.style.opacity = '0';
      setTimeout(() => {
        if (this.canvas && this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
          this.canvas = null;
          this.ctx = null;
        }
      }, 300);
    }
    
    this.particles = [];
  }

  // Cleanup
  destroy() {
    this.stop();
    window.removeEventListener('resize', () => this.resize());
  }
}

// Create global confetti instance
const confettiAnimation = new ConfettiAnimation();

// Export functions for use in other modules
export function triggerConfetti(targetElement) {
  confettiAnimation.start(targetElement);
}

export function stopConfetti() {
  confettiAnimation.stop();
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  confettiAnimation.destroy();
});
