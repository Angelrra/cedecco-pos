/**
 * Obtiene o genera una dirección MAC virtual única para identificar al cliente.
 * Se guarda de forma persistente en localStorage para que el mismo navegador
 * conserve siempre el mismo identificador.
 */
export const getOrGenerateDeviceMac = () => {
  let deviceMac = localStorage.getItem('aura-device-mac');
  
  if (!deviceMac) {
    const parts = ['00', 'e0']; // Usamos el prefijo 00:e0 estándar de red
    for (let i = 0; i < 4; i++) {
      parts.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
    }
    deviceMac = parts.join(':').toLowerCase();
    localStorage.setItem('aura-device-mac', deviceMac);
  }
  
  return deviceMac;
};
