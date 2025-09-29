(() => {
    'use strict';

    // =================================================================
    // MÓDULO INTERNO DE API Y AUTENTICACIÓN
    // =================================================================
    const BASE_URL = 'http://127.0.0.1:5000';
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
            const cacheKey = `${url}_${JSON.stringify(options)}`;
            
            // Verificar cache para GET requests
            if (useCache && (!options.method || options.method === 'GET')) {
                const cached = cache.get(cacheKey);
                if (cached) {
                    logger.log('info', 'Cache hit', { url });
                    return cached;
                }
            }

            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, options);
                    const data = await handleResponse(response);
                    
                    // Guardar en cache para GET requests exitosos
                    if (useCache && (!options.method || options.method === 'GET')) {
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
        getCategories: () => apiWithRetry.request(`${BASE_URL}/categories/`, { headers: getAuthHeader() }, 3, true),
        createCategory: (name) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ name }) }); },
        updateCategory: (id, name) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/${id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify({ name }) }); },
        deleteCategory: (id) => { cache.invalidate('categories'); return apiWithRetry.request(`${BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeader() }); },
        getTransactions: () => apiWithRetry.request(`${BASE_URL}/transactions/`, { headers: getAuthHeader() }, 3, true),
        getTransactionById: (id) => apiWithRetry.request(`${BASE_URL}/transactions/${id}`, { headers: getAuthHeader() }, 3, true),
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
        filters: { search: '', category: '', type: '', startDate: '', endDate: '' },
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
                const date = new Date(t.date);
                const matchesStartDate = !this.filters.startDate || 
                    date >= new Date(this.filters.startDate);
                const matchesEndDate = !this.filters.endDate || 
                    date <= new Date(this.filters.endDate);

                return matchesSearch && matchesCategory && matchesType && 
                       matchesStartDate && matchesEndDate;
            });
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
                    <span>Página ${currentPage} de ${totalPages}</span>
                    <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>SIGUIENTE</button>
                `;

                document.getElementById('prev-page')?.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPaginatedTransactions(applyFilters(transactions));
                    }
                });

                document.getElementById('next-page')?.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderPaginatedTransactions(applyFilters(transactions));
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
            showSkeletonLoader(transactionsList, transactions.length || 5, 5);
            
            setTimeout(() => {
                transactionsList.innerHTML = '';
                if (transactions.length === 0) {
                    transactionsList.innerHTML = '<p>No tienes transacciones registradas.</p>';
                } else {
                    const table = document.createElement('table');
                    table.className = 'transactions-table';
                    table.innerHTML = `
                        <thead><tr><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Acciones</th></tr></thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr data-id="${t.id}">
                                    <td>${t.category_name || 'Sin categoría'}</td>
                                    <td>${t.description}</td>
                                    <td class="amount ${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})} COP</td>
                                    <td><span class="type-tag type-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                                    <td><button class="action-btn edit-btn" data-id="${t.id}">Editar</button><button class="action-btn delete-btn" data-id="${t.id}">Borrar</button></td>
                                </tr>
                            `).join('')}
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
                
                // Aplicar filtros
                appState.applyFilters();
                
                // Renderizar UI
                renderCategoriesForSelect(categories);
                renderPaginatedCategories(categories);
                renderPaginatedTransactions(appState.filteredTransactions);
                
            } catch (error) {
                appState.setState({ ui: { ...appState.ui, loading: false } });
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
                });
            });
            const initialView = document.querySelector('.menu-item[data-view="view-transactions-list"]');
            if(initialView) {
                 views.forEach(v => v.classList.add('hidden'));
                 document.getElementById(initialView.dataset.view).classList.remove('hidden');
                 initialView.classList.add('active');
            }
        }

        // --- Debounced search para optimizar rendimiento ---
        const debouncedSearch = debounce((value) => {
            appState.updateFilters({ search: value });
            initDashboard();
        }, 300);

        // --- Listeners de filtros ---
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ category: e.target.value });
            initDashboard();
        });

        document.getElementById('type-filter')?.addEventListener('change', (e) => {
            appState.updateFilters({ type: e.target.value });
            initDashboard();
        });

        document.getElementById('start-date')?.addEventListener('change', (e) => {
            appState.updateFilters({ startDate: e.target.value });
            initDashboard();
        });

        document.getElementById('end-date')?.addEventListener('change', (e) => {
            appState.updateFilters({ endDate: e.target.value });
            initDashboard();
        });

        document.getElementById('clear-filters')?.addEventListener('click', () => {
            appState.updateFilters({ search: '', category: '', type: '', startDate: '', endDate: '' });
            document.getElementById('search-input').value = '';
            document.getElementById('category-filter').value = '';
            document.getElementById('type-filter').value = '';
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
            initDashboard();
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
                        saveToken(result.access_token);
                        showNotification('Inicio de sesión exitoso.', 'success');
                        animationSystem.addSuccessPulse(submitButton);
                        setTimeout(showDashboard, 1000);
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
        
        const openModal = (modal) => { if (modal) modal.classList.add('show'); };
        const closeModal = (modal) => { if (modal) modal.classList.remove('show'); };

        if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openModal(categoryModal));
        if (closeCategoryModalBtn) closeCategoryModalBtn.addEventListener('click', () => closeModal(categoryModal));
        if (categoryModal) categoryModal.addEventListener('click', (e) => { if (e.target === categoryModal) closeModal(categoryModal); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && categoryModal.classList.contains('show')) closeModal(categoryModal); });

        if (categoryForm) {
            categoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('category-name');
                const submitButton = categoryForm.querySelector('button[type="submit"]');
                
                // Limpiar errores previos
                nameInput.classList.remove('input-error');
                categoryForm.querySelectorAll('.error-message').forEach(el => el.remove());
                
                if (nameInput.value.trim()) {
                    // Validar nombre único
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
        
        // --- Manejo de clics en las tablas con Event Delegation (OPTIMIZADO) ---
        const handleTableClick = async (e) => {
            const target = e.target.closest('.action-btn');
            if (!target) return;

            const id = target.dataset.id;
            const row = target.closest('tr');
            const isTransactionTable = target.closest('.transactions-table');
            const isCategoryTable = target.closest('.category-table');

            // Manejar transacciones
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

            // Manejar categorías
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

        // Usar event delegation en lugar de múltiples listeners
        document.body.addEventListener('click', handleTableClick);

        // --- Editar Categoría (Nuevo Modal) ---
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
                
                // Limpiar errores previos
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
                
                // Verificar si el nombre cambió (comparación insensible a mayúsculas)
                if (newName.toLowerCase() === currentName.toLowerCase()) {
                    closeModal(editCategoryModal);
                    return;
                }

                // Validar nombre único (excluyendo la categoría actual)
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
                    showNotification('Categoría actualizada.', 'success');
                    animationSystem.addSuccessPulse(submitButton);
                    closeModal(editCategoryModal);
                    initDashboard();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    submitButton.classList.remove('loading');
                }
            });
        }

        // --- Easter egg y Atajos de Teclado ---
        let konamiCode = [];
        const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.code);
            konamiCode = konamiCode.slice(-10);
            if (konamiCode.join('') === konamiSequence.join('')) {
                document.body.style.transition = 'filter 1s';
                document.body.style.filter = 'hue-rotate(360deg)';
                showNotification('¡Código Konami activado! 🌈', 'success');
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

        console.log(`🚀 Expense Tracker - Atajos: Ctrl+N (Nuevo), Ctrl+L (Lista)`);
    });
})();