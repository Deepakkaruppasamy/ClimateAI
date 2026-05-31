import { useEffect, useRef, useState, useCallback } from 'react';
import { playHover, playTap } from './audio';

// Shared global registries to coordinate card interactions
if (typeof window !== 'undefined') {
  window.quantumCards = window.quantumCards || [];
  window.quantumMouse = window.quantumMouse || { x: 0, y: 0, vx: 0, vy: 0, lastTime: 0 };
}

// Global mouse tracker (adds kinetic force vector based on cursor velocity)
let mouseListenerAdded = false;
function initGlobalMouse() {
  if (mouseListenerAdded || typeof window === 'undefined') return;
  mouseListenerAdded = true;

  const handleMouseMove = (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - window.quantumMouse.lastTime);
    
    // Calculate raw displacement
    const dx = e.clientX - window.quantumMouse.x;
    const dy = e.clientY - window.quantumMouse.y;
    
    // Smooth velocity with a simple exponential filter to prevent noise
    const rawVx = (dx / dt) * 16.67; // scale to 60fps frame displacement
    const rawVy = (dy / dt) * 16.67;
    
    window.quantumMouse.vx += (rawVx - window.quantumMouse.vx) * 0.3;
    window.quantumMouse.vy += (rawVy - window.quantumMouse.vy) * 0.3;
    
    window.quantumMouse.x = e.clientX;
    window.quantumMouse.y = e.clientY;
    window.quantumMouse.lastTime = now;
  };
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
}

/**
 * Premium Quantum Antigravity Physics Engine Hook
 * Manages spring return forces, viewport collision bounds bouncing,
 * kinetic cursor velocity repulsions, multi-layer sinusoidal drifts,
 * visual chromatic aberration, proximity glows, and automated off-screen dormancy.
 * 
 * @param {number} delay Injected time delay offset.
 * @param {number} zFactor Scroll parallax scale. 1.3: foreground, 1.0: midground, 0.5: background.
 */
export default function useQuantumFloat(delay = 0, zFactor = 1.0) {
  const elementRef = useRef(null);
  
  // Unique identification for proximity/collision calculations
  const idRef = useRef(`qc-${Math.random().toString(36).substr(2, 9)}`);
  
  // Physical offsets from original center position (home = 0, 0)
  const x = useRef(0);
  const y = useRef(0);
  
  // Current dynamic velocities
  const vx = useRef(0);
  const vy = useRef(0);
  
  // Tab active and Intersection states for energy conservation
  const isTabActive = useRef(true);
  const isIntersecting = useRef(true);
  
  // Drag states
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const lastMouseTime = useRef(0);
  const dragVx = useRef(0);
  const dragVy = useRef(0);
  
  // Custom unique wave parameters for multi-layered Sin/Cos quantum float
  const waveParams = useRef({
    freqX: 0.8 + Math.random() * 0.6,
    freqY: 0.7 + Math.random() * 0.6,
    freqZ: 0.5 + Math.random() * 0.5,
    ampX: 8 + Math.random() * 8,
    ampY: 10 + Math.random() * 10,
    ampZ: 2 + Math.random() * 3,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    phaseZ: Math.random() * Math.PI * 2,
  });
  
  // Localized state for responsive styling changes (blur, chromatic aberration, and neon proximity glow)
  // Initial style applied once via React
  const initialStyle = {
    transform: 'translate3d(0px, 0px, 0px) rotate(0deg)',
    backdropFilter: 'blur(10px)',
    filter: 'none',
    boxShadow: 'none',
  };

  // Track dragging start coordinates
  const handleMouseDown = useCallback((e) => {
    if (!elementRef.current) return;
    
    // Prevent default browser dragging mechanisms
    e.preventDefault();
    isDragging.current = true;
    
    playTap(); // play synthesizer gesture sound on click
    
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
    lastMouseTime.current = performance.now();
    dragVx.current = 0;
    dragVy.current = 0;
    
    // Stop residual velocity on grab
    vx.current = 0;
    vy.current = 0;
    
    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastMouseTime.current);
      
      const dx = moveEvent.clientX - lastMouseX.current;
      const dy = moveEvent.clientY - lastMouseY.current;
      
      // Update coordinates immediately
      x.current += dx;
      y.current += dy;
      
      // Calculate drag velocity components
      const rawVx = (dx / dt) * 16.67;
      const rawVy = (dy / dt) * 16.67;
      dragVx.current += (rawVx - dragVx.current) * 0.4;
      dragVy.current += (rawVy - dragVy.current) * 0.4;
      
      lastMouseX.current = moveEvent.clientX;
      lastMouseY.current = moveEvent.clientY;
      lastMouseTime.current = now;
    };
    
    const onMouseUp = () => {
      isDragging.current = false;
      
      // Launch card with mouse drag velocity (fling physics)
      vx.current = dragVx.current;
      vy.current = dragVy.current;
      
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    initGlobalMouse();
    const el = elementRef.current;
    if (!el) return;
    
    // Start tracking tab focus state for tab pauses
    const handleVisibility = () => {
      isTabActive.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Register visibility observer for sleep state offscreen
    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(el);
    
    // Unified requestAnimationFrame loop variables
    let animationFrameId;
    let lerpedScroll = window.scrollY;
    let homeX = 0;
    let homeY = 0;
    
    const tick = () => {
      if (!el) return;
      
      // Sleep state check: pause if browser tab is hidden or element is completely off-screen
      if (!isTabActive.current || !isIntersecting.current) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      
      const now = performance.now();
      const time = now * 0.001 + delay;
      
      // 1. Inertial scroll lerp tracking
      lerpedScroll += (window.scrollY - lerpedScroll) * 0.07;
      
      // Calculate depth parallax Y offset
      // zFactor controls displacement relative to the scroll vector
      // 1.3 foreground moves 30% faster, 1.0 midground locks, 0.5 background lags half
      const parallaxY = -lerpedScroll * (zFactor - 1.0);
      
      // 2. Physics logic (only when not dragging)
      if (!isDragging.current) {
        // Kinetic mouse repulsion force vector
        const mouse = window.quantumMouse;
        const rect = el.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        const dx = cardCenterX - mouse.x;
        const dy = cardCenterY - mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelThreshold = 220; // range of interaction
        
        if (dist < repelThreshold && dist > 8) {
          const forceFactor = (1 - dist / repelThreshold) * 1.6;
          // Project mouse velocity to add kinetic fling pop
          const dot = mouse.vx * (dx / dist) + mouse.vy * (dy / dist);
          const pushForce = (forceFactor * 0.95 + Math.max(0, dot) * 0.2) * 1.5;
          
          vx.current += (dx / dist) * pushForce;
          vy.current += (dy / dist) * pushForce;
        }
        
        // Spring attraction vector back to home coordinates (0, 0 offset)
        const stiffness = 0.0035;
        const friction = 0.95; // momentum decay coefficient
        
        const springX = (homeX - x.current) * stiffness;
        const springY = (homeY - y.current) * stiffness;
        
        vx.current += springX;
        vy.current += springY;
        
        vx.current *= friction;
        vy.current *= friction;
        
        x.current += vx.current;
        y.current += vy.current;
        
        // 3. Draggable card boundaries soft bouncing physics
        const w = window.innerWidth;
        const h = window.innerHeight;
        const bounceDamping = -0.65;
        
        if (rect.left < 10) {
          vx.current = Math.abs(vx.current) * bounceDamping * -1.0;
          x.current += 10 - rect.left;
          playHover(); // play subtle contact bounce chime
        } else if (rect.right > w - 10) {
          vx.current = -Math.abs(vx.current) * bounceDamping * 1.0;
          x.current -= rect.right - (w - 10);
          playHover();
        }
        
        if (rect.top < 10) {
          vy.current = Math.abs(vy.current) * bounceDamping * -1.0;
          y.current += 10 - rect.top;
          playHover();
        } else if (rect.bottom > h - 10) {
          vy.current = -Math.abs(vy.current) * bounceDamping * 1.0;
          y.current -= rect.bottom - (h - 10);
          playHover();
        }
      }
      
      // 4. Advanced Quantum Floating Algorithm (multi-layered Sin/Cos waves)
      const p = waveParams.current;
      const floatX = Math.sin(time * p.freqX + p.phaseX) * p.ampX + Math.cos(time * p.freqX * 1.8) * (p.ampX * 0.35);
      const floatY = Math.cos(time * p.freqY + p.phaseY) * p.ampY + Math.sin(time * p.freqY * 1.6) * (p.ampY * 0.3);
      const floatAngle = Math.sin(time * p.freqZ + p.phaseZ) * p.ampZ;
      
      // Sum physical offsets, scroll parallax, and floating wave layers
      const finalX = x.current + floatX;
      const finalY = y.current + floatY + parallaxY;
      
      // 5. Proximity Glow calculation via global registry
      const currentRect = el.getBoundingClientRect();
      const cardCenterX = currentRect.left + currentRect.width / 2;
      const cardCenterY = currentRect.top + currentRect.height / 2;
      
      const cardInfo = {
        id: idRef.current,
        x: cardCenterX,
        y: cardCenterY,
      };
      
      const regIndex = window.quantumCards.findIndex(c => c.id === idRef.current);
      if (regIndex > -1) {
        window.quantumCards[regIndex] = cardInfo;
      } else {
        window.quantumCards.push(cardInfo);
      }
      
      let proximityGlow = 0;
      window.quantumCards.forEach(other => {
        if (other.id === idRef.current) return;
        const dx = other.x - cardCenterX;
        const dy = other.y - cardCenterY;
        const distance = Math.hypot(dx, dy);
        const glowThreshold = 260; // range of proximity glow
        if (distance < glowThreshold) {
          proximityGlow += (1 - distance / glowThreshold) * 12;
        }
      });
      
      // Generate box shadows dynamically
      const glowOpacity = Math.min(0.4, 0.05 + proximityGlow * 0.025);
      const dynamicGlow = proximityGlow > 0 
        ? `0 0 ${12 + proximityGlow}px rgba(6, 255, 212, ${glowOpacity})` 
        : '0 8px 32px rgba(0, 0, 0, 0.4)';
        
      // Write optimized style matrix
      // Mutate DOM style directly to bypass React render cycle for 60fps performance
      if (el) {
        el.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0px) rotateZ(${floatAngle.toFixed(2)}deg) scale3d(${isDragging.current ? 1.05 : 1.0}, ${isDragging.current ? 1.05 : 1.0}, 1.0)`;
        el.style.boxShadow = dynamicGlow;
        el.style.cursor = isDragging.current ? 'grabbing' : 'grab';
        el.style.userSelect = 'none';
      }
      
      animationFrameId = requestAnimationFrame(tick);
    };
    
    animationFrameId = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
      
      // Clean registry
      window.quantumCards = window.quantumCards.filter(c => c.id !== idRef.current);
    };
  }, [delay, zFactor]);
  
  return {
    ref: elementRef,
    style: initialStyle,
    onMouseDown: handleMouseDown,
  };
}
