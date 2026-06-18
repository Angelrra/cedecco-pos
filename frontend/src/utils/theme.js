/**
 * AuraStock Theme Interpolation Utility - Negro Rojizo Premium Edition
 * Encapsulates the dark (burgundy-black space) and light (rose-slate premium) palettes
 * and provides continuous interpolation (LERP) between them.
 */

// Colors represented as RGBA objects for precise interpolation
const darkTheme = {
  '--bg-main': { r: 10, g: 3, b: 8, a: 1 }, // Negro rojizo profundo y elegante
  '--bg-card': { r: 26, g: 10, b: 20, a: 0.65 }, // Tarjeta traslúcida con tinte vino
  '--bg-card-hover': { r: 35, g: 12, b: 26, a: 0.85 },
  '--bg-glass-input': { r: 255, g: 255, b: 255, a: 0.05 },
  
  '--border-light': { r: 255, g: 255, b: 255, a: 0.08 },
  '--border-focus': { r: 225, g: 29, b: 72, a: 0.6 }, // Rosa/Rojo de enfoque
  '--border-success': { r: 16, g: 185, b: 129, a: 0.4 },
  '--border-warning': { r: 245, g: 158, b: 11, a: 0.4 },
  '--border-danger': { r: 239, g: 68, b: 68, a: 0.4 },

  '--color-primary': { r: 225, g: 29, b: 72, a: 1 }, // Rosa/Rojo primario
  '--color-primary-light': { r: 244, g: 63, b: 94, a: 1 },
  '--color-secondary': { r: 6, g: 182, b: 212, a: 1 },
  '--color-accent': { r: 168, g: 85, b: 247, a: 1 },
  
  '--color-text-main': { r: 243, g: 244, b: 246, a: 1 },
  '--color-text-muted': { r: 156, g: 163, b: 175, a: 1 },
  
  '--sidebar-bg': { r: 18, g: 5, b: 12, a: 0.92 }, // Negro rojizo para la barra lateral
  '--table-th-bg': { r: 30, g: 10, b: 22, a: 0.8 },
  
  '--radial-color-1': { r: 225, g: 29, b: 72, a: 0.08 }, // Luz radial rojiza
  '--radial-color-2': { r: 168, g: 85, b: 247, a: 0.06 },
  
  '--shadow-neon-color': { r: 225, g: 29, b: 72, a: 0.15 }, // Sombra neón rojiza
  '--shadow-neon-success-color': { r: 16, g: 185, b: 129, a: 0.15 },
  '--shadow-neon-danger-color': { r: 239, g: 68, b: 68, a: 0.15 },
  
  '--switch-bg': { r: 35, g: 10, b: 22, a: 0.85 } // Negro rojizo para la botonera del switch
};

const lightTheme = {
  '--bg-main': { r: 250, g: 245, b: 246, a: 1 }, // Blanco ligeramente rojizo/rosado
  '--bg-card': { r: 255, g: 255, b: 255, a: 0.8 },
  '--bg-card-hover': { r: 255, g: 255, b: 255, a: 0.95 },
  '--bg-glass-input': { r: 15, g: 23, b: 42, a: 0.04 },
  
  '--border-light': { r: 225, g: 29, b: 72, a: 0.08 }, // Borde suave con tinte rosa
  '--border-focus': { r: 225, g: 29, b: 72, a: 0.6 },
  '--border-success': { r: 5, g: 150, b: 105, a: 0.4 },
  '--border-warning': { r: 217, g: 119, b: 6, a: 0.4 },
  '--border-danger': { r: 220, g: 38, b: 38, a: 0.4 },

  '--color-primary': { r: 225, g: 29, b: 72, a: 1 },
  '--color-primary-light': { r: 244, g: 63, b: 94, a: 1 },
  '--color-secondary': { r: 8, g: 145, b: 178, a: 1 },
  '--color-accent': { r: 147, g: 51, b: 234, a: 1 },
  
  '--color-text-main': { r: 30, g: 20, b: 22, a: 1 }, // Texto oscuro con toque rojo
  '--color-text-muted': { r: 100, g: 80, b: 85, a: 1 },
  
  '--sidebar-bg': { r: 18, g: 5, b: 12, a: 0.98 },
  '--table-th-bg': { r: 238, g: 226, b: 230, a: 0.9 },
  
  '--radial-color-1': { r: 244, g: 63, b: 94, a: 0.03 },
  '--radial-color-2': { r: 168, g: 85, b: 247, a: 0.02 },
  
  '--shadow-neon-color': { r: 225, g: 29, b: 72, a: 0.05 },
  '--shadow-neon-success-color': { r: 16, g: 185, b: 129, a: 0.05 },
  '--shadow-neon-danger-color': { r: 239, g: 68, b: 68, a: 0.05 },
  
  '--switch-bg': { r: 35, g: 10, b: 22, a: 0.95 }
};

/**
 * Linear interpolation helper between two values
 */
const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

/**
 * Interpolates two RGBA colors and returns a CSS-compatible string
 */
const interpolateColor = (c1, c2, factor) => {
  const r = Math.round(lerp(c1.r, c2.r, factor));
  const g = Math.round(lerp(c1.g, c2.g, factor));
  const b = Math.round(lerp(c1.b, c2.b, factor));
  const a = lerp(c1.a, c2.a, factor).toFixed(3);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * Applies the interpolated theme to the document based on a brightness percentage (0 to 100)
 * @param {number} brightness - A number between 0 (Dark) and 100 (Light)
 */
export const applyTheme = (brightness) => {
  const factor = Math.min(Math.max(brightness, 0), 100) / 100;
  
  // Set each color variable dynamically
  Object.keys(darkTheme).forEach((variable) => {
    const c1 = darkTheme[variable];
    const c2 = lightTheme[variable];
    const interpolated = interpolateColor(c1, c2, factor);
    document.documentElement.style.setProperty(variable, interpolated);
  });
};
