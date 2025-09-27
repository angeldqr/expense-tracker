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
        window.location.reload();
    };
    
    const handleResponse = async (response) => {
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 && data.msg === "Token has expired") { 
                showNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
                setTimeout(logout, 2000);
            }
            throw new Error(data.error || data.message || 'Error desconocido.');
        }
        return data;
    };

    const api = {
        login: (email, password) => fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, password }) }).then(handleResponse),
        register: (name, email, password) => fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, email, password }) }).then(handleResponse),
        getCategories: () => fetch(`${BASE_URL}/categories/`, { headers: getAuthHeader() }).then(handleResponse),
        createCategory: (name) => fetch(`${BASE_URL}/categories/`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ name }) }).then(handleResponse),
        updateCategory: (id, name) => fetch(`${BASE_URL}/categories/${id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify({ name }) }).then(handleResponse),
        deleteCategory: (id) => fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeader() }).then(handleResponse),
        getTransactions: () => fetch(`${BASE_URL}/transactions/`, { headers: getAuthHeader() }).then(handleResponse),
        getTransactionById: (id) => fetch(`${BASE_URL}/transactions/${id}`, { headers: getAuthHeader() }).then(handleResponse),
        createTransaction: (data) => fetch(`${BASE_URL}/transactions/`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify(data) }).then(handleResponse),
        updateTransaction: (id, data) => fetch(`${BASE_URL}/transactions/${id}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify(data) }).then(handleResponse),
        deleteTransaction: (id) => fetch(`${BASE_URL}/transactions/${id}`, { method: 'DELETE', headers: getAuthHeader() }).then(handleResponse)
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
                .skeleton-cell:nth-child(1) { width: 30%; } .skeleton-cell:nth-child(2) { width: 20%; } .skeleton-cell:nth-child(3) { width: 15%; } .skeleton-cell:nth-child(4) { width: 25%; }
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
    // FUNCIONES DE UI (VALIDACIÓN, NOTIFICACIONES, ETC.)
    // =================================================================
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!input.value.trim()) {
                error = 'Este campo es obligatorio.';
            } else if (input.type === 'email' && !emailRegex.test(input.value)) {
                error = 'Por favor, introduce un email válido.';
            } else if (input.type === 'password' && form.id === 'registerForm' && input.value.length < 8) {
                error = 'La contraseña debe tener al menos 8 caracteres.';
            }
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
    const showSkeletonLoader = (container, rows = 5, cells = 4) => {
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
            showSkeletonLoader(transactionsList, transactions.length || 5, 4);
            
            setTimeout(() => {
                transactionsList.innerHTML = '';
                if (transactions.length === 0) {
                    transactionsList.innerHTML = '<p>No tienes transacciones registradas.</p>';
                } else {
                    const table = document.createElement('table');
                    table.className = 'transactions-table';
                    table.innerHTML = `
                        <thead><tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Acciones</th></tr></thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr data-id="${t.id}">
                                    <td>${t.description}</td>
                                    <td class="amount ${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})} COP</td>
                                    <td>
                                        <span class="type-tag type-${t.type}">
                                            ${t.type === 'income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="action-btn edit-btn" data-id="${t.id}">Editar</button>
                                        <button class="action-btn delete-btn" data-id="${t.id}">Borrar</button>
                                    </td>
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
                const [categories, transactions] = await Promise.all([api.getCategories(), api.getTransactions()]);
                renderCategoriesForSelect(categories);
                renderCategoryList(categories);
                renderTransactions(transactions);
            } catch (error) {
                showNotification(error.message, 'error');
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
                if (nameInput.value.trim()) {
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
                    if (editingTransactionId) {
                        await api.updateTransaction(editingTransactionId, formData);
                        showNotification('Transacción actualizada.', 'success');
                    } else {
                        await api.createTransaction(formData);
                        showNotification('Transacción creada.', 'success');
                    }
                    animationSystem.addSuccessPulse(submitButton);
                    transactionForm.reset();
                    editingTransactionId = null;
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
        
        // --- Manejo de clics en las tablas (Refactorizado) ---
        const handleTableClicks = (container, actions) => {
            if (!container) return;
            container.addEventListener('click', async (e) => {
                const target = e.target.closest('.action-btn');
                if (!target) return;

                const id = target.dataset.id;
                const row = target.closest('tr');

                if (target.classList.contains(actions.deleteClass)) {
                    if (confirm(actions.deleteConfirm)) {
                        row.style.transform = 'translateX(-100%) scale(0.8)';
                        row.style.opacity = '0';
                        row.style.transition = 'all 0.5s ease-out';
                        try {
                            await actions.deleteApi(id);
                            showNotification(actions.deleteSuccess, 'success');
                            setTimeout(() => initDashboard(), 500);
                        } catch (error) { 
                            showNotification(error.message, 'error');
                            row.style.transform = 'translateX(0) scale(1)';
                            row.style.opacity = '1';
                        }
                    }
                } else if (target.classList.contains(actions.editClass)) {
                    actions.editAction(id, target);
                }
            });
        };

        handleTableClicks(transactionsList, {
            deleteClass: 'delete-btn',
            editClass: 'edit-btn',
            deleteConfirm: '¿Estás seguro de que quieres eliminar esta transacción?',
            deleteApi: api.deleteTransaction,
            deleteSuccess: 'Transacción eliminada.',
            editAction: async (id, target) => {
                target.classList.add('loading');
                try {
                    const tx = await api.getTransactionById(id);
                    document.getElementById('description').value = tx.description;
                    document.getElementById('amount').value = tx.amount;
                    document.getElementById('type').value = tx.type;
                    document.getElementById('category').value = tx.category_id;
                    if (transactionFormTitle) transactionFormTitle.textContent = 'Editar Transacción';
                    transactionForm.querySelector('button').textContent = 'Guardar Cambios';
                    editingTransactionId = id;
                    animationSystem.addMicroBounce(target);
                    document.querySelector('.menu-item[data-view="view-add-unified"]')?.click();
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    target.classList.remove('loading');
                }
            }
        });

        handleTableClicks(categoryList, {
            deleteClass: 'delete-cat-btn',
            editClass: 'edit-cat-btn',
            deleteConfirm: '¿Seguro que quieres eliminar esta categoría? (Esto fallará si tiene transacciones asociadas)',
            deleteApi: api.deleteCategory,
            deleteSuccess: 'Categoría eliminada.',
            editAction: (id, target) => {
                const currentName = target.closest('tr').querySelector('td').textContent;
                const newName = prompt('Introduce el nuevo nombre para la categoría:', currentName);
                if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
                    target.classList.add('loading');
                    api.updateCategory(id, newName.trim())
                        .then(() => {
                            showNotification('Categoría actualizada.', 'success');
                            animationSystem.addSuccessPulse(target);
                            initDashboard();
                        })
                        .catch(error => showNotification(error.message, 'error'))
                        .finally(() => target.classList.remove('loading'));
                }
            }
        });

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