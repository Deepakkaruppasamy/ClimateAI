import { useEffect, useRef, useState, useCallback } from 'react';
import { playHover, playTap } from './audio';

if (typeof window !== 'undefined') {
  window.quantumCards = window.quantumCards || [];
  window.quantumMouse = window.quantumMouse || { x: 0, y: 0, vx: 0, vy: 0, lastTime: 0 };
}

let mouseListenerAdded = false;
function initGlobalMouse() {
  if (mouseListenerAdded || typeof window === 'undefined') return;
  mouseListenerAdded = true;

  const handleMouseMove = (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - window.quantumMouse.lastTime);
    

    const dx = e.clientX - window.quantumMouse.x;
    const dy = e.clientY - window.quantumMouse.y;
    

    const rawVx = (dx / dt) * 16.67; 
    const rawVy = (dy / dt) * 16.67;
    
    window.quantumMouse.vx += (rawVx - window.quantumMouse.vx) * 0.3;
    window.quantumMouse.vy += (rawVy - window.quantumMouse.vy) * 0.3;
    
    window.quantumMouse.x = e.clientX;
    window.quantumMouse.y = e.clientY;
    window.quantumMouse.lastTime = now;
  };
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
}

export default function useQuantumFloat(delay = 0, zFactor = 1.0) {
  const elementRef = useRef(null);
  

  const idRef = useRef(`qc-${Math.random().toString(36).substr(2, 9)}`);
  

  const x = useRef(0);
  const y = useRef(0);
  

  const vx = useRef(0);
  const vy = useRef(0);
  

  const isTabActive = useRef(true);
  const isIntersecting = useRef(true);
  

  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const lastMouseTime = useRef(0);
  const dragVx = useRef(0);
  const dragVy = useRef(0);
  

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
  

  const initialStyle = {
    transform: 'translate3d(0px, 0px, 0px) rotate(0deg)',
    backdropFilter: 'blur(10px)',
    filter: 'none',
    boxShadow: 'none',
  };

  const handleMouseDown = useCallback((e) => {
    if (!elementRef.current) return;
    

    e.preventDefault();
    isDragging.current = true;
    
    playTap(); 
    
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
    lastMouseTime.current = performance.now();
    dragVx.current = 0;
    dragVy.current = 0;
    

    vx.current = 0;
    vy.current = 0;
    
    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastMouseTime.current);
      
      const dx = moveEvent.clientX - lastMouseX.current;
      const dy = moveEvent.clientY - lastMouseY.current;
      

      x.current += dx;
      y.current += dy;
      

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
    

    const handleVisibility = () => {
      isTabActive.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(el);
    

    const rectRef = { pageLeft: 0, pageTop: 0, width: 0, height: 0 };
    const measure = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      rectRef.pageLeft = r.left + window.scrollX - x.current;
      rectRef.pageTop = r.top + window.scrollY - y.current;
      rectRef.width = r.width;
      rectRef.height = r.height;
    };

    measure();

    const handleResize = () => {
      measure();
    };
    window.addEventListener('resize', handleResize, { passive: true });
    

    let animationFrameId;
    let lerpedScroll = window.scrollY;
    let homeX = 0;
    let homeY = 0;
    let frameCount = 0;
    
    const tick = () => {
      if (!el) return;
      

      if (!isTabActive.current || !isIntersecting.current) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      

      frameCount++;
      if (frameCount % 60 === 0) {
        measure();
      }
      
      const now = performance.now();
      const time = now * 0.001 + delay;
      

      lerpedScroll += (window.scrollY - lerpedScroll) * 0.07;
      

      const parallaxY = -lerpedScroll * (zFactor - 1.0);
      

      const rect = {
        left: rectRef.pageLeft - window.scrollX + x.current,
        top: rectRef.pageTop - window.scrollY + y.current,
        width: rectRef.width,
        height: rectRef.height
      };
      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;
      

      if (!isDragging.current) {

        const mouse = window.quantumMouse;
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        const dx = cardCenterX - mouse.x;
        const dy = cardCenterY - mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelThreshold = 220; 
        
        if (dist < repelThreshold && dist > 8) {
          const forceFactor = (1 - dist / repelThreshold) * 1.6;

          const dot = mouse.vx * (dx / dist) + mouse.vy * (dy / dist);
          const pushForce = (forceFactor * 0.95 + Math.max(0, dot) * 0.2) * 1.5;
          
          vx.current += (dx / dist) * pushForce;
          vy.current += (dy / dist) * pushForce;
        }
        

        const stiffness = 0.0035;
        const friction = 0.95; 
        
        const springX = (homeX - x.current) * stiffness;
        const springY = (homeY - y.current) * stiffness;
        
        vx.current += springX;
        vy.current += springY;
        
        vx.current *= friction;
        vy.current *= friction;
        
        x.current += vx.current;
        y.current += vy.current;
        

        rect.left = rectRef.pageLeft - window.scrollX + x.current;
        rect.top = rectRef.pageTop - window.scrollY + y.current;
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        

        const w = window.innerWidth;
        const h = window.innerHeight;
        const bounceDamping = -0.65;
        
        if (rect.left < 10) {
          vx.current = Math.abs(vx.current) * bounceDamping * -1.0;
          x.current += 10 - rect.left;
          playHover(); 
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
      

      const p = waveParams.current;
      const floatX = Math.sin(time * p.freqX + p.phaseX) * p.ampX + Math.cos(time * p.freqX * 1.8) * (p.ampX * 0.35);
      const floatY = Math.cos(time * p.freqY + p.phaseY) * p.ampY + Math.sin(time * p.freqY * 1.6) * (p.ampY * 0.3);
      const floatAngle = Math.sin(time * p.freqZ + p.phaseZ) * p.ampZ;
      

      const finalX = x.current + floatX;
      const finalY = y.current + floatY + parallaxY;
      

      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
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
        const glowThreshold = 260; 
        if (distance < glowThreshold) {
          proximityGlow += (1 - distance / glowThreshold) * 12;
        }
      });
      

      const glowOpacity = Math.min(0.4, 0.05 + proximityGlow * 0.025);
      const dynamicGlow = proximityGlow > 0 
        ? `0 0 ${12 + proximityGlow}px rgba(6, 255, 212, ${glowOpacity})` 
        : '0 8px 32px rgba(0, 0, 0, 0.4)';
        

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
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      

      window.quantumCards = window.quantumCards.filter(c => c.id !== idRef.current);
    };
  }, [delay, zFactor]);
  
  return {
    ref: elementRef,
    style: initialStyle,
    onMouseDown: handleMouseDown,
  };
}
