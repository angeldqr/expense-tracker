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
            if (response.status === 401) { logout(); }
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
    // TUS FUNCIONES ORIGINALES (VALIDACIÓN, NOTIFICACIONES, ESTILOS)
    // =================================================================
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .notification { position: fixed; bottom: -100px; left: 50%; transform: translateX(-50%); padding: 16px 30px; border-radius: 50px; color: #fff; font-weight: 600; z-index: 9999; transition: bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: rgba(2, 62, 138, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
            .notification.show { bottom: 40px; }
            .notification.success { background: rgba(0, 180, 216, 0.5); }
            .notification.error { background: rgba(229, 56, 59, 0.5); }
            .input-error { border-color: #f43f5e !important; box-shadow: 0 0 15px #f43f5e !important; }
            .error-message { color: #f43f5e; font-size: 14px; text-align: left; width: 100%; padding-left: 25px; margin-top: 8px; margin-bottom: 5px; opacity: 0; transform: translateY(-10px); animation: fade-in-error 0.3s forwards; }
            @keyframes fade-in-error { to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    };

    const showNotification = (message, type = 'success') => {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        requestAnimationFrame(() => { notification.classList.add('show'); });
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
    // EL CEREBRO PRINCIPAL QUE UNE TODO
    // =================================================================
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();

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
        const transactionFormTitle = document.querySelector('#view-add-transaction h2');
        
        // --- Lógica de Renderizado ---
        const renderCategoriesForSelect = (categories = []) => {
             if (!categorySelect) return;
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
            }
        };
        const renderCategoryList = (categories = []) => {
            if (!categoryList) return;
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
            }
        };
        const renderTransactions = (transactions = []) => {
            if (!transactionsList) return;
            transactionsList.innerHTML = '';
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<p>No tienes transacciones registradas.</p>';
            } else {
                const table = document.createElement('table');
                table.className = 'transactions-table';
                table.innerHTML = `<thead><tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Acciones</th></tr></thead><tbody>
                        ${transactions.map(t => `<tr data-id="${t.id}">
                                <td>${t.description}</td>
                                <td class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toFixed(2)}</td>
                                <td>${t.type}</td>
                                <td>
                                    <button class="action-btn edit-btn" data-id="${t.id}">Editar</button>
                                    <button class="action-btn delete-btn" data-id="${t.id}">Borrar</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>`;
                transactionsList.appendChild(table);
            }
        };

        // --- Lógica Principal del Dashboard ---
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
            initDashboard();
        };
        const showAuth = () => {
            authView.style.display = 'block';
            dashboardView.style.display = 'none';
            document.body.classList.remove('dashboard-active');
        };

        if (isLoggedIn()) { showDashboard(); } else { showAuth(); }

        // --- Listeners de Animaciones ---
        if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add("active"));
        if (loginBtn) loginBtn.addEventListener('click', () => container.classList.remove("active"));
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

        // --- Listeners de Navegación y Formularios ---
        if (logoutButton) logoutButton.addEventListener('click', logout);
        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetViewId = item.dataset.view;
                    views.forEach(view => view.style.display = 'none');
                    menuItems.forEach(menu => menu.classList.remove('active'));
                    const targetView = document.getElementById(targetViewId);
                    if (targetView) {
                        targetView.style.display = 'block';
                        item.classList.add('active');
                    }
                });
            });
            if (document.querySelector('.menu-item[data-view="view-transactions-list"]')) {
                document.querySelector('.menu-item[data-view="view-transactions-list"]').click();
            }
        }
        const handleAuthFormSubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            if (validateForm(form)) {
                const data = Object.fromEntries(new FormData(form).entries());
                try {
                    if (form.id === 'registerForm') {
                        const result = await api.register(data.name, data.email, data.password);
                        showNotification(result.message, 'success');
                        loginBtn.click();
                    } else {
                        const result = await api.login(data.email, data.password);
                        saveToken(result.access_token);
                        showNotification('Inicio de sesión exitoso.', 'success');
                        setTimeout(showDashboard, 1000);
                    }
                    form.reset();
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            } else {
                showNotification('Ingresa correctamente los datos.', 'error');
            }
        };
        if (registerForm) registerForm.addEventListener('submit', handleAuthFormSubmit);
        if (loginForm) loginForm.addEventListener('submit', handleAuthFormSubmit);
        if (categoryForm) {
            categoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('category-name');
                try {
                    await api.createCategory(nameInput.value);
                    showNotification('Categoría creada.', 'success');
                    nameInput.value = '';
                    initDashboard();
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            });
        }
        let editingTransactionId = null; 
        if (transactionForm) {
            transactionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    description: document.getElementById('description').value,
                    amount: document.getElementById('amount').value,
                    type: document.getElementById('type').value,
                    category_id: categorySelect.value,
                };
                try {
                    if (editingTransactionId) {
                        await api.updateTransaction(editingTransactionId, formData);
                        showNotification('Transacción actualizada.', 'success');
                    } else {
                        await api.createTransaction(formData);
                        showNotification('Transacción creada.', 'success');
                    }
                    transactionForm.reset();
                    editingTransactionId = null;
                    if (transactionFormTitle) transactionFormTitle.textContent = 'Nueva Transacción';
                    transactionForm.querySelector('button').textContent = 'Añadir Transacción';
                    initDashboard();
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            });
        }
        
        // --- LISTENER PARA ACCIONES DE LA TABLA DE TRANSACCIONES ---
        if (transactionsList) {
            transactionsList.addEventListener('click', async (e) => {
                const target = e.target;
                const id = target.dataset.id;
                if (target.classList.contains('delete-btn')) {
                    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
                        try {
                            await api.deleteTransaction(id);
                            showNotification('Transacción eliminada.', 'success');
                            initDashboard();
                        } catch (error) { showNotification(error.message, 'error'); }
                    }
                }
                if (target.classList.contains('edit-btn')) {
                    try {
                        const tx = await api.getTransactionById(id);
                        document.getElementById('description').value = tx.description;
                        document.getElementById('amount').value = tx.amount;
                        document.getElementById('type').value = tx.type;
                        document.getElementById('category').value = tx.category_id;
                        
                        if (transactionFormTitle) transactionFormTitle.textContent = 'Editar Transacción';
                        transactionForm.querySelector('button').textContent = 'Guardar Cambios';
                        editingTransactionId = id;
                        
                        document.querySelector('.menu-item[data-view="view-add-transaction"]').click();
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
            });
        }

        // --- LISTENER PARA ACCIONES DE LA TABLA DE CATEGORÍAS ---
        if (categoryList) {
            categoryList.addEventListener('click', async (e) => {
                const target = e.target;
                const id = target.dataset.id;
                if (target.classList.contains('delete-cat-btn')) {
                    if (confirm('¿Seguro que quieres eliminar esta categoría? (Esto fallará si tiene transacciones asociadas)')) {
                        try {
                            await api.deleteCategory(id);
                            showNotification('Categoría eliminada.', 'success');
                            initDashboard();
                        } catch (error) { showNotification(error.message, 'error'); }
                    }
                }
                if (target.classList.contains('edit-cat-btn')) {
                    const currentName = target.closest('tr').querySelector('td').textContent;
                    const newName = prompt('Introduce el nuevo nombre para la categoría:', currentName);
                    if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
                        try {
                            await api.updateCategory(id, newName.trim());
                            showNotification('Categoría actualizada.', 'success');
                            initDashboard();
                        } catch (error) { showNotification(error.message, 'error'); }
                    }
                }
            });
        }
    });
})();