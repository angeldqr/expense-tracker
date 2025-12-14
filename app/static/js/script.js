(() => {
    'use strict';

    // =================================================================
    // MÓDULO INTERNO DE API Y AUTENTICACIÓN
    // =================================================================
    // Usar URL dinámica para que funcione en desarrollo y producción
    const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:5000' 
        : window.location.origin;
    const TOKEN_KEY = 'access_token';

    const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const isLoggedIn = () => !!getToken();
    const getAuthHeader = () => ({
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
    });

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        cache.clear();
        window.location.reload();
    };

    // Sistema de cache inteligente
    const cache = {
        data: new Map(),
        timestamps: new Map(),
        TTL: 5 * 60 * 1000, // 5 minutos
        
        set(key, value) {
            this.data.set(key, value);
            this.timestamps.set(key, Date.now());
        },
        
        get(key) {
            const timestamp = this.timestamps.get(key);
            if (!timestamp || Date.now() - timestamp > this.TTL) {
                this.data.delete(key);
                this.timestamps.delete(key);
                return null;
            }
            return this.data.get(key);
        },
        
        invalidate(pattern) {
            for (const key of this.data.keys()) {
                if (key.includes(pattern)) {
                    this.data.delete(key);
                    this.timestamps.delete(key);
                }
            }
        },

        clear() {
            this.data.clear();
            this.timestamps.clear();
        }
    };

    // Logger mejorado
    const logger = {
        log(level, message, data = {}) {
            const timestamp = new Date().toISOString();
            const logEntry = { timestamp, level, message, data };
            
            console[level](`[${timestamp}] ${message}`, data);
            
            if (level === 'error') {
                this.reportError(logEntry);
            }
        },
        
        reportError(logEntry) {
            // En producción, enviar a servicio de logging
            try {
                localStorage.setItem('app_errors', JSON.stringify([
                    ...JSON.parse(localStorage.getItem('app_errors') || '[]').slice(-9),
                    logEntry
                ]));
            } catch (e) {
                console.warn('No se pudo guardar el error en localStorage');
            }
        }
    };
    
    const handleResponse = async (response) => {
        try {
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 && data.msg === "Token has expired") { 
                    showNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
                    setTimeout(logout, 2000);
                }
                const error = new Error(data.error || data.message || 'Error desconocido.');
                logger.log('error', 'API Error', { status: response.status, url: response.url, data });
                throw error;
            }
            return data;
        } catch (error) {
            if (error.name === 'SyntaxError') {
                logger.log('error', 'Invalid JSON response', { url: response.url });
                throw new Error('Respuesta inválida del servidor');
            }
            throw error;
        }
    };

    // API con retry y cache
    const apiWithRetry = {
        async request(url, options, retries = 3, useCache = false) {
            // Asegurar que las opciones tengan la estructura correcta
            const requestOptions = {
                method: options.method || 'GET',
                headers: options.headers || {},
                ...(options.body && { body: options.body })
            };
            
            const cacheKey = `${url}_${JSON.stringify(requestOptions)}`;
            
            // Verificar cache para GET requests
            if (useCache && requestOptions.method === 'GET') {
                const cached = cache.get(cacheKey);
                if (cached) {
                    logger.log('info', 'Cache hit', { url });
                    return cached;
                }
            }

            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, requestOptions);
                    const data = await handleResponse(response);
                    
                    // Guardar en cache para GET requests exitosos
                    if (useCache && requestOptions.method === 'GET') {
                        cache.set(cacheKey, data);
                    }
                    
                    return data;
                } catch (error) {
                    logger.log('warn', `API request failed (attempt ${i + 1})`, { url, error: error.message });
                    
                    if (i === retries - 1) throw error;
                    
                    // Solo reintentar en errores de red
                    if (error.message.includes('fetch') || error.message.includes('Network')) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                        continue;
                    }
                    throw error;
                }
            }
        }
    };

    const api = {
        login: (email, password) => apiWithRetry.request(`${BASE_URL}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, password }) }),
        register: (name, email, password) => apiWithRetry.request(`${BASE_URL}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, email, password }) }),
        getCategories: () => apiWithRetry.request(`${BASE_URL}/categories/`, { method: 'GET', headers: getAuthHeader() }, 3, true),
        createCategory: (name) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ name }) }); },
        updateCategory: (id, name) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/${id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify({ name }) }); },
        deleteCategory: (id) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeader() }); },
        getTransactions: () => apiWithRetry.request(`${BASE_URL}/transactions/`, { method: 'GET', headers: getAuthHeader() }, 3, true),
        getTransactionById: (id) => apiWithRetry.request(`${BASE_URL}/transactions/${id}`, { method: 'GET', headers: getAuthHeader() }, 3, true),
        createTransaction: (data) => { cache.invalidate('transactions'); return apiWithRetry.request(`${BASE_URL}/transactions/`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify(data) }); },
        updateTransaction: (id, data) => { cache.invalidate('transactions'); return apiWithRetry.request(`${BASE_URL}/transactions/${id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify(data) }); },
        deleteTransaction: (id) => { cache.invalidate('transactions'); return apiWithRetry.request(`${BASE_URL}/transactions/${id}`, { method: 'DELETE', headers: getAuthHeader() }); }
    };

    // =================================================================
    // SISTEMA DE ANIMACIONES AVANZADAS
    // =================================================================
    const animationSystem = {
        observer: null,
        
        init() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        this.observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            this.injectAdvancedStyles();
        },

        injectAdvancedStyles() {
            const advancedStyles = document.createElement('style');
            advancedStyles.textContent = `
                .stagger-container { opacity: 0; transform: translateY(30px); }
                .stagger-container.animate-in { opacity: 1; transform: translateY(0); transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .stagger-item { opacity: 0; transform: translateY(20px) scale(0.95); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                .stagger-item.animate-in { opacity: 1; transform: translateY(0) scale(1); }
                .action-btn { transform-style: preserve-3d; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
                .action-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s; z-index: 1; }
                .action-btn:hover::before { left: 100%; }
                .action-btn:hover { transform: translateY(-3px) rotateX(5deg) rotateY(-2deg); box-shadow: 0 10px 25px rgba(94, 99, 255, 0.3); }
                .action-btn:active { transform: translateY(0) rotateX(0) rotateY(0) scale(0.96); }
                .skeleton { background: linear-gradient(90deg, #2a2d3a 25%, #363a4a 50%, #2a2d3a 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 8px; }
                @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .skeleton-row { height: 60px; margin: 8px 0; display: flex; align-items: center; gap: 1rem; }
                .skeleton-cell { height: 20px; border-radius: 4px; }
                .skeleton-cell:nth-child(1) { width: 15%; } .skeleton-cell:nth-child(2) { width: 30%; } .skeleton-cell:nth-child(3) { width: 20%; } .skeleton-cell:nth-child(4) { width: 15%; } .skeleton-cell:nth-child(5) { width: 20%; }
                .view { transition: opacity 0.3s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .view.hidden { position: absolute; opacity: 0; transform: translateX(20px); pointer-events: none; }
                .micro-bounce { animation: micro-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
                @keyframes micro-bounce { 0% { transform: scale(1); } 30% { transform: scale(1.05); } 50% { transform: scale(0.95); } 70% { transform: scale(1.02); } 100% { transform: scale(1); } }
                .success-pulse { animation: success-pulse 0.8s ease-out; }
                @keyframes success-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); transform: scale(1); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); transform: scale(1.02); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(1); } }
                .particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
                .particle { position: absolute; width: 2px; height: 2px; background: rgba(94, 99, 255, 0.3); border-radius: 50%; animation: float-particle 8s infinite linear; }
                @keyframes float-particle { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-10px) rotate(360deg); opacity: 0; } }
                .notification { transform: translateX(-50%) scale(0.8); opacity: 0; }
                .notification.show { transform: translateX(-50%) scale(1); opacity: 1; animation: notification-bounce 0.6s ease-out; }
                @keyframes notification-bounce { 0% { transform: translateX(-50%) scale(0.3) rotate(-10deg); } 50% { transform: translateX(-50%) scale(1.05) rotate(2deg); } 70% { transform: translateX(-50%) scale(0.95) rotate(-1deg); } 100% { transform: translateX(-50%) scale(1) rotate(0deg); } }
            `;
            document.head.appendChild(advancedStyles);
        },

        staggerTableRows(tableBody, delay = 100) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                row.classList.add('stagger-item');
                setTimeout(() => {
                    row.classList.add('animate-in');
                }, index * delay);
            });
        },

        observeElement(element) {
            if (element && this.observer) {
                element.classList.add('stagger-container');
                this.observer.observe(element);
            }
        },

        createParticles(count = 20) {
            const existingParticles = document.querySelector('.particles');
            if (existingParticles) return;
            const particleContainer = document.createElement('div');
            particleContainer.className = 'particles';
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 8 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                particleContainer.appendChild(particle);
            }
            document.body.appendChild(particleContainer);
        },

        addMicroBounce(element) {
            element.classList.add('micro-bounce');
            setTimeout(() => element.classList.remove('micro-bounce'), 600);
        },

        addSuccessPulse(element) {
            element.classList.add('success-pulse');
            setTimeout(() => element.classList.remove('success-pulse'), 800);
        }
    };

    // =================================================================
    // ESTADO CENTRALIZADO DE LA APLICACIÓN
    // =================================================================
    const appState = {
        user: null,
        categories: [],
        transactions: [],
        filteredTransactions: [],
        filters: { search: '', category: '', type: '', month: '', transactionDate: '' },
        ui: { 
            currentPage: 1, 
            currentCategoryPage: 1, 
            editingTransactionId: null,
            loading: false
        },
        
        setState(newState) {
            Object.assign(this, newState);
            this.notifySubscribers();
        },
        
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            this.ui.currentPage = 1; // Reset a primera página
            this.applyFilters();
            this.notifySubscribers();
        },
        
        applyFilters() {
            this.filteredTransactions = this.transactions.filter(t => {
                const matchesSearch = !this.filters.search || 
                    t.description.toLowerCase().includes(this.filters.search.toLowerCase());
                const matchesCategory = !this.filters.category || 
                    t.category_id === parseInt(this.filters.category);
                const matchesType = !this.filters.type || t.type === this.filters.type;
                
                // Usar transaction_date del backend (ya viene en formato YYYY-MM-DD)
                let matchesTransactionDate = true;
                if (this.filters.transactionDate) {
                    matchesTransactionDate = this.filters.transactionDate === t.transaction_date;
                }

                // Usar transaction_month del backend
                let matchesMonth = true;
                if (this.filters.month) {
                    matchesMonth = this.filters.month === t.transaction_month;
                }

                return matchesSearch && matchesCategory && matchesType && matchesMonth && matchesTransactionDate;
            }).sort((a, b) => {
                // Ordenar por fecha descendente (más reciente primero)
                const dateA = new Date(a.transaction_date + 'T00:00:00');
                const dateB = new Date(b.transaction_date + 'T00:00:00');
                
                // Primero comparar por fecha
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB - dateA;
                }
                
                // Si las fechas son iguales, ordenar por ID descendente (más reciente primero)
                return b.id - a.id;
            });
        },
        
        updateCategoryName(categoryId, newName) {
            // Actualizar el nombre en el array de categorías
            const categoryIndex = this.categories.findIndex(cat => cat.id === parseInt(categoryId));
            if (categoryIndex !== -1) {
                this.categories[categoryIndex].name = newName;
            }
            
            // Actualizar el nombre en todas las transacciones que usan esta categoría
            this.transactions = this.transactions.map(transaction => {
                if (transaction.category_id === parseInt(categoryId)) {
                    return {
                        ...transaction,
                        category_name: newName
                    };
                }
                return transaction;
            });
            
            // Actualizar también las transacciones filtradas
            this.filteredTransactions = this.filteredTransactions.map(transaction => {
                if (transaction.category_id === parseInt(categoryId)) {
                    return {
                        ...transaction,
                        category_name: newName
                    };
                }
                return transaction;
            });
            
            this.notifySubscribers();
        },
        
        subscribers: [],
        
        subscribe(callback) {
            this.subscribers.push(callback);
        },
        
        notifySubscribers() {
            this.subscribers.forEach(callback => callback(this));
        }
    };

    // =================================================================
    // FUNCIONES DE UI (VALIDACIÓN, NOTIFICACIONES, ETC.)
    // =================================================================
    
    // Función debounce para optimizar búsquedas
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Validadores mejorados
    const validators = {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Email inválido',
        password: (value) => value.length >= 8 ? null : 'Mínimo 8 caracteres',
        required: (value) => value.trim() ? null : 'Campo obligatorio',
        amount: (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 ? null : 'Debe ser un número mayor a 0';
        },
        maxLength: (max) => (value) => value.length <= max ? null : `Máximo ${max} caracteres`,
        uniqueCategory: (categories) => (value) => {
            const normalizedValue = value.trim().toLowerCase();
            const existsCategory = categories.some(cat => 
                cat.name.toLowerCase() === normalizedValue
            );
            return existsCategory ? 'Ya existe una categoría con este nombre' : null;
        },
        uniqueCategoryEdit: (categories, currentId) => (value) => {
            const normalizedValue = value.trim().toLowerCase();
            const existsCategory = categories.some(cat => 
                cat.name.toLowerCase() === normalizedValue && cat.id !== parseInt(currentId)
            );
            return existsCategory ? 'Ya existe una categoría con este nombre' : null;
        }
    };

    const validateField = (input, rules) => {
        for (const rule of rules) {
            const validator = typeof rule === 'string' ? validators[rule] : rule;
            const error = validator(input.value);
            if (error) return error;
        }
        return null;
    };

    const showNotification = (message, type = 'success') => {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    const validateForm = (form) => {
        let isValid = true;
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('input[required]').forEach(input => {
            input.classList.remove('input-error');
            let error = null;
            
            // Usar validadores mejorados
            const rules = ['required'];
            if (input.type === 'email') rules.push('email');
            if (input.type === 'password' && form.id === 'registerForm') rules.push('password');
            if (input.type === 'number') rules.push('amount');
            
            error = validateField(input, rules);
            
            if (error) {
                isValid = false;
                input.classList.add('input-error');
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = error;
                input.parentElement.appendChild(errorElement);
            }
        });
        return isValid;
    };

    // =================================================================
    // FUNCIONES DE LOADING SKELETON
    // =================================================================
    const showSkeletonLoader = (container, rows = 5, cells = 5) => {
        container.innerHTML = '';
        for (let i = 0; i < rows; i++) {
            const skeletonRow = document.createElement('div');
            skeletonRow.className = 'skeleton-row skeleton';
            for (let j = 0; j < cells; j++) {
                const skeletonCell = document.createElement('div');
                skeletonCell.className = 'skeleton-cell skeleton';
                skeletonRow.appendChild(skeletonCell);
            }
            container.appendChild(skeletonRow);
        }
    };

    // =================================================================
    // FUNCIONES AUXILIARES PARA NUEVA ESTRUCTURA HTML
    // =================================================================
    
    // Mostrar/ocultar loading state
    const showLoadingState = (show) => {
        const loadingElement = document.getElementById('transactions-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
            loadingElement.setAttribute('aria-hidden', show ? 'false' : 'true');
        }
    };

    // Actualizar badge de transacciones en sidebar
    const updateTransactionsBadge = (count) => {
        const badge = document.getElementById('transactions-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    };

    // Poblar filtro de categorías
    const populateCategoryFilter = (categories) => {
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categoryFilter.appendChild(option);
            });
            
            if (currentValue) categoryFilter.value = currentValue;
        }
    };

    // Poblar filtro de meses
    const populateMonthFilter = (transactions) => {
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            const currentValue = monthFilter.value;
            monthFilter.innerHTML = '<option value="">Todos los meses</option>';
            
            // Obtener meses únicos usando transaction_month del backend
            const months = [...new Set(transactions.map(t => t.transaction_month))].sort().reverse();
            
            months.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                // Formatear mes para mostrar (ej: "2024-01" -> "Enero 2024")
                const [year, monthNum] = month.split('-');
                const monthNames = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                option.textContent = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
                monthFilter.appendChild(option);
            });
            
            if (currentValue) monthFilter.value = currentValue;
        }
    };

    // Establecer fecha actual por defecto en el formulario
    const setDefaultTransactionDate = () => {
        const dateInput = document.getElementById('transaction-date');
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    };

    // Validación en tiempo real para formularios
    const setupRealTimeValidation = () => {
        const inputs = document.querySelectorAll('input[data-validation], select[data-validation]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateInputField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('input-error')) {
                    validateInputField(input);
                }
            });
        });
    };

    const validateInputField = (input) => {
        const validationRules = input.dataset.validation;
        if (!validationRules) return;

        const rules = validationRules.split(',').map(rule => rule.trim());
        const container = input.parentElement;
        
        // Limpiar errores previos
        container.querySelectorAll('.error-message').forEach(el => el.remove());
        input.classList.remove('input-error');

        // Validar según las reglas
        for (const rule of rules) {
            let error = null;

            if (rule === 'required' && !input.value.trim()) {
                error = 'Este campo es obligatorio';
            } else if (rule.startsWith('maxLength(')) {
                const maxLength = parseInt(rule.match(/\d+/)[0]);
                if (input.value.length > maxLength) {
                    error = `Máximo ${maxLength} caracteres`;
                }
            } else if (rule === 'amount') {
                const num = parseFloat(input.value);
                if (isNaN(num) || num <= 0) {
                    error = 'Debe ser un número mayor a 0';
                }
            } else if (rule === 'uniqueCategory') {
                error = validators.uniqueCategory(appState.categories)(input.value);
            } else if (rule === 'uniqueCategoryEdit') {
                const categoryId = document.getElementById('edit-category-id')?.value;
                error = validators.uniqueCategoryEdit(appState.categories, categoryId)(input.value);
            }

            if (error) {
                input.classList.add('input-error');
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = error;
                container.appendChild(errorElement);
                break;
            }
        }
    };

    // Mejorar botones de loading
    const setButtonLoading = (button, loading) => {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = loading ? 'none' : 'inline';
            btnLoading.style.display = loading ? 'inline-flex' : 'none';
        } else {
            // Fallback para botones sin estructura específica
            if (loading) {
                button.dataset.originalText = button.textContent;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        }
        
        button.disabled = loading;
        if (loading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    };

    // =================================================================
    // EL CEREBRO PRINCIPAL QUE UNE TODO
    // =================================================================
    document.addEventListener('DOMContentLoaded', () => {
        animationSystem.init();

        // --- Selectores del DOM ---
        const authView = document.getElementById('auth-view');
        const dashboardView = document.getElementById('dashboard-view');
        const container = document.getElementById('container');
        const registerBtn = document.getElementById('register');
        const loginBtn = document.getElementById('login');
        const registerForm = document.getElementById('registerForm');
        const loginForm = document.getElementById('loginForm');
        const allButtons = document.querySelectorAll('button');
        const logoutButton = document.getElementById('logout-button');
        const categoryForm = document.getElementById('category-form');
        const transactionForm = document.getElementById('transaction-form');
        const categorySelect = document.getElementById('category');
        const transactionsList = document.getElementById('transactions-list');
        const categoryList = document.getElementById('category-list');
        const menuItems = document.querySelectorAll('.menu-item');
        const views = document.querySelectorAll('.main-content .view');
        const transactionFormTitle = document.querySelector('#view-add-unified .dashboard-form-container h2');
        const addCategoryBtn = document.getElementById('add-category-btn');
        const categoryModal = document.getElementById('category-modal');
        const closeCategoryModalBtn = document.getElementById('close-category-modal');
        const editCategoryModal = document.getElementById('edit-category-modal');
        const closeEditCategoryModalBtn = document.getElementById('close-edit-category-modal');
        const editCategoryNameInput = document.getElementById('edit-category-name');
        const editCategorySubmitBtn = document.getElementById('edit-category-submit');
        const editCategoryIdInput = document.getElementById('edit-category-id');

        // --- Filtros ---
        const applyFilters = (transactions) => {
            return transactions.filter(t => {
                const matchesSearch = !appState.filters.search || t.description.toLowerCase().includes(appState.filters.search.toLowerCase());
                const matchesCategory = !appState.filters.category || t.category_id === parseInt(appState.filters.category);
                const matchesType = !appState.filters.type || t.type === appState.filters.type;
                const date = new Date(t.date);
                const matchesStartDate = !appState.filters.startDate || date >= new Date(appState.filters.startDate);
                const matchesEndDate = !appState.filters.endDate || date <= new Date(appState.filters.endDate);

                return matchesSearch && matchesCategory && matchesType && matchesStartDate && matchesEndDate;
            });
        };

        // --- Paginación de transacciones ---
        let currentPage = 1;
        const itemsPerPage = 5;

        const renderPaginatedTransactions = (transactions) => {
            // Las transacciones ya vienen ordenadas desde appState.applyFilters()
            const totalPages = Math.ceil(transactions.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageTransactions = transactions.slice(startIndex, endIndex);

            renderTransactions(pageTransactions);

            // Mostrar controles de paginación
            const paginationContainer = document.getElementById('pagination-controls');
            if (paginationContainer) {
                paginationContainer.innerHTML = `
                    <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>ANTERIOR</button>
                    <span>Página ${currentPage} de ${totalPages || 1}</span>
                    <button id="next-page" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>SIGUIENTE</button>
                `;

                document.getElementById('prev-page')?.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPaginatedTransactions(transactions);
                    }
                });

                document.getElementById('next-page')?.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderPaginatedTransactions(transactions);
                    }
                });
            }
        };

        // --- Paginación de categorías ---
        let currentCategoryPage = 1;
        const categoryItemsPerPage = 5;

        const renderPaginatedCategories = (categories) => {
            const totalPages = Math.ceil(categories.length / categoryItemsPerPage);
            const startIndex = (currentCategoryPage - 1) * categoryItemsPerPage;
            const endIndex = startIndex + categoryItemsPerPage;
            const pageCategories = categories.slice(startIndex, endIndex);

            renderCategoryList(pageCategories);

            // Mostrar controles de paginación
            const paginationContainer = document.getElementById('category-pagination-controls');
            if (paginationContainer) {
                paginationContainer.innerHTML = `
                    <button id="prev-category-page" ${currentCategoryPage === 1 ? 'disabled' : ''}>ANTERIOR</button>
                    <span>Página ${currentCategoryPage} de ${totalPages}</span>
                    <button id="next-category-page" ${currentCategoryPage === totalPages ? 'disabled' : ''}>SIGUIENTE</button>
                `;

                document.getElementById('prev-category-page')?.addEventListener('click', () => {
                    if (currentCategoryPage > 1) {
                        currentCategoryPage--;
                        renderPaginatedCategories(categories);
                    }
                });

                document.getElementById('next-category-page')?.addEventListener('click', () => {
                    if (currentCategoryPage < totalPages) {
                        currentCategoryPage++;
                        renderPaginatedCategories(categories);
                    }
                });
            }
        };

        // --- Lógica de Renderizado con Animaciones ---
        const renderCategoriesForSelect = (categories = []) => {
            if (!categorySelect) return;
            const selectedValue = categorySelect.value;
            categorySelect.innerHTML = '';
            if (categories.length === 0) {
                categorySelect.innerHTML = '<option disabled selected>Crea una categoría primero</option>';
            } else {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
                if(selectedValue) categorySelect.value = selectedValue;
            }
        };
        
        const renderCategoryList = (categories = []) => {
            if (!categoryList) return;
            showSkeletonLoader(categoryList, categories.length || 3, 2);
            
            setTimeout(() => {
                categoryList.innerHTML = '';
                if (categories.length === 0) {
                    categoryList.innerHTML = '<p>No has creado categorías.</p>';
                } else {
                    const table = document.createElement('table');
                    table.className = 'category-table';
                    table.innerHTML = `<thead><tr><th>Nombre</th><th>Acciones</th></tr></thead><tbody>
                            ${categories.map(cat => `<tr data-id="${cat.id}"><td>${cat.name}</td><td>
                                        <button class="action-btn edit-cat-btn" data-id="${cat.id}">Editar</button>
                                        <button class="action-btn delete-cat-btn" data-id="${cat.id}">Borrar</button>
                                    </td></tr>`).join('')}
                        </tbody>`;
                    categoryList.appendChild(table);
                    animationSystem.staggerTableRows(table.querySelector('tbody'), 150);
                }
            }, 600);
        };

        const renderTransactions = (transactions = []) => {
            if (!transactionsList) return;
            showSkeletonLoader(transactionsList, transactions.length || 5, 6);
            
            setTimeout(() => {
                transactionsList.innerHTML = '';
                if (transactions.length === 0) {
                    transactionsList.innerHTML = '<p>No tienes transacciones registradas.</p>';
                } else {
                    const table = document.createElement('table');
                    table.className = 'transactions-table';
                    table.innerHTML = `
                        <thead><tr><th>Categoría</th><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Acciones</th></tr></thead>
                        <tbody>
                            ${transactions.map(t => {
                                // Usar transaction_date del backend (formato YYYY-MM-DD)
                                const transactionDate = new Date(t.transaction_date + 'T00:00:00');
                                const formattedDate = transactionDate.toLocaleDateString('es-ES', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                });
                                return `
                                <tr data-id="${t.id}">
                                    <td>${t.category_name || 'Sin categoría'}</td>
                                    <td>${formattedDate}</td>
                                    <td>${t.description}</td>
                                    <td class="amount ${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})} COP</td>
                                    <td><span class="type-tag type-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                                    <td><button class="action-btn edit-btn" data-id="${t.id}">Editar</button><button class="action-btn delete-btn" data-id="${t.id}">Borrar</button></td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    `;
                    transactionsList.appendChild(table);
                    animationSystem.staggerTableRows(table.querySelector('tbody'), 120);
                }
            }, 800);
        };

        const initDashboard = async () => {
            try {
                appState.setState({ ui: { ...appState.ui, loading: true } });
                
                // Mostrar loading state
                showLoadingState(true);
                
                const [categories, transactions] = await Promise.all([
                    api.getCategories(), 
                    api.getTransactions()
                ]);
                
                // Actualizar estado centralizado
                appState.setState({
                    categories,
                    transactions,
                    ui: { ...appState.ui, loading: false }
                });
                
                // Poblar filtro de categorías
                populateCategoryFilter(categories);
                
                // Poblar filtro de meses
                populateMonthFilter(transactions);
                
                // Establecer fecha por defecto en formulario
                setDefaultTransactionDate();
                
                // Aplicar filtros
                appState.applyFilters();
                
                // Renderizar UI
                renderCategoriesForSelect(categories);
                renderPaginatedCategories(categories);
                renderPaginatedTransactions(appState.filteredTransactions);
                
                // Ocultar loading state
                showLoadingState(false);
                
            } catch (error) {
                appState.setState({ ui: { ...appState.ui, loading: false } });
                showLoadingState(false);
                showNotification(error.message, 'error');
                logger.log('error', 'Dashboard initialization failed', { error: error.message });
            }
        };
        
        const showDashboard = () => {
            authView.style.display = 'none';
            dashboardView.style.display = 'flex';
            document.body.classList.add('dashboard-active');
            animationSystem.createParticles(15);
            setTimeout(() => {
                const containers = document.querySelectorAll('.dashboard-form-container, .dashboard-data-container');
                containers.forEach(container => animationSystem.observeElement(container));
            }, 100);
            initDashboard();
        };
        
        const showAuth = () => {
            authView.style.display = 'block';
            dashboardView.style.display = 'none';
            document.body.classList.remove('dashboard-active');
            const particles = document.querySelector('.particles');
            if (particles) particles.remove();
        };

        if (isLoggedIn()) {
            showDashboard();
        } else {
            showAuth();
        }

        // Configurar validación en tiempo real
        setupRealTimeValidation();

        // =================================================================
        // MÓDULO DEL DASHBOARD
        // =================================================================
        const dashboardModule = {
            chart: null,
            doughnutChart: null,
            currentPeriod: 'all',
            
            async loadDashboard(period = null) {
                try {
                    // Si no se especifica período, usar el guardado
                    if (period === null) {
                        period = this.currentPeriod;
                    } else {
                        this.currentPeriod = period;
                    }
                    
                    // Actualizar el select con el período actual
                    const periodSelector = document.getElementById('period-selector');
                    if (periodSelector && periodSelector.value !== period) {
                        periodSelector.value = period;
                    }
                    
                    const transactions = await api.getTransactions();
                    const filteredTransactions = this.filterByPeriod(transactions, period);
                    this.updateStats(filteredTransactions);
                    this.updateChart(filteredTransactions);
                    this.updateDoughnutChart(filteredTransactions);
                    this.checkSpendingAlert(filteredTransactions);
                } catch (error) {
                    showNotification('Error al cargar el dashboard: ' + error.message, 'error');
                }
            },
            
            filterByPeriod(transactions, period) {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                
                return transactions.filter(t => {
                    const txDate = new Date(t.transaction_date + 'T00:00:00');
                    const txMonth = txDate.getMonth();
                    const txYear = txDate.getFullYear();
                    
                    switch(period) {
                        case 'current-month':
                            // Solo filtrar por mes y año actual, sin restricción de día
                            return txMonth === currentMonth && txYear === currentYear;
                        case 'last-3-months':
                            const threeMonthsAgo = new Date(now);
                            threeMonthsAgo.setMonth(currentMonth - 2);
                            threeMonthsAgo.setDate(1);
                            threeMonthsAgo.setHours(0, 0, 0, 0);
                            return txDate >= threeMonthsAgo;
                        case 'last-6-months':
                            const sixMonthsAgo = new Date(now);
                            sixMonthsAgo.setMonth(currentMonth - 5);
                            sixMonthsAgo.setDate(1);
                            sixMonthsAgo.setHours(0, 0, 0, 0);
                            return txDate >= sixMonthsAgo;
                        case 'current-year':
                            return txYear === currentYear;
                        case 'all':
                        default:
                            return true;
                    }
                });
            },
            
            updateChart(transactions) {
                const canvas = document.getElementById('incomeExpenseChart');
                if (!canvas) return;
                
                // Destruir gráfico anterior si existe
                if (this.chart) {
                    this.chart.destroy();
                }
                
                // Si no hay transacciones, mostrar mensaje
                if (transactions.length === 0) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = '16px Poppins';
                    ctx.fillStyle = '#a0aec0';
                    ctx.textAlign = 'center';
                    ctx.fillText('No hay datos para el período seleccionado', canvas.width / 2, canvas.height / 2);
                    return;
                }
                
                // Agrupar transacciones por mes
                const monthlyData = this.groupByMonth(transactions);
                
                // Crear gráfico
                const ctx = canvas.getContext('2d');
                this.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: monthlyData.labels,
                        datasets: [
                            {
                                label: 'Ingresos',
                                data: monthlyData.income,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#10b981',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7
                            },
                            {
                                label: 'Gastos',
                                data: monthlyData.expenses,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#ef4444',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#e2e8f0',
                                    font: {
                                        size: 12,
                                        weight: '600'
                                    },
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 15, 27, 0.95)',
                                titleColor: '#e2e8f0',
                                bodyColor: '#a0aec0',
                                borderColor: '#2d3748',
                                borderWidth: 1,
                                padding: 12,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += '$' + context.parsed.y.toLocaleString('es-CO') + ' COP';
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(45, 55, 72, 0.5)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#a0aec0',
                                    font: {
                                        size: 11
                                    },
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('es-CO');
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#a0aec0',
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        }
                    }
                });
            },
            
            groupByMonth(transactions) {
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                // Si es mes actual, agrupar por día en lugar de por mes
                if (this.currentPeriod === 'current-month') {
                    return this.groupByDay(transactions);
                }
                
                const monthlyData = {};
                
                // Determinar el rango de meses según el período actual
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-11
                
                let startDate, endDate;
                
                switch(this.currentPeriod) {
                    case 'last-3-months':
                        // Últimos 3 meses (incluyendo el actual)
                        startDate = new Date(currentYear, currentMonth - 2, 1);
                        endDate = new Date(currentYear, currentMonth, 1);
                        break;
                    case 'last-6-months':
                        // Últimos 6 meses (incluyendo el actual)
                        startDate = new Date(currentYear, currentMonth - 5, 1);
                        endDate = new Date(currentYear, currentMonth, 1);
                        break;
                    case 'current-year':
                        // Todo el año actual
                        startDate = new Date(currentYear, 0, 1);
                        endDate = new Date(currentYear, currentMonth, 1);
                        break;
                    case 'all':
                    default:
                        // Determinar rango basado en las transacciones
                        if (transactions.length === 0) {
                            // Si no hay transacciones, mostrar el mes actual
                            startDate = new Date(currentYear, currentMonth, 1);
                            endDate = new Date(currentYear, currentMonth, 1);
                        } else {
                            // Encontrar la fecha más antigua
                            const dates = transactions.map(t => new Date(t.transaction_date + 'T00:00:00'));
                            const minDate = new Date(Math.min(...dates));
                            startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                            // Hasta el mes actual
                            endDate = new Date(currentYear, currentMonth, 1);
                        }
                        break;
                }
                
                // Inicializar todos los meses en el rango con valores en 0
                const tempDate = new Date(startDate);
                while (tempDate <= endDate) {
                    const year = tempDate.getFullYear();
                    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
                    const monthKey = `${year}-${month}`;
                    monthlyData[monthKey] = { income: 0, expenses: 0 };
                    tempDate.setMonth(tempDate.getMonth() + 1);
                }
                
                // Agrupar transacciones por mes
                transactions.forEach(t => {
                    const month = t.transaction_month; // Ya viene como "YYYY-MM" del backend
                    if (monthlyData[month]) {
                        if (t.type === 'income') {
                            monthlyData[month].income += parseFloat(t.amount);
                        } else {
                            monthlyData[month].expenses += parseFloat(t.amount);
                        }
                    }
                });
                
                // Ordenar por fecha y formatear
                const sortedMonths = Object.keys(monthlyData).sort();
                const labels = sortedMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
                });
                
                const income = sortedMonths.map(month => monthlyData[month].income);
                const expenses = sortedMonths.map(month => monthlyData[month].expenses);
                
                return { labels, income, expenses };
            },
            
            groupByDay(transactions) {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                const currentDay = now.getDate();
                
                // Crear un objeto para almacenar datos por día
                const dailyData = {};
                
                // PASO 1: Encontrar el día máximo entre HOY y el último día con transacciones
                let maxDay = currentDay;
                
                transactions.forEach(t => {
                    const txDate = new Date(t.transaction_date + 'T00:00:00');
                    const txYear = txDate.getFullYear();
                    const txMonth = txDate.getMonth();
                    
                    // Solo considerar transacciones del mes y año actual
                    if (txYear === currentYear && txMonth === currentMonth) {
                        const txDay = txDate.getDate();
                        if (txDay > maxDay) {
                            maxDay = txDay; // Extender hasta el día con transacciones
                        }
                    }
                });
                
                // PASO 2: Inicializar todos los días desde el 1 hasta el día máximo
                for (let day = 1; day <= maxDay; day++) {
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    dailyData[dateKey] = { income: 0, expenses: 0 };
                }
                
                // PASO 3: Llenar los datos con las transacciones del mes actual
                transactions.forEach(t => {
                    const txDate = new Date(t.transaction_date + 'T00:00:00');
                    const txYear = txDate.getFullYear();
                    const txMonth = txDate.getMonth();
                    
                    // Solo procesar transacciones del mes y año actual
                    if (txYear === currentYear && txMonth === currentMonth) {
                        const date = t.transaction_date; // Formato YYYY-MM-DD
                        
                        // Agregar la transacción al día correspondiente
                        if (dailyData[date]) {
                            if (t.type === 'income') {
                                dailyData[date].income += parseFloat(t.amount);
                            } else {
                                dailyData[date].expenses += parseFloat(t.amount);
                            }
                        }
                    }
                });
                
                // PASO 4: Ordenar los días y formatear para la gráfica
                const sortedDays = Object.keys(dailyData).sort();
                
                // Formatear labels (solo mostrar el número del día)
                const labels = sortedDays.map(date => {
                    const [year, month, day] = date.split('-');
                    return `${parseInt(day)}`;
                });
                
                // Extraer arrays de ingresos y gastos
                const income = sortedDays.map(date => dailyData[date].income);
                const expenses = sortedDays.map(date => dailyData[date].expenses);
                
                console.log('📊 Datos diarios generados:', {
                    period: 'Mes actual',
                    totalDays: sortedDays.length,
                    rangoFinal: `Día 1 hasta día ${maxDay}`,
                    labels: labels,
                    income: income,
                    expenses: expenses,
                    currentDay: currentDay,
                    maxDay: maxDay
                });
                
                return { labels, income, expenses };
            },
            
            updateStats(transactions) {
                const income = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
                const expenses = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
                const balance = income - expenses;
                
                const incomeCount = transactions.filter(t => t.type === 'income').length;
                const expenseCount = transactions.filter(t => t.type === 'expense').length;
                
                // Actualizar valores
                const balanceEl = document.getElementById('balance-value');
                const incomeEl = document.getElementById('income-value');
                const expenseEl = document.getElementById('expense-value');
                const totalEl = document.getElementById('total-transactions');
                
                if (balanceEl) balanceEl.textContent = this.formatCurrency(balance);
                if (incomeEl) incomeEl.textContent = this.formatCurrency(income);
                if (expenseEl) expenseEl.textContent = this.formatCurrency(expenses);
                if (totalEl) totalEl.textContent = transactions.length;
                
                // Actualizar contadores
                const incomeCountEl = document.getElementById('income-count');
                const expenseCountEl = document.getElementById('expense-count');
                
                if (incomeCountEl) incomeCountEl.textContent = `${incomeCount} transacciones`;
                if (expenseCountEl) expenseCountEl.textContent = `${expenseCount} transacciones`;
                
                // Actualizar tendencia del balance
                const trendElement = document.getElementById('balance-trend');
                if (trendElement) {
                    if (balance > 0) {
                        trendElement.innerHTML = '<i class="fas fa-arrow-up"></i> Positivo';
                        trendElement.className = 'stat-trend positive';
                    } else if (balance < 0) {
                        trendElement.innerHTML = '<i class="fas fa-arrow-down"></i> Negativo';
                        trendElement.className = 'stat-trend negative';
                    } else {
                        trendElement.innerHTML = '';
                        trendElement.className = 'stat-trend';
                    }
                }
            },
            
            updateDoughnutChart(transactions) {
                const canvas = document.getElementById('categoryDoughnutChart');
                const noExpensesMsg = document.getElementById('no-expenses-message');
                const chartWrapper = document.getElementById('doughnut-chart-wrapper');
                
                if (!canvas) return;
                
                if (this.doughnutChart) {
                    this.doughnutChart.destroy();
                }
                
                const expenses = transactions.filter(t => t.type === 'expense');
                
                if (expenses.length === 0) {
                    if (chartWrapper) chartWrapper.style.display = 'none';
                    if (noExpensesMsg) noExpensesMsg.style.display = 'block';
                    return;
                }
                
                if (chartWrapper) chartWrapper.style.display = 'block';
                if (noExpensesMsg) noExpensesMsg.style.display = 'none';
                
                // Agrupar gastos por categoría
                const categoryData = {};
                expenses.forEach(t => {
                    const categoryName = t.category_name || 'Sin categoría';
                    if (!categoryData[categoryName]) {
                        categoryData[categoryName] = 0;
                    }
                    categoryData[categoryName] += parseFloat(t.amount);
                });
                
                // Ordenar por monto descendente
                const sortedCategories = Object.entries(categoryData)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8); // Top 8 categorías
                
                const labels = sortedCategories.map(([name]) => name);
                const data = sortedCategories.map(([, amount]) => amount);
                
                // Colores vibrantes para el gráfico
                const colors = [
                    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                ];
                
                const ctx = canvas.getContext('2d');
                this.doughnutChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderColor: '#1a202c',
                            borderWidth: 3,
                            hoverOffset: 15
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: '#e2e8f0',
                                    font: { size: 11, weight: '600' },
                                    padding: 15,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 15, 27, 0.95)',
                                titleColor: '#e2e8f0',
                                bodyColor: '#a0aec0',
                                borderColor: '#2d3748',
                                borderWidth: 1,
                                padding: 12,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: $${value.toLocaleString('es-CO')} COP (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '65%',
                        animation: { animateRotate: true, animateScale: true }
                    }
                });
            },
            
            checkSpendingAlert(transactions) {
                const alertContainer = document.getElementById('spending-alert');
                const alertMessage = document.getElementById('alert-message');
                const closeAlertBtn = document.getElementById('close-alert');
                
                if (!alertContainer || !alertMessage) return;
                
                const income = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
                const expenses = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
                const alertClosed = sessionStorage.getItem('alert_closed');
                
                if (income > 0 && expenses > 0 && !alertClosed) {
                    const percentage = (expenses / income) * 100;
                    
                    if (percentage >= 80) {
                        const formattedPercentage = percentage.toFixed(1);
                        alertMessage.textContent = `Has gastado ${formattedPercentage}% de tus ingresos. Te recomendamos revisar tus gastos para mantener un balance saludable.`;
                        alertContainer.style.display = 'flex';
                        
                        if (closeAlertBtn && !closeAlertBtn.hasAttribute('data-listener')) {
                            closeAlertBtn.setAttribute('data-listener', 'true');
                            closeAlertBtn.addEventListener('click', () => {
                                alertContainer.style.display = 'none';
                                sessionStorage.setItem('alert_closed', 'true');
                            });
                        }
                    } else {
                        alertContainer.style.display = 'none';
                    }
                } else if (alertClosed) {
                    alertContainer.style.display = 'none';
                }
            },
            
            formatCurrency(amount) {
                return `$${parseFloat(amount).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })} COP`;
            }
        };

        // --- Listeners de Animaciones y UI ---
        if (registerBtn) registerBtn.addEventListener('click', () => {
            container.classList.add("active");
            animationSystem.addMicroBounce(registerBtn);
        });
        
        if (loginBtn) loginBtn.addEventListener('click', () => {
            container.classList.remove("active");
            animationSystem.addMicroBounce(loginBtn);
        });
        
        if (container) {
            container.addEventListener('mousemove', (event) => {
                const rect = container.getBoundingClientRect();
                container.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
                container.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
            });
        }
        
        allButtons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                const rect = button.getBoundingClientRect();
                button.style.setProperty('--pulse-x', `${e.clientX - rect.left}px`);
                button.style.setProperty('--pulse-y', `${e.clientY - rect.top}px`);
            });
        });

        // --- Listeners de Navegación ---
        if (logoutButton) logoutButton.addEventListener('click', logout);

        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const currentActiveView = document.querySelector('.view:not(.hidden)');
                    const targetView = document.getElementById(item.dataset.view);

                    if (currentActiveView && currentActiveView !== targetView) {
                        currentActiveView.classList.add('hidden');
                    }
                    if (targetView) {
                        targetView.classList.remove('hidden');
                    }

                    menuItems.forEach(menu => menu.classList.remove('active'));
                    item.classList.add('active');
                    animationSystem.addMicroBounce(item);
                    
                    if (item.dataset.view === 'view-dashboard' && isLoggedIn()) {
                        dashboardModule.loadDashboard();
                    }
                });
            });
            const initialView = document.querySelector('.menu-item[data-view="view-dashboard"]');
            if(initialView && isLoggedIn()) {
                 views.forEach(v => v.classList.add('hidden'));
                 document.getElementById(initialView.dataset.view).classList.remove('hidden');
                 initialView.classList.add('active');
                 dashboardModule.loadDashboard();
            }
        }

        // --- Debounced search para optimizar rendimiento ---
        const debouncedSearch = debounce((value) => {
            appState.updateFilters({ search: value });
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        }, 300);

        // --- Listeners del selector de período ---
        const periodSelector = document.getElementById('period-selector');
        const refreshDashboardBtn = document.getElementById('refresh-dashboard');

        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                dashboardModule.loadDashboard(e.target.value);
            });
        }

        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => {
                const period = periodSelector ? periodSelector.value : 'current-month';
                animationSystem.addMicroBounce(refreshDashboardBtn);
                dashboardModule.loadDashboard(period);
                showNotification('Dashboard actualizado', 'success');
            });
        }

        // --- Listeners de filtros ---
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ category: e.target.value });
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        });

        document.getElementById('type-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ type: e.target.value });
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        });

        document.getElementById('month-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ month: e.target.value });
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        });

        document.getElementById('transaction-date-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ transactionDate: e.target.value });
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        });

        document.getElementById('clear-filters')?.addEventListener('click', () => {
            appState.updateFilters({ search: '', category: '', type: '', month: '', transactionDate: '' });
            document.getElementById('search-input').value = '';
            document.getElementById('category-filter').value = '';
            document.getElementById('type-filter').value = '';
            document.getElementById('month-filter').value = '';
            document.getElementById('transaction-date-filter').value = '';
            appState.applyFilters();
            renderPaginatedTransactions(appState.filteredTransactions);
        });

        // --- Lógica de Formularios y Modal ---
        const handleAuthFormSubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            const submitButton = form.querySelector('button[type="submit"]');
            if (validateForm(form)) {
                const data = Object.fromEntries(new FormData(form).entries());
                submitButton.classList.add('loading');
                try {
                    if (form.id === 'registerForm') {
                        const result = await api.register(data.name, data.email, data.password);
                        showNotification(result.message, 'success');
                        animationSystem.addSuccessPulse(submitButton);
                        setTimeout(() => loginBtn.click(), 1000);
                    } else {
                        const result = await api.login(data.email, data.password);
                        if (result.access_token) {
                            saveToken(result.access_token);
                            showNotification('Inicio de sesión exitoso.', 'success');
                            animationSystem.addSuccessPulse(submitButton);
                            setTimeout(showDashboard, 1000);
                        } else {
                            throw new Error('No se recibió el token de acceso');
                        }
                    }
                    form.reset();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    submitButton.classList.remove('loading');
                }
            } else {
                showNotification('Ingresa correctamente los datos.', 'error');
            }
        };

        if (registerForm) registerForm.addEventListener('submit', handleAuthFormSubmit);
        if (loginForm) loginForm.addEventListener('submit', handleAuthFormSubmit);
        
        // Handler para el modo demo
        const handleDemoMode = async () => {
            const demoButtons = document.querySelectorAll('#demoModeBtn, #demoModeBtn2, #demoModeBtn3');
            demoButtons.forEach(btn => {
                if (btn) btn.classList.add('loading');
            });
            
            try {
                const response = await fetch(`${BASE_URL}/demo/access`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await handleResponse(response);
                
                if (data.access_token) {
                    saveToken(data.access_token);
                    showNotification(data.message || '¡Bienvenido al modo demo!', 'success');
                    setTimeout(showDashboard, 1000);
                } else {
                    throw new Error('No se pudo acceder al modo demo');
                }
            } catch (error) {
                showNotification(error.message || 'Error al acceder al modo demo', 'error');
            } finally {
                demoButtons.forEach(btn => {
                    if (btn) btn.classList.remove('loading');
                });
            }
        };
        
        // Event listeners para botones de demo
        const demoBtns = document.querySelectorAll('#demoModeBtn, #demoModeBtn2, #demoModeBtn3');
        demoBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', handleDemoMode);
        });
        
        const openModal = (modal) => { if (modal) modal.classList.add('show'); };
        const closeModal = (modal) => { if (modal) modal.classList.remove('show'); };

        if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openModal(categoryModal));
        if (closeCategoryModalBtn) closeCategoryModalBtn.addEventListener('click', () => closeModal(categoryModal));
        if (categoryModal) categoryModal.addEventListener('click', (e) => { if (e.target === categoryModal) closeModal(categoryModal); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && categoryModal.classList.contains('show')) closeModal(categoryModal); });

        document.getElementById('cancel-category-btn')?.addEventListener('click', () => closeModal(categoryModal));

        if (categoryForm) {
            categoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('category-name');
                const submitButton = categoryForm.querySelector('button[type="submit"]');
                
                nameInput.classList.remove('input-error');
                categoryForm.querySelectorAll('.error-message').forEach(el => el.remove());
                
                if (nameInput.value.trim()) {
                    const uniqueError = validators.uniqueCategory(appState.categories)(nameInput.value);
                    if (uniqueError) {
                        nameInput.classList.add('input-error');
                        const errorElement = document.createElement('div');
                        errorElement.className = 'error-message';
                        errorElement.textContent = uniqueError;
                        nameInput.parentElement.appendChild(errorElement);
                        showNotification(uniqueError, 'error');
                        return;
                    }
                    
                    submitButton.classList.add('loading');
                    try {
                        await api.createCategory(nameInput.value.trim());
                        showNotification('Categoría creada.', 'success');
                        animationSystem.addSuccessPulse(submitButton);
                        nameInput.value = '';
                        initDashboard();
                        closeModal(categoryModal);
                    } catch (error) {
                        showNotification(error.message, 'error');
                    } finally {
                        submitButton.classList.remove('loading');
                    }
                } else {
                    nameInput.classList.add('input-error');
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = 'El nombre es obligatorio';
                    nameInput.parentElement.appendChild(errorElement);
                    showNotification('El nombre es obligatorio', 'error');
                }
            });
        }
        
        let editingTransactionId = null; 
        if (transactionForm) {
            transactionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = transactionForm.querySelector('button[type="submit"]');
                const formData = {
                    description: document.getElementById('description').value,
                    amount: document.getElementById('amount').value,
                    type: document.getElementById('type').value,
                    category_id: categorySelect.value,
                    transaction_date: document.getElementById('transaction-date').value,
                };
                
                submitButton.classList.add('loading');
                try {
                    if (appState.ui.editingTransactionId) {
                        await api.updateTransaction(appState.ui.editingTransactionId, formData);
                        showNotification('Transacción actualizada.', 'success');
                    } else {
                        await api.createTransaction(formData);
                        showNotification('Transacción creada.', 'success');
                    }
                    animationSystem.addSuccessPulse(submitButton);
                    transactionForm.reset();
                    appState.ui.editingTransactionId = null;
                    if (transactionFormTitle) transactionFormTitle.textContent = 'Nueva Transacción';
                    submitButton.textContent = 'Añadir Transacción';
                    initDashboard();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    submitButton.classList.remove('loading');
                }
            });
        }
        
        const handleTableClick = async (e) => {
            const target = e.target.closest('.action-btn');
            if (!target) return;

            const id = target.dataset.id;
            const row = target.closest('tr');
            const isTransactionTable = target.closest('.transactions-table');
            const isCategoryTable = target.closest('.category-table');

            if (isTransactionTable) {
                if (target.classList.contains('delete-btn')) {
                    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
                        row.style.transform = 'translateX(-100%) scale(0.8)';
                        row.style.opacity = '0';
                        row.style.transition = 'all 0.5s ease-out';
                        try {
                            await api.deleteTransaction(id);
                            showNotification('Transacción eliminada.', 'success');
                            setTimeout(() => initDashboard(), 500);
                        } catch (error) { 
                            showNotification(error.message, 'error');
                            row.style.transform = 'translateX(0) scale(1)';
                            row.style.opacity = '1';
                        }
                    }
                } else if (target.classList.contains('edit-btn')) {
                    target.classList.add('loading');
                    try {
                        const tx = await api.getTransactionById(id);
                        document.getElementById('description').value = tx.description;
                        document.getElementById('amount').value = tx.amount;
                        document.getElementById('type').value = tx.type;
                        document.getElementById('category').value = tx.category_id;
                        const dateInput = document.getElementById('transaction-date');
                        if (dateInput && tx.transaction_date) {
                            dateInput.value = tx.transaction_date;
                        }
                        if (transactionFormTitle) transactionFormTitle.textContent = 'Editar Transacción';
                        const submitButton = transactionForm.querySelector('button[type="submit"]');
                        submitButton.textContent = 'Guardar Cambios';
                        appState.ui.editingTransactionId = id;
                        animationSystem.addMicroBounce(target);
                        document.querySelector('.menu-item[data-view="view-add-unified"]')?.click();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    } finally {
                        target.classList.remove('loading');
                    }
                }
            }

            if (isCategoryTable) {
                if (target.classList.contains('delete-cat-btn')) {
                    if (confirm('¿Seguro que quieres eliminar esta categoría? (Esto fallará si tiene transacciones asociadas)')) {
                        row.style.transform = 'translateX(-100%) scale(0.8)';
                        row.style.opacity = '0';
                        row.style.transition = 'all 0.5s ease-out';
                        try {
                            await api.deleteCategory(id);
                            showNotification('Categoría eliminada.', 'success');
                            setTimeout(() => initDashboard(), 500);
                        } catch (error) { 
                            showNotification(error.message, 'error');
                            row.style.transform = 'translateX(0) scale(1)';
                            row.style.opacity = '1';
                        }
                    }
                } else if (target.classList.contains('edit-cat-btn')) {
                    const currentName = target.closest('tr').querySelector('td').textContent;
                    editCategoryIdInput.value = id;
                    editCategoryNameInput.value = currentName;
                    openModal(editCategoryModal);
                    animationSystem.addMicroBounce(target);
                }
            }
        };

        document.body.addEventListener('click', handleTableClick);

        if (editCategoryModal) {
            editCategoryModal.addEventListener('click', (e) => { if (e.target === editCategoryModal) closeModal(editCategoryModal); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editCategoryModal.classList.contains('show')) closeModal(editCategoryModal); });
        }

        if (closeEditCategoryModalBtn) {
            closeEditCategoryModalBtn.addEventListener('click', () => closeModal(editCategoryModal));
        }

        if (editCategorySubmitBtn) {
            editCategorySubmitBtn.addEventListener('click', async () => {
                const id = editCategoryIdInput.value;
                const newName = editCategoryNameInput.value.trim();
                
                editCategoryNameInput.classList.remove('input-error');
                editCategoryModal.querySelectorAll('.error-message').forEach(el => el.remove());
                
                if (!newName) {
                    editCategoryNameInput.classList.add('input-error');
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = 'El nombre no puede estar vacío';
                    editCategoryNameInput.parentElement.appendChild(errorElement);
                    showNotification('El nombre no puede estar vacío', 'error');
                    return;
                }

                const currentName = document.querySelector(`tr[data-id="${id}"] td:first-child`).textContent;
                
                if (newName.toLowerCase() === currentName.toLowerCase()) {
                    closeModal(editCategoryModal);
                    return;
                }

                const uniqueError = validators.uniqueCategoryEdit(appState.categories, id)(newName);
                if (uniqueError) {
                    editCategoryNameInput.classList.add('input-error');
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = uniqueError;
                    editCategoryNameInput.parentElement.appendChild(errorElement);
                    showNotification(uniqueError, 'error');
                    return;
                }

                const submitButton = editCategorySubmitBtn;
                submitButton.classList.add('loading');
                try {
                    await api.updateCategory(id, newName);
                    appState.updateCategoryName(id, newName);
                    showNotification('Categoría actualizada.', 'success');
                    animationSystem.addSuccessPulse(submitButton);
                    closeModal(editCategoryModal);
                    renderCategoriesForSelect(appState.categories);
                    populateCategoryFilter(appState.categories);
                    renderPaginatedTransactions(appState.filteredTransactions);
                    renderPaginatedCategories(appState.categories);
                    
                    // Actualizar SOLO el gráfico de dona en tiempo real con los datos del estado local
                    const currentPeriod = document.getElementById('period-selector')?.value || 'all';
                    const filteredTransactions = dashboardModule.filterByPeriod(appState.transactions, currentPeriod);
                    dashboardModule.updateDoughnutChart(filteredTransactions);
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    submitButton.classList.remove('loading');
                }
            });
        }

        let konamiCode = [];
        const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.code);
            konamiCode = konamiCode.slice(-10);
            if (konamiCode.join('') === konamiSequence.join('')) {
                document.body.style.transition = 'filter 1s';
                document.body.style.filter = 'hue-rotate(360deg)';
                showNotification('Código Konami activado', 'success');
                setTimeout(() => document.body.style.filter = '', 1000);
            }
            if (!document.body.classList.contains('dashboard-active')) return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'n') {
                    e.preventDefault();
                    document.querySelector('.menu-item[data-view="view-add-unified"]')?.click();
                    setTimeout(() => document.getElementById('description')?.focus(), 100);
                } else if (e.key === 'l') {
                    e.preventDefault();
                    document.querySelector('.menu-item[data-view="view-transactions-list"]')?.click();
                }
            }
        });

        console.log(`🚀 Expense Tracker - Dashboard activo`);
    });
})();