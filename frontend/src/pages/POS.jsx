import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, 
  DollarSign, CheckCircle, Printer, X, AlertCircle, Lock, Edit2, Camera, Zap, RefreshCw
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const POS = () => {
  const { apiFetch, activeSession, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [changeGiven, setChangeGiven] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para Clientes y Notas de venta
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleNote, setSaleNote] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Listas de precios
  const [priceLists, setPriceLists] = useState([]);
  const [selectedListIndex, setSelectedListIndex] = useState(() => {
    return parseInt(localStorage.getItem('pos-selected-price-list') || '1');
  });

  // Estados de Categorías de Producto
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estados de checkout y recibo
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [ticketName, setTicketName] = useState(localStorage.getItem('ticketName') || 'CEDECCO INSUMOS INFORMÁTICOS');
  const [ticketAddress, setTicketAddress] = useState(localStorage.getItem('ticketAddress') || 'Av. del Puerto 1234, CABA');
  const [ticketPhone, setTicketPhone] = useState(localStorage.getItem('ticketPhone') || 'Tel: 4567-8910');
  const [isEditingTicketHeader, setIsEditingTicketHeader] = useState(false);

  // Estados de Mercado Pago QR
  const [showMPModal, setShowMPModal] = useState(false);
  const [mpReference, setMpReference] = useState('');
  const [mpQRData, setMpQRData] = useState('');
  const [mpMode, setMpMode] = useState('simulation'); // 'simulation' o 'real'
  const [mpStatus, setMpStatus] = useState('pending'); // 'pending' o 'approved'
  const [pollingActive, setPollingActive] = useState(false);

  const searchInputRef = useRef(null);

  // Estados y Refs para el Escáner por Cámara
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'reader-container';
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' o 'user'
  const [isCameraTransitioning, setIsCameraTransitioning] = useState(false);

  const toggleCameraFacing = async () => {
    if (isCameraTransitioning) return;
    setIsCameraTransitioning(true);
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (html5QrCodeRef.current) {
      await stopScanner(true);
      setTimeout(async () => {
        await startScanner(nextFacing);
        setIsCameraTransitioning(false);
      }, 300);
    } else {
      setIsCameraTransitioning(false);
    }
  };

  // Controles dinámicos de hardware y guía visual inteligente
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.8);
  const [guideState, setGuideState] = useState('buscando'); // 'buscando' (amarillo), 'alejar' (rojo)

  // Sonido de pitido (beep) nativo usando Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Tono de 800Hz
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volumen del beep
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error('Error al reproducir el beep:', err);
    }
  };

  // Buscar y agregar directamente el código escaneado al carrito
  const handleScannedCode = async (code) => {
    if (!code) return;
    try {
      const res = await apiFetch(`/products/code/${code}`);
      if (res.ok) {
        const product = await res.json();
        addToCart(product, quickQty);
        setQuickQty(1);
        setSearchQuery('');
      } else {
        setSearchQuery(code);
        const isAdmin = user && (user.role === 'admin' || user.role === 'vendedor');
        if (isAdmin) {
          const confirmAdd = window.confirm(`El código "${code}" no existe en el sistema. ¿Deseas registrar un nuevo producto con este código?`);
          if (confirmAdd) {
            navigate('/inventario', { state: { scannedCode: code } });
          } else {
            setErrorMsg(`No se encontró ningún producto con el código: ${code}`);
          }
        } else {
          setErrorMsg(`No se encontró ningún producto con el código: ${code}.`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al buscar el producto escaneado.');
    }
  };

  // Iniciar la cámara trasera del celular para escanear
  const startScanner = async (overrideFacing) => {
    setIsScanning(true);
    setScannerError('');
    setErrorMsg('');
    const activeFacing = overrideFacing || facingMode;
    
    // Función auxiliar para esperar de forma dinámica a que el elemento DOM esté montado
    const waitForElement = (id, callback, maxAttempts = 15) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(interval);
          callback();
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error(`Contenedor DOM ${id} no encontrado tras varios intentos.`);
            setScannerError('Error: No se pudo encontrar el contenedor de video en la pantalla.');
            setIsScanning(false);
          }
        }
      }, 50);
    };

    waitForElement(scannerContainerId, async () => {
      // Función auxiliar para demorar ejecuciones (esencial para liberar hardware de cámara entre intentos)
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Limpiar contenedor físico antes de instanciar para evitar duplicados en el DOM
      const clearContainer = () => {
        const container = document.getElementById(scannerContainerId);
        if (container) container.innerHTML = '';
      };

      try {
        const config = {
          fps: 15, // Optimizado a 15 FPS para reducir carga de CPU en dispositivos móviles y evitar lag
          // qrbox optimizado para restringir el escaneo exactamente a la zona del recuadro visual del frontend (75% ancho x 50% alto)
          qrbox: (width, height) => ({
            width: Math.round(width * 0.75),
            height: Math.round(height * 0.5)
          }),
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.RSS_14,
            Html5QrcodeSupportedFormats.RSS_EXPANDED,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Aprovechar decodificador de hardware nativo súper veloz
          }
        };

        const onSuccess = (decodedText) => {
          playBeep();
          stopScanner();
          handleScannedCode(decodedText.trim());
        };

        const onFailure = (errorMessage) => {
          // Silencioso
        };
        
        // Función de inicialización con fallbacks progresivos re-instanciando el escáner
        // Esto evita el error de "Cannot transition to a new state, already under transition"
        const selectCameraDevice = (devicesList, facing) => {
          if (!devicesList || devicesList.length === 0) return null;
          const labelOf = (d) => (d.label || '').toLowerCase();
          
          if (facing === 'user') {
            const frontKeywords = ['front', 'frontal', 'user', 'delantera', 'cámara 2', 'camera 2', 'face', 'selfie'];
            const foundFront = devicesList.find(d => frontKeywords.some(kw => labelOf(d).includes(kw)));
            if (foundFront) return foundFront;
            return devicesList[0];
          } else {
            const backKeywords = ['back', 'rear', 'trasera', 'environment', 'secundaria', 'dir 1', 'cámara 1', 'camera 1', 'principal', 'main'];
            const foundBack = devicesList.find(d => backKeywords.some(kw => labelOf(d).includes(kw)));
            if (foundBack) return foundBack;
            if (devicesList.length > 1) {
              return devicesList[devicesList.length - 1];
            }
            return devicesList[0];
          }
        };

        const cleanupRef = () => {
          if (html5QrCodeRef.current) {
            try { html5QrCodeRef.current.clear(); } catch(e){}
            html5QrCodeRef.current = null;
          }
          clearContainer();
        };

        const tryStartCamera = async () => {
          // Nivel 1: Usar facingMode nativo simple (El más compatible y confiable, sin OverconstrainedError)
          try {
            clearContainer();
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;
            console.log(`Intentando iniciar cámara por facingMode nativo simple (${activeFacing}) Nivel 1...`);
            await html5QrCode.start(
              { facingMode: activeFacing },
              config,
              onSuccess,
              onFailure
            );
            return; // Éxito
          } catch (errFacing1) {
            console.warn('Fallo facingMode Nivel 1 (Simple). Limpiando...', errFacing1);
            cleanupRef();
          }

          await delay(200);

          // Nivel 2: Usar facingMode nativo HD
          try {
            clearContainer();
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;
            console.log(`Intentando iniciar cámara por facingMode nativo HD (${activeFacing}) Nivel 2...`);
            await html5QrCode.start(
              { 
                facingMode: activeFacing,
                width: { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 }
              },
              config,
              onSuccess,
              onFailure
            );
            return; // Éxito
          } catch (errFacing2) {
            console.warn('Fallo facingMode Nivel 2 (HD). Limpiando...', errFacing2);
            cleanupRef();
          }

          await delay(200);

          // Fallbacks por lista de dispositivos (deviceId)
          let devices = [];
          try {
            devices = await Html5Qrcode.getCameras();
            console.log('Dispositivos detectados:', devices);
          } catch (e) {
            console.warn('Error al obtener cámaras:', e);
          }

          const selectedCamera = selectCameraDevice(devices, activeFacing);

          if (selectedCamera) {
            console.log(`Cámara elegida por ID para (${activeFacing}):`, selectedCamera);
            
            // Nivel 3: Usar deviceId exacto estándar
            try {
              clearContainer();
              const html5QrCode = new Html5Qrcode(scannerContainerId);
              html5QrCodeRef.current = html5QrCode;
              console.log(`Intentando iniciar cámara por deviceId (${selectedCamera.id}) Nivel 3...`);
              await html5QrCode.start(
                { deviceId: { exact: selectedCamera.id } },
                config,
                onSuccess,
                onFailure
              );
              return; // Éxito
            } catch (err1) {
              console.warn('Fallo deviceId Nivel 3. Limpiando...', err1);
              cleanupRef();
            }

            await delay(200);

            // Nivel 4: Usar deviceId exacto HD
            try {
              clearContainer();
              const html5QrCode = new Html5Qrcode(scannerContainerId);
              html5QrCodeRef.current = html5QrCode;
              console.log(`Intentando iniciar cámara por deviceId (${selectedCamera.id}) Nivel 4 (HD)...`);
              await html5QrCode.start(
                { 
                  deviceId: { exact: selectedCamera.id },
                  width: { min: 640, ideal: 1280 },
                  height: { min: 480, ideal: 720 }
                },
                config,
                onSuccess,
                onFailure
              );
              return; // Éxito
            } catch (err2) {
              console.warn('Fallo deviceId Nivel 4 (HD). Limpiando...', err2);
              cleanupRef();
            }

            await delay(200);

            // Nivel 5: Usar string deviceId directamente (Universal)
            try {
              clearContainer();
              const html5QrCode = new Html5Qrcode(scannerContainerId);
              html5QrCodeRef.current = html5QrCode;
              console.log(`Intentando iniciar cámara por deviceId string (${selectedCamera.id}) Nivel 5...`);
              await html5QrCode.start(
                selectedCamera.id,
                config,
                onSuccess,
                onFailure
              );
              return; // Éxito
            } catch (err3) {
              console.warn('Fallo deviceId string Nivel 5. Limpiando...', err3);
              cleanupRef();
            }

            await delay(200);
          }

          // Nivel 6: Cualquier cámara disponible
          clearContainer();
          const html5QrCode = new Html5Qrcode(scannerContainerId);
          html5QrCodeRef.current = html5QrCode;
          console.log('Intentando iniciar cualquier cámara disponible Nivel 6...');
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onSuccess,
            onFailure
          );
        };

        // Arrancar la cámara usando el flujo adaptativo robusto
        await tryStartCamera();

        // Forzar auto-ajuste de enfoque continuo y zoom ideal vía WebRTC (si lo soporta el dispositivo)
        try {
          const videoElement = document.querySelector(`#${scannerContainerId} video`);
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject;
            const tracks = stream.getVideoTracks();
            if (tracks && tracks.length > 0) {
              const track = tracks[0];
              const capabilities = track.getCapabilities ? track.getCapabilities() : {};
              const trackConstraints = {};
              
              if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                trackConstraints.focusMode = 'continuous';
              }
              
              // Aplicar zoom moderado por defecto (si lo soporta) para evitar desenfoque por cercanía de lente.
              // Esto permite alejar el producto y que el código se vea nítido y grande.
              if (capabilities.zoom) {
                const idealZoom = Math.min(Math.max(capabilities.zoom.min || 1, 1.8), capabilities.zoom.max || 1);
                trackConstraints.zoom = idealZoom;
                console.log(`Aplicando zoom por hardware optimizado: ${idealZoom}x`);
              }
              
              if (Object.keys(trackConstraints).length > 0) {
                await track.applyConstraints({
                  advanced: [trackConstraints]
                });
                console.log('Enfoque continuo y zoom optimizados por hardware activados.');
              }
            }
          }
        } catch (focusErr) {
          console.warn('Foco continuo o zoom no soportado directamente en constraints del track:', focusErr);
        }

      } catch (err) {
        console.error('Error definitivo al encender la cámara:', err);
        setScannerError(`No se pudo acceder a la cámara. Detalles: ${err.message || err}`);
        // ¡IMPORTANTE!: No llamamos a setIsScanning(false) aquí.
        // De esta forma, el modal permanece abierto mostrando el error en pantalla en lugar de cerrarse en silencio.
      }
    });
  };

  // Detener el escaneo y apagar la cámara
  const stopScanner = async (keepModalOpen = false) => {
    setIsTorchOn(false);
    setCurrentZoom(1.8);
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error al detener la cámara:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    if (!keepModalOpen) {
      setIsScanning(false);
    }
  };

  // Alternar linterna/flash de la cámara
  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const nextTorchState = !isTorchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorchState }]
        });
        setIsTorchOn(nextTorchState);
        console.log('Linterna configurada a:', nextTorchState);
      }
    } catch (err) {
      console.warn('El dispositivo no soporta linterna (flash) en su cámara principal.', err);
    }
  };

  // Ciclo manual de zoom: 1.0x -> 1.8x -> 2.5x
  const cycleZoom = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        let nextZoom = 1.0;
        if (currentZoom === 1.0) nextZoom = 1.8;
        else if (currentZoom === 1.8) nextZoom = 2.5;
        else nextZoom = 1.0;
        
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ zoom: nextZoom }]
        });
        setCurrentZoom(nextZoom);
        console.log('Zoom configurado a:', nextZoom);
      }
    } catch (err) {
      console.warn('El dispositivo no soporta controles de zoom por hardware.', err);
    }
  };

  // Guía de escaneo estática para evitar que el usuario mueva constantemente el producto
  useEffect(() => {
    if (!isScanning) return;
    setGuideState('buscando');
  }, [isScanning]);

  // Apagar la cámara si el componente se desmonta inesperadamente
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch('/products/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error cargando categorías en POS:', err);
      }
    };
    fetchCategories();
  }, []);

  // Cargar listas de precios al montar
  useEffect(() => {
    const fetchPriceLists = async () => {
      try {
        const res = await apiFetch('/pricelists');
        if (res.ok) {
          const data = await res.json();
          setPriceLists(data);
        }
      } catch (err) {
        console.error('Error cargando listas de precios:', err);
      }
    };
    fetchPriceLists();
  }, []);

  // Cargar clientes al montar
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await apiFetch('/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error('Error cargando clientes en POS:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Calcular precio de un producto según la lista seleccionada
  const getProductPrice = (product, listIndex) => {
    const list = priceLists.find(l => l.index === listIndex);
    // Buscar precio personalizado para esta lista
    if (product.customPrices && product.customPrices.length > 0) {
      const custom = product.customPrices.find(cp => cp.listIndex === listIndex && cp.useCustom);
      if (custom) return custom.price;
    }
    // Calcular con markup global si hay costo
    if (list && product.purchasePrice > 0) {
      return Math.round(product.purchasePrice * (1 + list.markup / 100) * 100) / 100;
    }
    // Fallback al precio de venta original
    return product.salePrice;
  };

  // Cargar productos al iniciar y cuando cambia searchQuery o la categoría seleccionada
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchProducts();
    }, selectedCategory ? 50 : 300); // 50ms para categoría (instantáneo), 300ms para escritura

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  // Cargar configuraciones del ticket desde el servidor al montar
  useEffect(() => {
    const fetchTicketSettings = async () => {
      try {
        const res = await apiFetch('/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.ticketName) {
            setTicketName(data.ticketName);
            localStorage.setItem('ticketName', data.ticketName);
          }
          if (data.ticketAddress) {
            setTicketAddress(data.ticketAddress);
            localStorage.setItem('ticketAddress', data.ticketAddress);
          }
          if (data.ticketPhone) {
            setTicketPhone(data.ticketPhone);
            localStorage.setItem('ticketPhone', data.ticketPhone);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de cabecera de ticket:', err);
      }
    };
    fetchTicketSettings();
  }, []);

  const searchProducts = async () => {
    try {
      const res = await apiFetch(`/products?search=${searchQuery}&category=${selectedCategory}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error buscando productos:', err);
    }
  };

  const handleSearchKeyDown = (e) => {
    // '+' solo sube cantidad si la búsqueda está vacía; si hay texto, lo permite como separador
    if (e.key === '+' && searchQuery.trim() === '') {
      e.preventDefault();
      setQuickQty(prev => prev + 1);
    } else if (e.key === '-') {
      e.preventDefault();
      setQuickQty(prev => Math.max(1, prev - 1));
    } else if (e.key === 'ArrowDown') {
      if (products.length > 0 && showSuggestions) {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % products.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (products.length > 0 && showSuggestions) {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + products.length) % products.length);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Buscar producto por código de barras exacto (Emulación de lector)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Si hay una sugerencia seleccionada activamente por teclado, agregamos esa sugerencia
    if (showSuggestions && activeSuggestionIndex >= 0 && activeSuggestionIndex < products.length) {
      const selectedProduct = products[activeSuggestionIndex];
      const isOutOfStock = selectedProduct.stock <= 0;
      const isExpired = selectedProduct.expirationDate && new Date(selectedProduct.expirationDate) < new Date();

      if (!isOutOfStock && !isExpired) {
        addToCart(selectedProduct, quickQty);
        setQuickQty(1);
        setSearchQuery('');
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
      return;
    }

    const query = searchQuery.trim();
    try {
      const res = await apiFetch(`/products/code/${query}`);
      if (res.ok) {
        const product = await res.json();
        addToCart(product, quickQty);
        setSearchQuery(''); // Limpiar
        setQuickQty(1); // Restablecer
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      } else {
        const confirmAdd = window.confirm(`El código "${query}" no existe en el sistema. ¿Deseas registrar un nuevo producto con este código?`);
        if (confirmAdd) {
          navigate('/inventario', { state: { scannedCode: query } });
        } else {
          setErrorMsg(`No se encontró ningún producto con el código: ${query}`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al buscar el producto.');
    }
  };

  const addToCart = (product, qty = 1) => {
    setErrorMsg('');

    if (qty <= 0) return;

    // Validar stock disponible
    if (product.stock <= 0) {
      setErrorMsg(`¡El producto ${product.name} no tiene stock disponible!`);
      return;
    }

    // Alerta de producto vencido
    if (product.expirationDate && new Date(product.expirationDate) < new Date()) {
      setErrorMsg(`¡El producto ${product.name} está VENCIDO! No está permitido venderlo.`);
      return;
    }

    // Precio según la lista seleccionada
    const resolvedPrice = getProductPrice(product, selectedListIndex);

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        const newQty = existingItem.quantity + qty;
        if (newQty > product.stock) {
          setErrorMsg(`No puedes agregar más de ${product.stock} unidades de ${product.name} (stock disponible completo). Intentaste agregar ${newQty}.`);
          return prevCart;
        }
        return prevCart.map(item =>
          item._id === product._id ? { ...item, quantity: newQty } : item
        );
      } else {
        if (qty > product.stock) {
          setErrorMsg(`No puedes agregar más de ${product.stock} unidades de ${product.name} (stock disponible completo). Intentaste agregar ${qty}.`);
          return prevCart;
        }
        // Guardar el precio de lista al momento de agregar
        return [...prevCart, { ...product, salePrice: resolvedPrice, priceListIndex: selectedListIndex, quantity: qty }];
      }
    });
  };

  const updateQuantity = (productId, amount, availableStock) => {
    setErrorMsg('');
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === productId) {
          const newQty = item.quantity + amount;
          if (newQty > availableStock) {
            setErrorMsg(`Solo quedan ${availableStock} unidades disponibles de ${item.name}.`);
            return item;
          }
          if (newQty <= 0) return null; // Será eliminado al filtrar abajo
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  // Cálculos de totales
  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  };

  const getTotal = () => {
    const sub = getSubtotal();
    return Math.max(0, sub - parseFloat(discount || 0));
  };

  // Calcular el vuelto automáticamente
  useEffect(() => {
    const total = getTotal();
    const cash = parseFloat(cashReceived) || 0;
    if (cash >= total) {
      setChangeGiven(cash - total);
    } else {
      setChangeGiven(0);
    }
  }, [cashReceived, cart, discount]);

  // Polling de verificación de estado de pago en Mercado Pago
  useEffect(() => {
    let intervalId;
    if (pollingActive && mpReference) {
      intervalId = setInterval(async () => {
        try {
          const res = await apiFetch(`/mercadopago/status/${mpReference}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'approved') {
              setMpStatus('approved');
              setPollingActive(false);
              handleCompleteMPSale();
            }
          }
        } catch (err) {
          console.error('Error verificando estado de Mercado Pago:', err);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, mpReference]);

  const handleStartMPPayment = async () => {
    setLoading(true);
    setErrorMsg('');
    const total = getTotal();

    try {
      const res = await apiFetch('/mercadopago/create-qr', {
        method: 'POST',
        body: JSON.stringify({ total })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al generar cobro QR');
      }

      setMpReference(data.reference);
      setMpQRData(data.qrData);
      setMpMode(data.mode);
      setMpStatus('pending');
      setShowMPModal(true);
      setPollingActive(true);
    } catch (err) {
      setErrorMsg(err.message || 'Error al conectar con Mercado Pago.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMPSale = async () => {
    setLoading(true);
    const total = getTotal();
    const payload = {
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod: 'mercadopago',
      cashReceived: total,
      changeGiven: 0,
      customer: selectedCustomer ? selectedCustomer._id : null,
      note: saleNote,
      priceListIndex: selectedListIndex
    };

    try {
      const res = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar la venta de Mercado Pago');
      }

      // Venta exitosa
      setCompletedSale(data.sale);
      setShowReceipt(true);

      // Limpiar POS y modal
      setCart([]);
      setDiscount(0);
      setCashReceived('');
      setChangeGiven(0);
      setSelectedCustomer(null);
      setSaleNote('');
      setShowMPModal(false);
      setMpReference('');
      setMpQRData('');
      setMpStatus('pending');
      searchProducts(); // Refrescar lista stock
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar el pago de Mercado Pago.');
      setShowMPModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMPSuccess = async () => {
    try {
      const res = await apiFetch('/mercadopago/simulate-success', {
        method: 'POST',
        body: JSON.stringify({ reference: mpReference })
      });
      if (res.ok) {
        setMpStatus('approved');
        setPollingActive(false);
        handleCompleteMPSale();
      }
    } catch (err) {
      console.error('Error al simular éxito en pago:', err);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg('');

    if (paymentMethod === 'mercadopago') {
      handleStartMPPayment();
      return;
    }

    setLoading(true);

    const total = getTotal();
    const cash = parseFloat(cashReceived) || 0;

    // Validación de vuelto
    if (paymentMethod === 'efectivo' && cashReceived !== '' && cash < total) {
      setErrorMsg('El efectivo recibido es menor al total de la venta.');
      setLoading(false);
      return;
    }

    const payload = {
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? cash : total,
      changeGiven: paymentMethod === 'efectivo' ? (cash >= total ? cash - total : 0) : 0,
      customer: selectedCustomer ? selectedCustomer._id : null,
      note: saleNote,
      priceListIndex: selectedListIndex
    };

    try {
      const res = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar la venta');
      }

      // Venta exitosa
      setCompletedSale(data.sale);
      setShowReceipt(true);

      // Limpiar POS
      setCart([]);
      setDiscount(0);
      setCashReceived('');
      setChangeGiven(0);
      setSelectedCustomer(null);
      setSaleNote('');
      searchProducts(); // Refrescar lista stock
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  if (!activeSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-danger) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.15,
          zIndex: -1
        }}></div>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            padding: '16px',
            borderRadius: '50%',
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--border-danger)',
            marginBottom: '20px'
          }}>
            <Lock size={36} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Punto de Venta Inactivo</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '25px' }}>
            La caja registradora se encuentra **Cerrada**. Para poder registrar ventas e imprimir comprobantes térmicos, primero debes realizar la apertura con el fondo de caja asignado.
          </p>
          <Link to="/caja" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <span>Ir a Apertura de Caja</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-grid">

      {/* SECCIÓN IZQUIERDA: Buscador, Lista de Compra e Imagen Ilustrativa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

        {/* Buscador de Productos */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', zIndex: 10 }}>
          <form onSubmit={handleBarcodeSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>
                Código
              </label>

              {/* Selector de Cantidad para Venta Rápida */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid var(--border-light)'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Venta Rápida (Teclas + / -):
                </span>
                <button
                  type="button"
                  onClick={() => setQuickQty(prev => Math.max(1, prev - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '2px',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-secondary)', minWidth: '16px', textAlign: 'center' }}>
                  {quickQty}
                </span>
                <button
                  type="button"
                  onClick={() => setQuickQty(prev => prev + 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '2px',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              
              {/* Selector de Lista de Precios */}
              {priceLists.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    Lista de precios:
                  </span>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {priceLists.map(list => (
                      <button
                        key={list.index}
                        type="button"
                        onClick={() => {
                          setSelectedListIndex(list.index);
                          localStorage.setItem('pos-selected-price-list', String(list.index));
                        }}
                        title={`${list.name} (+${list.markup}%)`}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: `1.5px solid ${selectedListIndex === list.index ? list.color : 'var(--border-light)'}`,
                          background: selectedListIndex === list.index ? `${list.color}22` : 'transparent',
                          color: selectedListIndex === list.index ? list.color : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: selectedListIndex === list.index ? 700 : 500,
                          transition: 'all 0.18s',
                          whiteSpace: 'nowrap',
                          boxShadow: selectedListIndex === list.index ? `0 0 8px ${list.color}44` : 'none'
                        }}
                      >
                        L{list.index} · +{list.markup}%
                      </button>
                    ))}
                  </div>
                  {priceLists.find(l => l.index === selectedListIndex) && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      — {priceLists.find(l => l.index === selectedListIndex)?.name}
                    </span>
                  )}
                </div>
              )}

              {/* Contenedor del Input (100% de Ancho) */}
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Search size={18} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-input"
                  placeholder="Buscar: código, nombre o teclado+inal (multi-palabra con +)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchQuery) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowSuggestions(false);
                    }, 200);
                  }}
                  style={{ paddingLeft: '45px', width: '100%', fontSize: '0.95rem' }}
                  autoFocus
                />

                {/* LISTA DE SUGERENCIAS FLOTANTE (Ancha y legible) */}
                {searchQuery && products.length > 0 && showSuggestions && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 20, 25, 0.98)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.8)',
                    zIndex: 9999,
                    marginTop: '8px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}>
                    {products.map((prod, index) => {
                      const isOutOfStock = prod.stock <= 0;
                      const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;
                      const isExpired = prod.expirationDate && new Date(prod.expirationDate) < new Date();
                      const isSelected = index === activeSuggestionIndex;

                      return (
                        <div
                          key={prod._id}
                          onClick={() => {
                            if (!isOutOfStock && !isExpired) {
                              addToCart(prod, quickQty);
                              setQuickQty(1);
                              setSearchQuery('');
                              setShowSuggestions(false);
                              setActiveSuggestionIndex(-1);
                              if (searchInputRef.current) searchInputRef.current.focus();
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: isOutOfStock || isExpired ? 'not-allowed' : 'pointer',
                            background: isSelected
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'transparent',
                            transition: 'background 0.15s',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            opacity: isOutOfStock || isExpired ? 0.5 : 1
                          }}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, paddingRight: '10px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--color-primary-light)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>
                              {prod.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {prod.category} • {prod.code}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
                              ${prod.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            {isExpired ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Vencido</span>
                            ) : isOutOfStock ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Agotado</span>
                            ) : (
                              <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                                {prod.stock}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón de Escáner de Cámara (Abajo, 100% de Ancho, Cómodo en Celular) */}
              <button
                type="button"
                onClick={startScanner}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: 'var(--color-primary-light)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  width: '100%'
                }}
              >
                <Camera size={18} />
                <span style={{ fontSize: '0.95rem' }}>Escanear Código de Barras con Cámara</span>
              </button>
            </div>
          </form>
        </div>

        {/* Lista de lo que estoy vendiendo */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '20px', flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShoppingCart size={20} style={{ color: 'var(--color-primary-light)' }} />
              <span>Lista de Compra</span>
            </h3>
            <span className="badge badge-success">{cart.length} Artículos</span>
          </div>

          {errorMsg && (
            <div className="badge-danger" style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '15px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: '1.4'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lista de Items */}
          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '480px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <ShoppingCart size={40} style={{ opacity: 0.15, marginBottom: '10px' }} />
                <p style={{ fontSize: '0.85rem' }}>El carrito está vacío. Agrega productos o escanea código para facturar.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cart.map(item => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-light)',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        ${item.salePrice.toFixed(2)} c/u
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                      <button
                        onClick={() => updateQuantity(item._id, -1, item.stock)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1, item.stock)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '60px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                        ${(item.salePrice * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN DERECHA: Catálogo de Productos y Resumen/Totales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

        {/* Catálogo de Productos */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '260px', flexGrow: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '15px' }}>Productos Disponibles</h3>

          {/* Fila de Filtro de Categorías Deslizante */}
          {categories.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '15px',
              borderBottom: '1px solid var(--border-light)',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none' /* Ocultar en Firefox */
            }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                style={{
                  background: selectedCategory === '' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: selectedCategory === '' ? '1px solid var(--color-primary-light)' : '1px solid var(--border-light)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                Todos
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: selectedCategory === cat ? '1px solid var(--color-primary-light)' : '1px solid var(--border-light)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '10px',
            overflowY: 'auto',
            maxHeight: '260px',
            paddingRight: '6px'
          }}>
            {products.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No se encontraron productos en el inventario activo.
              </div>
            ) : (
              products.map(prod => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;
                const isExpired = prod.expirationDate && new Date(prod.expirationDate) < new Date();

                return (
                  <button
                    key={prod._id}
                    onClick={() => {
                      addToCart(prod, quickQty);
                      setQuickQty(1);
                    }}
                    className="glass-panel"
                    disabled={isOutOfStock || isExpired}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: isOutOfStock || isExpired ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.02)',
                      border: isExpired
                        ? '1px solid var(--border-danger)'
                        : isOutOfStock
                          ? '1px solid rgba(255,255,255,0.03)'
                          : isLowStock
                            ? '1px solid var(--border-warning)'
                            : '1px solid var(--border-light)',
                      textAlign: 'left',
                      cursor: isOutOfStock || isExpired ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isOutOfStock || isExpired ? 0.5 : 1,
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                      {prod.category}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '6px', lineBreak: 'anywhere', height: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {prod.name}
                    </span>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 'auto', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                        ${prod.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>

                      {isExpired ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Vencido</span>
                      ) : isOutOfStock ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Agotado</span>
                      ) : (
                        <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                          {prod.stock}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Resumen de Cobro y Totales */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '15px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', margin: 0 }}>
            Resumen de Cobro
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                ${getSubtotal().toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Descuento ($)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Método de Pago</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setCashReceived('');
                  }}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', background: 'var(--bg-main)' }}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mercadopago">Mercado Pago (QR)</option>
                </select>
              </div>
            </div>

            {/* Cliente y Nota de la Venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Cliente</label>
                <select
                  className="form-input"
                  value={selectedCustomer ? selectedCustomer._id : ''}
                  onChange={(e) => {
                    const custId = e.target.value;
                    const found = customers.find(c => c._id === custId);
                    setSelectedCustomer(found || null);
                    if (found && found.defaultPriceListIndex) {
                      setSelectedListIndex(found.defaultPriceListIndex);
                      localStorage.setItem('pos-selected-price-list', String(found.defaultPriceListIndex));
                    }
                  }}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', background: 'var(--bg-main)', width: '100%' }}
                >
                  <option value="">-- Consumidor Final --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.cuit ? `(CUIT: ${c.cuit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Nota de Venta</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Observaciones..."
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {paymentMethod === 'efectivo' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.7rem', color: 'var(--color-secondary)' }}>Recibido</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', borderColor: 'var(--color-secondary)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span className="input-label" style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>Vuelto</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '2px' }}>
                    ${changeGiven.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '5px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Total a Cobrar</span>
              <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                ${getTotal().toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '5px' }}
            >
              {loading ? 'Procesando Venta...' : 'Completar y Cobrar Venta'}
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DE BOLETA / TICKET DE VENTA SIMULADO */}
      {showReceipt && completedSale && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '380px', background: '#ffffff', color: '#1f2937', padding: '24px', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>

            {/* Cabecera del ticket térmico */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #9ca3af', paddingBottom: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '8px' }}>
                <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
              </div>

              {isEditingTicketHeader ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#4b5563' }}>Nombre del Negocio</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      style={{ padding: '6px', fontSize: '0.8rem', width: '100%', textAlign: 'center', color: '#000', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#4b5563' }}>Dirección</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ticketAddress}
                      onChange={(e) => setTicketAddress(e.target.value)}
                      style={{ padding: '6px', fontSize: '0.8rem', width: '100%', textAlign: 'center', color: '#000', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#4b5563' }}>Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                      style={{ padding: '6px', fontSize: '0.8rem', width: '100%', textAlign: 'center', color: '#000', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('ticketName', ticketName);
                        localStorage.setItem('ticketAddress', ticketAddress);
                        localStorage.setItem('ticketPhone', ticketPhone);
                        setIsEditingTicketHeader(false);
                      }}
                      style={{ flex: 1, padding: '6px', fontSize: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTicketName(localStorage.getItem('ticketName') || 'CEDECCO INSUMOS INFORMÁTICOS');
                        setTicketAddress(localStorage.getItem('ticketAddress') || 'Av. del Puerto 1234, CABA');
                        setTicketPhone(localStorage.getItem('ticketPhone') || 'Tel: 4567-8910');
                        setIsEditingTicketHeader(false);
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTicketHeader(true)}
                  style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Haga clic aquí para configurar el nombre, dirección y teléfono del negocio"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>{ticketName}</h3>
                    <Edit2 size={13} style={{ color: '#9ca3af' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>{ticketAddress}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0 0' }}>{ticketPhone}</p>
                </div>
              )}
            </div>

            {/* Metadatos de la venta */}
            <div style={{ fontSize: '0.75rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nro Venta:</span>
                <span style={{ fontWeight: 600 }}>#{completedSale._id.substring(completedSale._id.length - 8).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fecha:</span>
                <span>{new Date(completedSale.createdAt).toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vendedor:</span>
                <span>{completedSale.user?.name || 'Vendedor'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Método Pago:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{completedSale.paymentMethod}</span>
              </div>
              {completedSale.customer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #e5e7eb', paddingTop: '4px', marginTop: '4px' }}>
                  <span>Cliente:</span>
                  <span style={{ fontWeight: 600 }}>{completedSale.customer.name}</span>
                </div>
              )}
              {completedSale.note && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px dotted #e5e7eb', paddingTop: '4px', marginTop: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Nota:</span>
                  <span style={{ fontStyle: 'italic', color: '#4b5563' }}>{completedSale.note}</span>
                </div>
              )}
            </div>

            {/* Tabla de artículos */}
            <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '6px' }}>Cant. Prod</th>
                  <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale.items.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ fontWeight: 600 }}>{item.quantity}</span> x {item.name}
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280' }}>
                        ${item.salePrice.toFixed(2)} c/u
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 0', verticalAlign: 'top', fontWeight: 600 }}>
                      ${(item.salePrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${completedSale.subtotal.toFixed(2)}</span>
              </div>
              {completedSale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                  <span>Descuento:</span>
                  <span>-${completedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginTop: '5px', borderTop: '1px solid #e5e7eb', paddingTop: '5px' }}>
                <span>Total Cobrado:</span>
                <span>${completedSale.total.toFixed(2)}</span>
              </div>

              {completedSale.paymentMethod === 'efectivo' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>
                    <span>Efectivo Recibido:</span>
                    <span>${completedSale.cashReceived.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>Vuelto Entregado:</span>
                    <span>${completedSale.changeGiven.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pie del ticket */}
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontWeight: 500 }}>¡Gracias por elegir Cedecco!</p>
              <p style={{ margin: '2px 0 0 0' }}>Conserve este comprobante.</p>
            </div>

            {/* Controles del Modal */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={handleNewSale}
                className="btn btn-primary"
                style={{ flex: 1.5, padding: '10px' }}
              >
                Nueva Venta
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE MERCADO PAGO QR AUTOMÁTICO */}
      {showMPModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '380px', textAlign: 'center', padding: '28px', background: '#ffffff', color: '#1f2937', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00b1ea', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <img src="https://img.icons8.com/color/48/000000/mercado-pago.png" alt="MP Logo" style={{ width: '32px', height: '32px' }} onError={(e) => { e.target.style.display = 'none'; }} />
              Mercado Pago QR
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '8px' }}>Escanea el código QR desde la app de Mercado Pago o tu banco para abonar:</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00b1ea', marginBottom: '20px' }}>
              ${getTotal().toFixed(2)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mpQRData)}`}
                alt="Mercado Pago QR Code"
                style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '200px', height: '200px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280', marginBottom: '24px' }}>
              <span className="spinner" style={{
                width: '14px',
                height: '14px',
                border: '2px solid #e5e7eb',
                borderTopColor: '#00b1ea',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite'
              }}></span>
              <span>Esperando que el cliente realice el pago...</span>
            </div>

            {mpMode === 'simulation' && (
              <button
                onClick={handleSimulateMPSuccess}
                className="btn btn-success"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginBottom: '10px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Simular Pago Aprobado (Dev)
              </button>
            )}

            <button
              onClick={() => { setShowMPModal(false); setPollingActive(false); }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: '#4b4b4b', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar Cobro QR
            </button>
          </div>
        </div>
      )}

      {/* MODAL DEL ESCÁNER POR CÁMARA */}
      {isScanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Camera style={{ color: 'var(--color-secondary)' }} />
              <span>Escáner de Código</span>
            </h3>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
              Enfoca el código de barras dentro del recuadro. <strong>Si se ve borroso, aleja el producto a unos 15 cm</strong> para activar el auto-enfoque.
            </p>
            
            {scannerError ? (
              <div className="badge-danger" style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {scannerError}
              </div>
            ) : null}

            {/* Contenedor del Lector de html5-qrcode */}
            <div style={{
              position: 'relative',
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#000',
              border: '2px solid rgba(255,255,255,0.1)',
              aspectRatio: '4/3',
              marginBottom: '20px'
            }}>
              <div id={scannerContainerId} style={{ width: '100%', height: '100%' }}></div>
              
              {/* Recuadro de enfoque estático y optimizado con color verde de listo */}
              {!scannerError && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translateY(-50%) translateX(-50%)',
                  width: '75%',
                  height: '50%',
                  border: '2px solid #10b981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Esquinas del Recuadro de Enfoque */}
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981', borderTopLeftRadius: '6px' }}></div>
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981', borderTopRightRadius: '6px' }}></div>
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981', borderBottomLeftRadius: '6px' }}></div>
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981', borderBottomRightRadius: '6px' }}></div>

                  {/* Texto de guía interno estático */}
                  <span style={{
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    🟢 Enfocar código a unos 15 cm
                  </span>
                </div>
              )}

              {/* Botones Flotantes de Control de Hardware (Flash y Zoom) */}
              {!scannerError && (
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  right: '15px',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 20
                }}>
                  {/* Botón de Alternar Cámara (Frontal / Trasera) */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    style={{
                      background: facingMode === 'user' ? 'var(--color-secondary)' : 'rgba(0,0,0,0.65)',
                      border: facingMode === 'user' ? '1px solid var(--color-secondary)' : '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s'
                    }}
                    title="Alternar Cámara Frontal / Trasera"
                  >
                    <RefreshCw size={18} />
                  </button>

                  {/* Botón de Linterna (Torch) */}
                  <button
                    type="button"
                    onClick={toggleTorch}
                    style={{
                      background: isTorchOn ? 'var(--color-warning)' : 'rgba(0,0,0,0.65)',
                      border: isTorchOn ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isTorchOn ? '0 0 10px rgba(234, 179, 8, 0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s'
                    }}
                    title="Encender Linterna / Flash"
                  >
                    <Zap size={18} />
                  </button>

                  {/* Botón de Zoom Cíclico (1.0x -> 1.8x -> 2.5x) */}
                  <button
                    type="button"
                    onClick={cycleZoom}
                    style={{
                      background: 'rgba(0,0,0,0.65)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      borderRadius: '30px',
                      padding: '0 12px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s'
                    }}
                    title="Ajustar Zoom Óptico"
                  >
                    <Search size={14} />
                    <span>{currentZoom}x</span>
                  </button>
                </div>
              )}
              
              {/* Línea Láser Animada */}
              {!scannerError && (
                <div style={{
                  position: 'absolute',
                  left: '15%',
                  right: '15%',
                  height: '2px',
                  background: '#ff0055',
                  boxShadow: '0 0 10px #ff0055, 0 0 20px #ff0055',
                  top: '50%',
                  zIndex: 9,
                  pointerEvents: 'none',
                  animation: 'laserMove 2s infinite ease-in-out'
                }}></div>
              )}
            </div>

            <button
              onClick={stopScanner}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cerrar Cámara
            </button>
          </div>
          
          {/* Estilos locales para animar la línea láser y adaptar el video de la cámara */}
          <style>{`
            #reader-container video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
            @keyframes laserMove {
              0% { top: 25%; opacity: 0.8; }
              50% { top: 75%; opacity: 0.8; }
              100% { top: 25%; opacity: 0.8; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default POS;
