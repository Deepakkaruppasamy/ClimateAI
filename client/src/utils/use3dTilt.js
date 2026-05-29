import { useState, useRef, useCallback } from 'react';

/**
 * Custom React Hook to apply a premium 3D parallax tilt effect based on mouse movement.
 * Returns a ref to attach to the element and the computed style object.
 * 
 * @param {number} maxRotation Maximum rotation in degrees.
 * @param {number} perspective Perspective value in pixels.
 */
export default function use3dTilt(maxRotation = 7, perspective = 800) {
  const [style, setStyle] = useState({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  });
  
  const elementRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // Mouse X relative to card
    const y = e.clientY - rect.top;  // Mouse Y relative to card

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-maxRotation to maxRotation)
    const rotateY = ((x - centerX) / centerX) * maxRotation;
    const rotateX = ((centerY - y) / centerY) * maxRotation;

    setStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.08s ease-out', // Extremely snappy responsiveness during drag
    });
  }, [maxRotation, perspective]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth return to normal
    });
  }, [perspective]);

  // Combine event listeners
  const tiltProps = {
    ref: elementRef,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style,
  };

  return tiltProps;
}
