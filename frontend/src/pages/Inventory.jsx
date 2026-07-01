import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  Search, Plus, Edit2, Trash2, ArrowUpDown, 
  AlertTriangle, Filter, Save, X, PlusCircle, MinusCircle,
  Camera, Zap, RefreshCw
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const Inventory = () => {
  const { apiFetch, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filter, setFilter] = useState(''); // 'low-stock', 'expired', 'expiring-soon'
  
  // Estados para modal de Formulario de Producto
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formMarkup, setFormMarkup] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formError, setFormError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [formSupplier, setFormSupplier] = useState('');
  const [formIva, setFormIva] = useState(21);
  const [formImpuestoInterno, setFormImpuestoInterno] = useState(0);
  const [formImpuestoInternoTipo, setFormImpuestoInternoTipo] = useState('porcentaje');

  // Estados para modal de Agregar Categoría
  const [customCategories, setCustomCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState('');

  // Estados para modal de Ajuste de Stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('compra'); // 'compra', 'ajuste_positivo', 'ajuste_negativo'
  const [adjustReason, setAdjustReason] = useState('');
  const [stockError, setStockError] = useState('');

  const isAdmin = user && (user.role === 'admin' || user.role === 'vendedor');
  const location = useLocation();

  // Estados y funciones del Escáner por Cámara
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.8);
  const [guideState, setGuideState] = useState('buscando');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' o 'user'
  const [isCameraTransitioning, setIsCameraTransitioning] = useState(false);
  const scannerContainerId = 'inventory-reader-container';
  const html5QrCodeRef = useRef(null);

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

  const handleScannedCode = (code) => {
    setFormCode(code);
  };

  const startScanner = async (overrideFacing) => {
    setIsScanning(true);
    setScannerError('');
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
          fps: 15,
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
            useBarCodeDetectorIfSupported: true
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

        await tryStartCamera();

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
              
              if (capabilities.zoom) {
                const idealZoom = Math.min(Math.max(capabilities.zoom.min || 1, 1.8), capabilities.zoom.max || 1);
                trackConstraints.zoom = idealZoom;
              }
              
              if (Object.keys(trackConstraints).length > 0) {
                await track.applyConstraints({
                  advanced: [trackConstraints]
                });
              }
            }
          }
        } catch (focusErr) {
          console.warn('Foco continuo o zoom no soportado:', focusErr);
        }

      } catch (err) {
        console.error('Error al encender la cámara:', err);
        setScannerError(`No se pudo acceder a la cámara. Detalles: ${err.message || err}`);
      }
    });
  };

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

  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const nextTorchState = !isTorchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorchState }]
        });
        setIsTorchOn(nextTorchState);
      }
    } catch (err) {
      console.warn('El dispositivo no soporta linterna.', err);
    }
  };

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
      }
    } catch (err) {
      console.warn('El dispositivo no soporta controles de zoom.', err);
    }
  };

  useEffect(() => {
    if (!isScanning) return;
    setGuideState('buscando');
  }, [isScanning]);

  useEffect(() => {
    if (location.state?.scannedCode && isAdmin) {
      setEditingProduct(null);
      setFormCode(location.state.scannedCode);
      setFormName('');
      setFormDescription('');
      setFormCategory('');
      setFormPurchasePrice('');
      setFormSalePrice('');
      setFormMarkup('');
      setFormStock('0');
      setFormMinStock('5');
      setFormExpirationDate('');
      setFormError('');
      setShowFormModal(true);
      
      // Limpiar el estado de ubicación para evitar que se re-abra al recargar
      window.history.replaceState({}, document.title);
    }
  }, [location, isAdmin]);

  const handleOpenCategoryModal = () => {
    setNewCategoryName('');
    setCategoryModalError('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    setCategoryModalError('');
    
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryModalError('El nombre de la categoría no puede estar vacío.');
      return;
    }
    
    // Unir las categorías existentes y las personalizadas para validar duplicados
    const allCats = [...categories, ...customCategories];
    const exists = allCats.some(cat => cat.toLowerCase() === name.toLowerCase());
    
    if (exists) {
      setCategoryModalError('Esta categoría ya existe en el sistema.');
      return;
    }
    
    setCustomCategories([...customCategories, name]);
    setShowCategoryModal(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, selectedCategory, filter]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await apiFetch('/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let queryStr = `?search=${search}`;
      if (selectedCategory) queryStr += `&category=${selectedCategory}`;
      if (filter) queryStr += `&filter=${filter}`;

      const res = await apiFetch(`/products${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/products/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir Modal para crear
  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormCategory('');
    setFormPurchasePrice('');
    setFormSalePrice('');
    setFormMarkup('');
    setFormStock('0');
    setFormMinStock('5');
    setFormExpirationDate('');
    setFormSupplier('');
    setFormIva(21);
    setFormImpuestoInterno(0);
    setFormImpuestoInternoTipo('porcentaje');
    setFormError('');
    setShowFormModal(true);
  };

  // Abrir Modal para editar
  const handleOpenEdit = (prod) => {
    if (!isAdmin) return;
    setEditingProduct(prod);
    setFormCode(prod.code || '');
    setFormName(prod.name || '');
    setFormDescription(prod.description || '');
    setFormCategory(prod.category || '');
    setFormPurchasePrice(prod.purchasePrice !== undefined && prod.purchasePrice !== null ? prod.purchasePrice : '');
    setFormSalePrice(prod.salePrice !== undefined && prod.salePrice !== null ? prod.salePrice : '');
    
    // Pre-calcular rentabilidad (%) al editar
    if (prod.purchasePrice && prod.purchasePrice > 0) {
      const markup = ((prod.salePrice - prod.purchasePrice) / prod.purchasePrice) * 100;
      setFormMarkup(markup.toFixed(1));
    } else {
      setFormMarkup('');
    }

    setFormStock(prod.stock !== undefined && prod.stock !== null ? prod.stock : '0');
    setFormMinStock(prod.minStock !== undefined && prod.minStock !== null ? prod.minStock : '5');
    
    // Formatear fecha para el input type="date"
    const dateStr = prod.expirationDate 
      ? new Date(prod.expirationDate).toISOString().split('T')[0] 
      : '';
    setFormExpirationDate(dateStr);
    setFormSupplier(prod.supplier?._id || prod.supplier || '');
    setFormIva(prod.iva !== undefined && prod.iva !== null ? prod.iva : 21);
    setFormImpuestoInterno(prod.impuestoInterno !== undefined && prod.impuestoInterno !== null ? prod.impuestoInterno : 0);
    setFormImpuestoInternoTipo(prod.impuestoInternoTipo || 'porcentaje');
    
    setFormError('');
    setShowFormModal(true);
  };

  // Funciones de cálculo recíproco en tiempo real (Costo, Rentabilidad y Venta)
  const handlePurchasePriceChange = (val) => {
    setFormPurchasePrice(val);
    const cost = parseFloat(val);
    if (!isNaN(cost) && cost > 0) {
      if (formMarkup !== '' && !isNaN(formMarkup)) {
        const markup = parseFloat(formMarkup);
        const sale = cost * (1 + markup / 100);
        setFormSalePrice(sale.toFixed(2));
      } else if (formSalePrice !== '' && !isNaN(formSalePrice)) {
        const sale = parseFloat(formSalePrice);
        const markup = ((sale - cost) / cost) * 100;
        setFormMarkup(markup.toFixed(1));
      }
    }
  };

  const handleMarkupChange = (val) => {
    setFormMarkup(val);
    const markup = parseFloat(val);
    const cost = parseFloat(formPurchasePrice);
    if (!isNaN(markup) && !isNaN(cost) && cost > 0) {
      const sale = cost * (1 + markup / 100);
      setFormSalePrice(sale.toFixed(2));
    } else if (val === '') {
      setFormSalePrice('');
    }
  };

  const handleSalePriceChange = (val) => {
    setFormSalePrice(val);
    const sale = parseFloat(val);
    const cost = parseFloat(formPurchasePrice);
    if (!isNaN(sale) && !isNaN(cost) && cost > 0) {
      const markup = ((sale - cost) / cost) * 100;
      setFormMarkup(markup.toFixed(1));
    } else if (val === '') {
      setFormMarkup('');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formCode) {
      setFormError('El código de barras es obligatorio');
      return;
    }

    const payload = {
      name: formName.trim() || 'Producto Sin Nombre',
      description: formDescription || '',
      category: formCategory || 'General',
      purchasePrice: parseFloat(formPurchasePrice) || 0,
      salePrice: parseFloat(formSalePrice) || 0,
      stock: parseInt(formStock) || 0,
      minStock: (formMinStock !== '' && formMinStock !== undefined && formMinStock !== null) ? parseInt(formMinStock) : 0,
      expirationDate: formExpirationDate || null,
      supplier: formSupplier || null,
      iva: parseFloat(formIva) || 0,
      impuestoInterno: parseFloat(formImpuestoInterno) || 0,
      impuestoInternoTipo: formImpuestoInternoTipo
    };

    if (!editingProduct || formCode !== editingProduct.code) {
      payload.code = formCode;
    }

    // Solo se permite definir el stock inicial al crear
    if (!editingProduct) {
      payload.stock = (formStock !== '' && formStock !== undefined && formStock !== null) ? parseInt(formStock) : 0;
    }

    try {
      const url = editingProduct ? `/products/${editingProduct._id}` : '/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar el producto');
      }

      setShowFormModal(false);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Eliminar / Desactivar Producto
  const handleDeleteProduct = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('¿Está seguro de que desea retirar este producto del catálogo activo?')) {
      try {
        const res = await apiFetch(`/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProducts();
          fetchCategories();
        } else {
          const data = await res.json();
          alert(data.message || 'Error al eliminar producto');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Abrir Modal para ajustar stock
  const handleOpenStock = (prod) => {
    if (!isAdmin) return;
    setSelectedStockProduct(prod);
    setAdjustQty('');
    setAdjustType('compra');
    setAdjustReason('');
    setStockError('');
    setShowStockModal(true);
  };

  const handleSaveStockAdjust = async (e) => {
    e.preventDefault();
    setStockError('');

    if (!adjustQty || isNaN(adjustQty) || parseInt(adjustQty) <= 0) {
      setStockError('Por favor introduce una cantidad válida mayor a cero');
      return;
    }

    // Si es ajuste negativo, pasar la cantidad como negativa al backend
    const qty = adjustType === 'ajuste_negativo' 
      ? -parseInt(adjustQty) 
      : parseInt(adjustQty);

    const payload = {
      quantity: qty,
      type: adjustType,
      reason: adjustReason || (adjustType === 'compra' ? 'Ingreso por compra' : adjustType === 'ajuste_positivo' ? 'Ajuste manual positivo' : 'Ajuste manual negativo')
    };

    try {
      const res = await apiFetch(`/products/${selectedStockProduct._id}/stock`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al ajustar el stock');
      }

      setShowStockModal(false);
      fetchProducts();
    } catch (err) {
      setStockError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Inventario de Productos</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Gestión, auditoría y control de stock de mercadería.</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleOpenCategoryModal} className="btn btn-secondary" style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: 'var(--color-secondary)',
              fontWeight: 600
            }}>
              <PlusCircle size={18} />
              <span>Agregar Categoría</span>
            </button>
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={18} />
              <span>Agregar Producto</span>
            </button>
          </div>
        )}
      </div>

      {/* Panel de Filtros y Búsqueda */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '20px', marginBottom: '25px', alignItems: 'center' }}>
        
        {/* Buscador */}
        <div style={{ flexGrow: 1, minWidth: '240px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const term = search.trim();
                if (!term) return;
                if (products.length === 0) {
                  const confirmAdd = window.confirm(`El producto con código/nombre "${term}" no existe. ¿Deseas registrar un nuevo producto con este código?`);
                  if (confirmAdd) {
                    handleOpenCreate();
                    setFormCode(term);
                  }
                }
              }
            }}
            style={{ paddingLeft: '40px', padding: '8px 12px 8px 40px' }}
          />
        </div>

        {/* Filtrar por Categoría */}
        <div style={{ minWidth: '160px' }}>
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg-main)' }}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Filtros Rápidos */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setFilter(filter === 'low-stock' ? '' : 'low-stock')}
            className={`btn ${filter === 'low-stock' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <AlertTriangle size={16} />
            <span>Bajo Stock</span>
          </button>

          <button 
            onClick={() => setFilter(filter === 'expired' ? '' : 'expired')}
            className={`btn ${filter === 'expired' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '8px 12px', fontSize: '0.85rem', color: filter === 'expired' ? 'white' : '#ff8a8a' }}
          >
            <span>Vencidos</span>
          </button>

          <button 
            onClick={() => setFilter(filter === 'expiring-soon' ? '' : 'expiring-soon')}
            className={`btn ${filter === 'expiring-soon' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <span>Vence Pronto (30d)</span>
          </button>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Cargando inventario...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            No se encontraron productos con los filtros seleccionados.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Producto</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Costo / Venta</th>
                  <th>Margen</th>
                  <th>Stock Actual</th>
                  <th>Vencimiento</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;
                  
                  // Expiración
                  const isExpired = prod.expirationDate && new Date(prod.expirationDate) < new Date();
                  const daysRemaining = prod.expirationDate 
                    ? Math.ceil((new Date(prod.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  // Margen comercial
                  const profitMargin = ((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100;

                  return (
                    <tr key={prod._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{prod.code}</td>
                      <td style={{ fontWeight: 600 }}>{prod.name}</td>
                      <td>{prod.category}</td>
                      <td>{prod.supplier?.name || <span style={{ color: 'var(--color-text-muted)' }}>---</span>}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          ${prod.purchasePrice.toFixed(2)}
                        </span>
                        <span style={{ margin: '0 6px', color: 'var(--color-text-muted)' }}>/</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                          ${prod.salePrice.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {profitMargin.toFixed(0)}%
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'}`}>
                            {prod.stock} unds.
                          </span>
                          {isAdmin && (
                            <button 
                              onClick={() => handleOpenStock(prod)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', display: 'inline-flex' }}
                              title="Ajustar Stock"
                            >
                              <PlusCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        {prod.expirationDate ? (
                          <span className={`badge ${isExpired ? 'badge-danger' : daysRemaining <= 30 ? 'badge-warning' : 'badge-success'}`}>
                            {new Date(prod.expirationDate).toLocaleDateString()} 
                            {isExpired ? ' (Vencido)' : daysRemaining <= 30 ? ` (${daysRemaining}d)` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No aplica</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {isAdmin ? (
                            <>
                              <button 
                                onClick={() => handleOpenEdit(prod)} 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod._id)} 
                                className="btn btn-danger" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Solo consulta</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Formulario de Producto (Crear/Editar) */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto Consumible'}</h3>
              <button onClick={() => setShowFormModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Código de Barras</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Escriba o escanee..."
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      onClick={startScanner}
                      className="btn btn-secondary"
                      style={{
                        padding: '0 12px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: 'var(--color-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Escanear Código de Barras con Cámara"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Categoría del Producto</label>
                  <select
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ background: 'var(--bg-main)' }}
                  >
                    <option value="">Seleccionar Categoría...</option>
                    {[...new Set([...categories, ...customCategories])].sort().map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Nombre del Producto</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Ibuprofeno 600mg"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Proveedor</label>
                  <select
                    className="form-input"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    style={{ background: 'var(--bg-main)' }}
                  >
                    <option value="">Ninguno / Sin Proveedor</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Descripción</label>
                <textarea
                  className="form-input"
                  placeholder="Detalles adicionales..."
                  rows="2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Precio Compra (Costo)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={formPurchasePrice}
                    onChange={(e) => handlePurchasePriceChange(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Rentabilidad (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    placeholder="Ej. 50"
                    value={formMarkup}
                    onChange={(e) => handleMarkupChange(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Precio Venta Público</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={formSalePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">IVA (%)</label>
                  <select
                    className="form-input"
                    value={formIva}
                    onChange={(e) => setFormIva(e.target.value)}
                    style={{ background: 'var(--bg-main)' }}
                  >
                    <option value="0">0%</option>
                    <option value="10.5">10.5%</option>
                    <option value="21">21%</option>
                    <option value="27">27%</option>
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Impuesto Interno</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formImpuestoInterno}
                      onChange={(e) => setFormImpuestoInterno(e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <select
                      className="form-input"
                      value={formImpuestoInternoTipo}
                      onChange={(e) => setFormImpuestoInternoTipo(e.target.value)}
                      style={{ background: 'var(--bg-main)', flex: 1 }}
                    >
                      <option value="porcentaje">% (Porcentaje)</option>
                      <option value="fijo">$ (Monto Fijo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Stock Mínimo Alerta (Opcional)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Stock Inicial (Solo nuevos)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    disabled={!!editingProduct}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Fecha de Vencimiento (Consumible)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formExpirationDate}
                  onChange={(e) => setFormExpirationDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajuste Rápido de Stock */}
      {showStockModal && selectedStockProduct && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Ajustar Stock de Inventario</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedStockProduct.name}</span>
              </div>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {stockError && (
              <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {stockError}
              </div>
            )}

            <form onSubmit={handleSaveStockAdjust}>
              
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '15px', alignItems: 'center' }}>
                <span className="input-label" style={{ marginBottom: 0 }}>Stock Actual:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {selectedStockProduct.stock} unidades
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Tipo de Movimiento</label>
                <select
                  className="form-input"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                >
                  <option value="compra">Ingreso por Compra / Compra de Mercadería</option>
                  <option value="ajuste_positivo">Corrección Positiva (Suma)</option>
                  <option value="ajuste_negativo">Corrección Negativa / Rotura o Descarte (Resta)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Cantidad a ajustar</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Ingrese cantidad de unidades..."
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Motivo o Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Nueva partida lote 56, Faltante en góndolas, etc."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <span>Confirmar Movimiento</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Nueva Categoría */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Agregar Nueva Categoría</h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {categoryModalError && (
              <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {categoryModalError}
              </div>
            )}

            <form onSubmit={handleSaveCategory}>
              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Nombre de la Categoría</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Gaseosas, Helados, Golosinas..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)' }}>
                  <span>Guardar Categoría</span>
                </button>
              </div>
            </form>
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
              <span>Escáner de Código (Inventario)</span>
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
              type="button"
              onClick={stopScanner}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cerrar Cámara
            </button>
          </div>
          
          {/* Estilos locales para animar la línea láser y adaptar el video de la cámara */}
          <style>{`
            #${scannerContainerId} video {
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

export default Inventory;
