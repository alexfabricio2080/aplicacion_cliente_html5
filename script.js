// Estado de la aplicación
const app = {
    clients: [],
    jobs: [],
    events: [],
    filters: {
        materials: [],
        statuses: [],
        companies: []
    },
    currentClientId: null,
    currentJobId: null,
    currentEventId: null,
    currentFilterId: null,
    currentLightboxIndex: 0,
    currentLightboxFiles: [],
    currentView: 'month',
    currentDate: new Date(),
    databaseLoaded: false,
    confirmCallback: null,
    tempFiles: [], // Archivos temporales para trabajos nuevos
    editingFiles: [], // Archivos al editar un trabajo existente
    charts: {}, // Para almacenar las instancias de los gráficos
    reports: [], // Para almacenar los reportes generados
    reportsByDate: {} // Para almacenar reportes por fecha
};

// Variable para el zoom actual
let currentZoom = 1;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDatabase();
    setupEventListeners();
    renderClients();
    renderCalendar();
    renderReports();
    setupResponsive();
});

// Función para inicializar la aplicación
function initializeApp() {
    // Generar años para el selector del calendario
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Establecer mes actual en el selector
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.value = new Date().getMonth();
    
    // Inicializar filtros predeterminados
    app.filters.materials = [
        { id: 1, name: 'Acrílico' },
        { id: 2, name: 'Madera' },
        { id: 3, name: 'Rotulación' },
        { id: 4, name: 'Sublimación' },
        { id: 5, name: 'Impresión' }
    ];
    
    app.filters.statuses = [
        { id: 1, name: 'seguimiento' },
        { id: 2, name: 'cerrado' },
        { id: 3, name: 'pendiente' }
    ];
    
    // Actualizar selectores de filtros
    updateFilterSelects();
    
    // Crear eventos de ejemplo
    createSampleEvents();
}

// Función para cargar la base de datos
function loadDatabase() {
    // Intentar cargar desde localStorage primero
    const savedData = localStorage.getItem('clientManagementDatabase');
    
    if (savedData) {
        try {
            const database = JSON.parse(savedData);
            app.clients = database.clients || [];
            app.jobs = database.jobs || [];
            app.events = database.events || [];
            app.filters = database.filters || {
                materials: [],
                statuses: [],
                companies: []
            };
            app.reports = database.reports || [];
            app.reportsByDate = database.reportsByDate || {};
            
            // Actualizar selectores
            updateFilterSelects();
            updateCompanyFilter();
            
            app.databaseLoaded = true;
            showToast('Base de datos cargada correctamente', 'success');
        } catch (error) {
            console.error('Error al cargar la base de datos:', error);
        }
    }
}

// Función para guardar en localStorage
function saveToLocalStorage() {
    const database = {
        clients: app.clients,
        jobs: app.jobs,
        events: app.events,
        filters: app.filters,
        reports: app.reports,
        reportsByDate: app.reportsByDate,
        lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem('clientManagementDatabase', JSON.stringify(database));
}

// Función para configurar los event listeners
function setupEventListeners() {
    // Navegación de pestañas
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Botones de base de datos
    document.getElementById('newDatabaseBtn').addEventListener('click', createNewDatabase);
    document.getElementById('exportDatabaseBtn').addEventListener('click', exportDatabase);
    document.getElementById('importDatabaseBtn').addEventListener('click', () => {
        document.getElementById('databaseFileInput').click();
    });
    document.getElementById('databaseFileInput').addEventListener('change', loadDatabaseFile);
    
    // Botones de clientes
    document.getElementById('addClientBtn').addEventListener('click', openAddClientModal);
    document.getElementById('closeClientModal').addEventListener('click', closeClientModal);
    document.getElementById('cancelClientBtn').addEventListener('click', closeClientModal);
    document.getElementById('saveClientBtn').addEventListener('click', saveClient);
    document.getElementById('deleteClientBtn').addEventListener('click', deleteCurrentClient);
    document.getElementById('changeAvatarBtn').addEventListener('click', () => {
        document.getElementById('clientAvatarInput').click();
    });
    document.getElementById('clientAvatarInput').addEventListener('change', previewAvatar);
    
    // Botones de trabajos
    document.getElementById('addJobBtn').addEventListener('click', () => openAddJobModal(app.currentClientId));
    document.getElementById('closeJobModal').addEventListener('click', closeJobModal);
    document.getElementById('cancelJobBtn').addEventListener('click', closeJobModal);
    document.getElementById('saveJobBtn').addEventListener('click', saveJob);
    document.getElementById('addFileBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Botón para agregar archivo por URL
    document.getElementById('addFileByUrlBtn').addEventListener('click', addFileByUrl);
    
    // Botones de detalles del trabajo
    document.getElementById('closeJobDetailsModal').addEventListener('click', closeJobDetailsModal);
    document.getElementById('closeJobDetailsBtn').addEventListener('click', closeJobDetailsModal);
    document.getElementById('editJobBtn').addEventListener('click', editCurrentJob);
    document.getElementById('deleteJobBtn').addEventListener('click', deleteCurrentJob);
    document.getElementById('openCalculatorBtn').addEventListener('click', () => openCalculatorModal(app.currentJobId));
    
    // Botones de calculadora
    document.getElementById('closeCalculatorModal').addEventListener('click', closeCalculatorModal);
    document.getElementById('cancelCalculatorBtn').addEventListener('click', closeCalculatorModal);
    document.getElementById('saveCalculatorBtn').addEventListener('click', saveCalculator);
    
    // Botones de personas autorizadas
    document.getElementById('addAuthorizedPersonBtn').addEventListener('click', openAddAuthorizedPersonModal);
    document.getElementById('closeAuthorizedPersonModal').addEventListener('click', closeAuthorizedPersonModal);
    document.getElementById('cancelAuthorizedPersonBtn').addEventListener('click', closeAuthorizedPersonModal);
    document.getElementById('saveAuthorizedPersonBtn').addEventListener('click', saveAuthorizedPerson);
    
    // Botones de eventos
    document.getElementById('addEventBtn').addEventListener('click', openAddEventModal);
    document.getElementById('closeEventModal').addEventListener('click', closeEventModal);
    document.getElementById('cancelEventBtn').addEventListener('click', closeEventModal);
    document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
    document.getElementById('deleteEventBtn').addEventListener('click', deleteCurrentEvent);
    
    // Botones de filtros
    document.getElementById('manageFiltersBtn').addEventListener('click', openFilterModal);
    document.getElementById('addMaterialBtn').addEventListener('click', addMaterial);
    document.getElementById('addStatusBtn').addEventListener('click', addStatus);
    document.getElementById('addCompanyBtn').addEventListener('click', addCompany);
    document.getElementById('closeFilterModal').addEventListener('click', closeFilterModal);
    document.getElementById('cancelFilterBtn').addEventListener('click', closeFilterModal);
    document.getElementById('saveFilterBtn').addEventListener('click', saveFilters);
    
    // Filtros
    document.getElementById('clientSearchInput').addEventListener('input', filterClients);
    document.getElementById('companyFilter').addEventListener('change', filterClients);
    document.getElementById('statusFilter').addEventListener('change', filterClients);
    document.getElementById('materialFilter').addEventListener('change', filterClients);
    document.getElementById('alphabeticalFilter').addEventListener('change', filterClients);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Calendario
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));
    document.getElementById('monthSelect').addEventListener('change', updateCalendarFromSelects);
    document.getElementById('yearSelect').addEventListener('change', updateCalendarFromSelects);
    
    // Lightbox
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });
    document.getElementById('lightboxPrev').addEventListener('click', showPrevLightboxImage);
    document.getElementById('lightboxNext').addEventListener('click', showNextLightboxImage);
    
    // Controles de zoom
    document.getElementById('lightboxZoomIn').addEventListener('click', function() {
        currentZoom = Math.min(currentZoom + 0.2, 3);
        applyZoom();
    });
    
    document.getElementById('lightboxZoomOut').addEventListener('click', function() {
        currentZoom = Math.max(currentZoom - 0.2, 0.5);
        applyZoom();
    });
    
    document.getElementById('lightboxZoomReset').addEventListener('click', function() {
        currentZoom = 1;
        applyZoom();
    });
    
    // Editor de texto enriquecido
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            document.execCommand(command, false, null);
        });
    });
    
    // Calculadora
    document.querySelectorAll('#calculatorModal input, #calculatorModal select').forEach(input => {
        input.addEventListener('input', calculateTotals);
    });
    
    // Actualizar información del cliente en tiempo real
    document.getElementById('clientNameInput').addEventListener('input', updateClientDisplay);
    document.getElementById('clientPhoneInput').addEventListener('input', updateClientDisplay);
    document.getElementById('clientEmailInput').addEventListener('input', updateClientDisplay);
    document.getElementById('clientAddressInput').addEventListener('input', updateClientDisplay);
    document.getElementById('clientCompanyInput').addEventListener('input', updateClientDisplay);
    document.getElementById('clientStatusInput').addEventListener('change', updateClientDisplay);
    
    // Modal de confirmación
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmOk').addEventListener('click', function() {
        if (app.confirmCallback) {
            app.confirmCallback();
        }
        closeConfirmModal();
    });
    
    // Dropdowns para exportación de reportes
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const dropdownMenu = this.nextElementSibling;
            dropdownMenu.classList.toggle('show');
        });
    });
    
    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    });
    
    // Responsive menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
}

// Función para configurar la responsividad
function setupResponsive() {
    // Detectar el tamaño de la pantalla al cargar
    checkScreenSize();
    
    // Detectar cambios en el tamaño de la pantalla
    window.addEventListener('resize', checkScreenSize);
}

// Función para verificar el tamaño de la pantalla
function checkScreenSize() {
    const width = window.innerWidth;
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const mobileHeader = document.querySelector('.mobile-header');
    const desktopHeader = document.querySelector('header');
    
    if (width <= 992) {
        // Modo móvil
        sidebar.classList.remove('active');
        mainContent.style.marginLeft = '0';
        mobileHeader.style.display = 'flex';
        desktopHeader.style.display = 'none';
    } else {
        // Modo escritorio
        sidebar.classList.add('active');
        mainContent.style.marginLeft = 'var(--sidebar-width)';
        mobileHeader.style.display = 'none';
        desktopHeader.style.display = 'flex';
    }
}

// Función para alternar la barra lateral
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        mainContent.style.marginLeft = 'var(--sidebar-width)';
    } else {
        mainContent.style.marginLeft = '0';
    }
}

// Función para crear una nueva base de datos
function createNewDatabase() {
    showConfirm(
        'Crear Nueva Base de Datos',
        '¿Está seguro de que desea crear una nueva base de datos? Todos los datos actuales se perderán permanentemente.',
        () => {
            // Limpiar toda la base de datos
            app.clients = [];
            app.jobs = [];
            app.events = [];
            app.filters = {
                materials: [
                    { id: 1, name: 'Acrílico' },
                    { id: 2, name: 'Madera' },
                    { id: 3, name: 'Rotulación' },
                    { id: 4, name: 'Sublimación' },
                    { id: 5, name: 'Impresión' }
                ],
                statuses: [
                    { id: 1, name: 'seguimiento' },
                    { id: 2, name: 'cerrado' },
                    { id: 3, name: 'pendiente' }
                ],
                companies: []
            };
            
            // Limpiar localStorage
            localStorage.removeItem('clientManagementDatabase');
            
            // Actualizar la interfaz
            updateFilterSelects();
            updateCompanyFilter();
            renderClients();
            renderCalendar();
            renderReports();
            
            app.databaseLoaded = false;
            showToast('Nueva base de datos creada correctamente', 'success');
        }
    );
}

// Función para exportar la base de datos
function exportDatabase() {
    const database = {
        clients: app.clients,
        jobs: app.jobs,
        events: app.events,
        filters: app.filters,
        reports: app.reports,
        reportsByDate: app.reportsByDate,
        lastSaved: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(database, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `database_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Base de datos exportada correctamente', 'success');
}

// Función para mostrar el modal de confirmación
function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    app.confirmCallback = callback;
    document.getElementById('confirmModal').classList.add('active');
}

// Función para cerrar el modal de confirmación
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    app.confirmCallback = null;
}

// Función para actualizar la visualización del cliente
function updateClientDisplay() {
    const name = document.getElementById('clientNameInput').value || '-';
    const phone = document.getElementById('clientPhoneInput').value || '-';
    const email = document.getElementById('clientEmailInput').value || '-';
    const address = document.getElementById('clientAddressInput').value || '-';
    const company = document.getElementById('clientCompanyInput').value || '-';
    const status = document.getElementById('clientStatusInput').value;
    
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayPhone').textContent = phone;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayAddress').textContent = address;
    document.getElementById('displayCompany').textContent = company;
    
    const statusElement = document.getElementById('displayStatus');
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    
    // Actualizar color del estado
    statusElement.className = 'info-value';
    if (status === 'seguimiento') {
        statusElement.style.color = 'var(--seguimiento-color)';
    } else if (status === 'cerrado') {
        statusElement.style.color = 'var(--cerrado-color)';
    } else if (status === 'pendiente') {
        statusElement.style.color = 'var(--pendiente-color)';
    }
}

// Función para cambiar de pestaña
function switchTab(tabName) {
    // Actualizar pestañas activas
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Actualizar contenido de pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Actualizar contenido específico de la pestaña
    if (tabName === 'calendar') {
        renderCalendar();
    } else if (tabName === 'reports') {
        renderReports();
    }
}

// Función para mostrar notificaciones toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Configurar mensaje
    toastMessage.textContent = message;
    
    // Configurar clase según tipo
    toast.className = 'toast';
    if (type === 'success') {
        toast.classList.add('toast-success');
        toast.innerHTML = '<i class="fas fa-check-circle"></i><span id="toastMessage">' + message + '</span>';
    } else if (type === 'error') {
        toast.classList.add('toast-error');
        toast.innerHTML = '<i class="fas fa-exclamation-circle"></i><span id="toastMessage">' + message + '</span>';
    } else if (type === 'warning') {
        toast.classList.add('toast-warning');
        toast.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span id="toastMessage">' + message + '</span>';
    } else {
        toast.classList.add('toast-info');
        toast.innerHTML = '<i class="fas fa-info-circle"></i><span id="toastMessage">' + message + '</span>';
    }
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Función para crear eventos de ejemplo
function createSampleEvents() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Crear algunos eventos de ejemplo
    const sampleEvents = [
        {
            id: Date.now() + 1,
            title: 'Reunión con cliente',
            description: 'Reunión para discutir nuevos proyectos',
            date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate() + 2).padStart(2, '0')}`,
            time: '10:00',
            clientId: null,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            title: 'Entrega de proyecto',
            description: 'Entrega del proyecto de rotulación',
            date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate() + 5).padStart(2, '0')}`,
            time: '14:00',
            clientId: null,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            title: 'Visita técnica',
            description: 'Visita técnica para medición',
            date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate() + 7).padStart(2, '0')}`,
            time: '09:00',
            clientId: null,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }
    ];
    
    app.events = [...app.events, ...sampleEvents];
}

// Guardar datos automáticamente antes de cerrar la página
window.addEventListener('beforeunload', function() {
    if (app.databaseLoaded) {
        saveToLocalStorage();
    }
});
// Función para abrir el modal de agregar cliente
function openAddClientModal() {
    app.currentClientId = null;
    document.getElementById('clientModalTitle').textContent = 'Agregar Cliente';
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientPhoneInput').value = '';
    document.getElementById('clientEmailInput').value = '';
    document.getElementById('clientAddressInput').value = '';
    document.getElementById('clientCompanyInput').value = '';
    document.getElementById('clientStatusInput').value = 'seguimiento';
    document.getElementById('clientAvatarPreview').src = 'https://picsum.photos/seed/avatar/150/150.jpg';
    document.getElementById('authorizedPersonsList').innerHTML = '';
    document.getElementById('jobsList').innerHTML = '';
    document.getElementById('deleteClientBtn').style.display = 'none';
    
    // Habilitar campos de formulario
    document.getElementById('clientNameInput').disabled = false;
    document.getElementById('clientPhoneInput').disabled = false;
    document.getElementById('clientEmailInput').disabled = false;
    document.getElementById('clientAddressInput').disabled = false;
    document.getElementById('clientCompanyInput').disabled = false;
    document.getElementById('clientStatusInput').disabled = false;
    document.getElementById('changeAvatarBtn').style.display = 'block';
    
    updateClientDisplay();
    document.getElementById('clientModal').classList.add('active');
}

// Función para abrir el modal de editar cliente
function openEditClientModal(clientId) {
    app.currentClientId = clientId;
    const client = app.clients.find(c => c.id === clientId);
    
    if (client) {
        document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
        document.getElementById('clientNameInput').value = client.name;
        document.getElementById('clientPhoneInput').value = client.phone;
        document.getElementById('clientEmailInput').value = client.email;
        document.getElementById('clientAddressInput').value = client.address;
        document.getElementById('clientCompanyInput').value = client.company;
        document.getElementById('clientStatusInput').value = client.status;
        document.getElementById('clientAvatarPreview').src = client.avatar || 'https://picsum.photos/seed/avatar/150/150.jpg';
        document.getElementById('deleteClientBtn').style.display = 'inline-block';
        
        // Habilitar campos de formulario - MODO EDICIÓN
        document.getElementById('clientNameInput').disabled = false;
        document.getElementById('clientPhoneInput').disabled = false;
        document.getElementById('clientEmailInput').disabled = false;
        document.getElementById('clientAddressInput').disabled = false;
        document.getElementById('clientCompanyInput').disabled = false;
        document.getElementById('clientStatusInput').disabled = false;
        document.getElementById('changeAvatarBtn').style.display = 'block';
        
        // Cargar personas autorizadas
        renderAuthorizedPersons(client.authorizedPersons || []);
        
        // Cargar trabajos del cliente
        renderJobs(clientId);
        
        updateClientDisplay();
        document.getElementById('clientModal').classList.add('active');
    }
}

// Función para ver detalles del cliente sin editar (SOLO LECTURA)
function viewClientDetails(clientId) {
    app.currentClientId = clientId;
    const client = app.clients.find(c => c.id === clientId);
    
    if (client) {
        document.getElementById('clientModalTitle').textContent = 'Detalles del Cliente';
        document.getElementById('clientNameInput').value = client.name;
        document.getElementById('clientPhoneInput').value = client.phone;
        document.getElementById('clientEmailInput').value = client.email;
        document.getElementById('clientAddressInput').value = client.address;
        document.getElementById('clientCompanyInput').value = client.company;
        document.getElementById('clientStatusInput').value = client.status;
        document.getElementById('clientAvatarPreview').src = client.avatar || 'https://picsum.photos/seed/avatar/150/150.jpg';
        document.getElementById('deleteClientBtn').style.display = 'none';
        
        // Deshabilitar campos de formulario - MODO SOLO LECTURA
        document.getElementById('clientNameInput').disabled = true;
        document.getElementById('clientPhoneInput').disabled = true;
        document.getElementById('clientEmailInput').disabled = true;
        document.getElementById('clientAddressInput').disabled = true;
        document.getElementById('clientCompanyInput').disabled = true;
        document.getElementById('clientStatusInput').disabled = true;
        document.getElementById('changeAvatarBtn').style.display = 'none';
        
        // Cargar personas autorizadas
        renderAuthorizedPersons(client.authorizedPersons || []);
        
        // Cargar trabajos del cliente
        renderJobs(clientId);
        
        updateClientDisplay();
        document.getElementById('clientModal').classList.add('active');
    }
}

// Función para cerrar el modal de cliente
function closeClientModal() {
    // Restablecer el estado de los campos a habilitado por defecto
    document.getElementById('clientNameInput').disabled = false;
    document.getElementById('clientPhoneInput').disabled = false;
    document.getElementById('clientEmailInput').disabled = false;
    document.getElementById('clientAddressInput').disabled = false;
    document.getElementById('clientCompanyInput').disabled = false;
    document.getElementById('clientStatusInput').disabled = false;
    document.getElementById('changeAvatarBtn').style.display = 'block';
    
    document.getElementById('clientModal').classList.remove('active');
}

// Función para guardar un cliente
function saveClient() {
    const name = document.getElementById('clientNameInput').value.trim();
    const phone = document.getElementById('clientPhoneInput').value.trim();
    const email = document.getElementById('clientEmailInput').value.trim();
    const address = document.getElementById('clientAddressInput').value.trim();
    const company = document.getElementById('clientCompanyInput').value.trim();
    const status = document.getElementById('clientStatusInput').value;
    const avatar = document.getElementById('clientAvatarPreview').src;
    
    if (!name) {
        showToast('Por favor, ingrese el nombre del cliente', 'error');
        return;
    }
    
    const clientData = {
        name,
        phone,
        email,
        address,
        company,
        status,
        avatar,
        authorizedPersons: app.currentClientId ? 
            app.clients.find(c => c.id === app.currentClientId).authorizedPersons || [] : 
            [],
        lastUpdated: new Date().toISOString()
    };
    
    if (app.currentClientId) {
        // Editar cliente existente
        const index = app.clients.findIndex(c => c.id === app.currentClientId);
        if (index !== -1) {
            app.clients[index] = { ...app.clients[index], ...clientData };
            showToast('Cliente actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo cliente
        const newClient = {
            id: Date.now(),
            ...clientData,
            createdAt: new Date().toISOString()
        };
        app.clients.push(newClient);
        showToast('Cliente agregado correctamente', 'success');
    }
    
    // Actualizar lista de empresas si es una nueva empresa
    if (company && !app.filters.companies.find(c => c.name === company)) {
        app.filters.companies.push({
            id: Date.now(),
            name: company
        });
        updateCompanyFilter();
    }
    
    closeClientModal();
    renderClients();
    saveToLocalStorage();
}

// Función para eliminar el cliente actual
function deleteCurrentClient() {
    if (app.currentClientId) {
        showConfirm(
            'Eliminar Cliente',
            '¿Está seguro de que desea eliminar este cliente? Todos los trabajos asociados también serán eliminados.',
            () => {
                // Eliminar trabajos asociados
                app.jobs = app.jobs.filter(job => job.clientId !== app.currentClientId);
                
                // Eliminar cliente
                app.clients = app.clients.filter(client => client.id !== app.currentClientId);
                
                showToast('Cliente eliminado correctamente', 'success');
                closeClientModal();
                renderClients();
                saveToLocalStorage();
            }
        );
    }
}

// Función para renderizar los clientes
function renderClients() {
    const clientsList = document.getElementById('clientsList');
    const emptyState = document.getElementById('emptyClientsState');
    
    // Aplicar filtros
    let filteredClients = [...app.clients];
    
    // Filtro de búsqueda
    const searchTerm = document.getElementById('clientSearchInput').value.toLowerCase();
    if (searchTerm) {
        filteredClients = filteredClients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.phone.toLowerCase().includes(searchTerm) ||
            (client.authorizedPersons && client.authorizedPersons.some(person => 
                person.id && person.id.toLowerCase().includes(searchTerm)
            ))
        );
    }
    
    // Filtro de empresa
    const companyFilter = document.getElementById('companyFilter').value;
    if (companyFilter) {
        filteredClients = filteredClients.filter(client => client.company === companyFilter);
    }
    
    // Filtro de estado
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
        filteredClients = filteredClients.filter(client => client.status === statusFilter);
    }
    
    // Filtro de material (basado en trabajos)
    const materialFilter = document.getElementById('materialFilter').value;
    if (materialFilter) {
        filteredClients = filteredClients.filter(client => {
            const clientJobs = app.jobs.filter(job => job.clientId === client.id);
            return clientJobs.some(job => job.material === materialFilter);
        });
    }
    
    // Ordenamiento alfabético
    const alphabeticalFilter = document.getElementById('alphabeticalFilter').value;
    if (alphabeticalFilter === 'asc') {
        filteredClients.sort((a, b) => a.name.localeCompare(b.name));
    } else if (alphabeticalFilter === 'desc') {
        filteredClients.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Orden por defecto: más nuevo a más viejo
        filteredClients.sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));
    }
    
    if (filteredClients.length === 0) {
        clientsList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    clientsList.innerHTML = filteredClients.map(client => {
        const jobsCount = app.jobs.filter(job => job.clientId === client.id).length;
        const statusClass = `status-${client.status}`;
        const statusTextClass = `status-text-${client.status}`;
        
        // Obtener miniaturas de archivos de los trabajos del cliente
        const jobFiles = [];
        const clientJobs = app.jobs.filter(job => job.clientId === client.id);
        
        clientJobs.forEach(job => {
            if (job.files && job.files.length > 0) {
                job.files.forEach(file => {
                    if (file.type.startsWith('image/')) {
                        jobFiles.push({
                            type: 'image',
                            url: file.url,
                            thumbnail: file.thumbnail || file.url
                        });
                    } else if (file.type.startsWith('video/')) {
                        jobFiles.push({
                            type: 'video',
                            url: file.url,
                            thumbnail: file.thumbnail || null
                        });
                    } else if (file.type === 'application/pdf') {
                        jobFiles.push({
                            type: 'pdf',
                            url: file.url,
                            thumbnail: file.thumbnail || null
                        });
                    } else {
                        jobFiles.push({
                            type: 'document',
                            url: file.url,
                            thumbnail: null
                        });
                    }
                });
            }
        });
        
        // Limitar a 4 miniaturas
        const previewFiles = jobFiles.slice(0, 4);
        
        return `
            <div class="client-card" onclick="viewClientDetails(${client.id})">
                <div class="client-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openEditClientModal(${client.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="client-header">
                    <img src="${client.avatar || 'https://picsum.photos/seed/avatar/150/150.jpg'}" alt="${client.name}" class="client-avatar">
                    <div class="client-status ${statusClass}"></div>
                </div>
                <div class="client-body">
                    <h3 class="client-name">${client.name}</h3>
                    <p class="client-company">${client.company || 'Sin empresa'}</p>
                    <p class="client-info"><i class="fas fa-phone"></i> ${client.phone || 'No especificado'}</p>
                    <p class="client-info"><i class="fas fa-envelope"></i> ${client.email || 'No especificado'}</p>
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <span class="client-jobs-count">${jobsCount} trabajo${jobsCount !== 1 ? 's' : ''}</span>
                        <span class="client-status-text ${statusTextClass}">${client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span>
                    </div>
                    ${previewFiles.length > 0 ? `
                        <div class="job-files-preview">
                            ${previewFiles.map(file => {
                                if (file.type === 'image') {
                                    return `<div class="file-preview"><img src="${file.thumbnail || file.url}" alt="Archivo" loading="lazy"></div>`;
                                } else if (file.type === 'video') {
                                    return `<div class="file-preview">
                                        ${file.thumbnail ? 
                                            `<img src="${file.thumbnail}" alt="Video" loading="lazy">` : 
                                            `<i class="fas fa-video"></i>`
                                        }
                                    </div>`;
                                } else if (file.type === 'pdf') {
                                    return `<div class="file-preview" style="background-color: #ffecec;">
                                        ${file.thumbnail ? 
                                            `<img src="${file.thumbnail}" alt="PDF" loading="lazy">` : 
                                            `<i class="fas fa-file-pdf" style="color: #ff0000;"></i>`
                                        }
                                    </div>`;
                                } else {
                                    return `<div class="file-preview"><i class="fas fa-file"></i></div>`;
                                }
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Función para renderizar las personas autorizadas
function renderAuthorizedPersons(authorizedPersons) {
    const authorizedPersonsList = document.getElementById('authorizedPersonsList');
    
    if (!authorizedPersons || authorizedPersons.length === 0) {
        authorizedPersonsList.innerHTML = '<p>No hay personas autorizadas registradas</p>';
        return;
    }
    
    authorizedPersonsList.innerHTML = authorizedPersons.map((person, index) => `
        <div class="authorized-person">
            <div class="authorized-person-header">
                <h4 class="authorized-person-name">${person.name}</h4>
                <button class="btn btn-danger btn-sm" onclick="removeAuthorizedPerson(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="authorized-person-info"><i class="fas fa-phone"></i> ${person.phone || 'No especificado'}</p>
            <p class="authorized-person-info"><i class="fas fa-id-card"></i> ${person.id || 'No especificado'}</p>
            <div class="authorized-person-note">${person.note || ''}</div>
        </div>
    `).join('');
}

// Función para abrir el modal de agregar persona autorizada
function openAddAuthorizedPersonModal() {
    document.getElementById('authorizedPersonNameInput').value = '';
    document.getElementById('authorizedPersonPhoneInput').value = '';
    document.getElementById('authorizedPersonIdInput').value = '';
    document.getElementById('authorizedPersonNoteInput').innerHTML = '';
    document.getElementById('authorizedPersonModal').classList.add('active');
}

// Función para cerrar el modal de persona autorizada
function closeAuthorizedPersonModal() {
    document.getElementById('authorizedPersonModal').classList.remove('active');
}

// Función para guardar una persona autorizada
function saveAuthorizedPerson() {
    const name = document.getElementById('authorizedPersonNameInput').value.trim();
    const phone = document.getElementById('authorizedPersonPhoneInput').value.trim();
    const id = document.getElementById('authorizedPersonIdInput').value.trim();
    const note = document.getElementById('authorizedPersonNoteInput').innerHTML;
    
    if (!name) {
        showToast('Por favor, ingrese el nombre de la persona autorizada', 'error');
        return;
    }
    
    const newPerson = { name, phone, id, note };
    
    if (app.currentClientId) {
        const client = app.clients.find(c => c.id === app.currentClientId);
        if (client) {
            if (!client.authorizedPersons) {
                client.authorizedPersons = [];
            }
            client.authorizedPersons.push(newPerson);
            renderAuthorizedPersons(client.authorizedPersons);
        }
    }
    
    closeAuthorizedPersonModal();
    showToast('Persona autorizada agregada correctamente', 'success');
}

// Función para eliminar una persona autorizada
function removeAuthorizedPerson(index) {
    if (app.currentClientId) {
        const client = app.clients.find(c => c.id === app.currentClientId);
        if (client && client.authorizedPersons) {
            client.authorizedPersons.splice(index, 1);
            renderAuthorizedPersons(client.authorizedPersons);
            showToast('Persona autorizada eliminada correctamente', 'success');
        }
    }
}

// Función para previsualizar el avatar
function previewAvatar(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('clientAvatarPreview').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Función para renderizar los trabajos de un cliente
function renderJobs(clientId) {
    const jobsList = document.getElementById('jobsList');
    const clientJobs = app.jobs.filter(job => job.clientId === clientId);
    
    if (clientJobs.length === 0) {
        jobsList.innerHTML = '<p>No hay trabajos registrados</p>';
        return;
    }
    
    jobsList.innerHTML = clientJobs.map(job => {
        const statusClass = `status-${job.status}`;
        
        return `
            <div class="job-item">
                <div class="job-header">
                    <h4 class="job-name">${job.name}</h4>
                    <div class="job-status ${statusClass}"></div>
                </div>
                <p class="job-material">${job.material || 'Sin material'}</p>
                <p class="job-measures">${job.measures || 'Sin medidas'}</p>
                <div class="job-actions">
                    <button class="btn btn-primary btn-sm" onclick="openJobDetailsModal(${job.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editJob(${job.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Función para abrir el modal de agregar trabajo
function openAddJobModal(clientId) {
    app.currentClientId = clientId;
    app.currentJobId = null;
    app.tempFiles = [];
    
    document.getElementById('jobModalTitle').textContent = 'Agregar Trabajo';
    document.getElementById('jobNameInput').value = '';
    document.getElementById('jobMaterialInput').value = '';
    document.getElementById('jobMeasuresInput').value = '';
    document.getElementById('jobStatusInput').value = 'seguimiento';
    document.getElementById('jobDetailsInput').innerHTML = '';
    document.getElementById('jobFollowUpNotesInput').innerHTML = '';
    document.getElementById('filesList').innerHTML = '';
    
    // Actualizar selector de materiales
    const materialSelect = document.getElementById('jobMaterialInput');
    materialSelect.innerHTML = '<option value="">Seleccionar material</option>';
    app.filters.materials.forEach(material => {
        const option = document.createElement('option');
        option.value = material.name;
        option.textContent = material.name;
        materialSelect.appendChild(option);
    });
    
    document.getElementById('jobModal').classList.add('active');
}

// Función para abrir el modal de editar trabajo (CORREGIDA)
function openEditJobModal(jobId) {
    app.currentJobId = jobId;
    const job = app.jobs.find(j => j.id === jobId);
    
    if (job) {
        app.editingFiles = job.files ? [...job.files] : [];
        
        document.getElementById('jobModalTitle').textContent = 'Editar Trabajo';
        document.getElementById('jobNameInput').value = job.name;
        document.getElementById('jobMaterialInput').value = job.material || '';
        document.getElementById('jobMeasuresInput').value = job.measures || '';
        document.getElementById('jobStatusInput').value = job.status;
        document.getElementById('jobDetailsInput').innerHTML = job.details || '';
        document.getElementById('jobFollowUpNotesInput').innerHTML = job.followUpNotes || '';
        
        renderFiles(app.editingFiles);
        
        // Actualizar selector de materiales
        const materialSelect = document.getElementById('jobMaterialInput');
        materialSelect.innerHTML = '<option value="">Seleccionar material</option>';
        app.filters.materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.name;
            option.textContent = material.name;
            if (material.name === job.material) {
                option.selected = true;
            }
            materialSelect.appendChild(option);
        });
        
        document.getElementById('jobModal').classList.add('active');
    }
}

// Función para cerrar el modal de trabajo
function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
    app.currentJobId = null;
    app.tempFiles = [];
    app.editingFiles = [];
}

// Función para guardar un trabajo
function saveJob() {
    const name = document.getElementById('jobNameInput').value.trim();
    const material = document.getElementById('jobMaterialInput').value;
    const measures = document.getElementById('jobMeasuresInput').value.trim();
    const status = document.getElementById('jobStatusInput').value;
    const details = document.getElementById('jobDetailsInput').innerHTML;
    const followUpNotes = document.getElementById('jobFollowUpNotesInput').innerHTML;
    
    if (!name) {
        showToast('Por favor, ingrese el nombre del trabajo', 'error');
        return;
    }
    
    // Obtener archivos (del trabajo existente o temporales)
    let files = [];
    if (app.currentJobId) {
        // Para trabajos existentes, usar editingFiles que contiene los archivos originales más los nuevos
        files = [...app.editingFiles];
    } else {
        // Para trabajos nuevos, usar tempFiles
        files = [...app.tempFiles];
    }
    
    const jobData = {
        clientId: app.currentClientId,
        name,
        material,
        measures,
        status,
        details,
        followUpNotes,
        files,
        lastUpdated: new Date().toISOString()
    };
    
    if (app.currentJobId) {
        // Editar trabajo existente
        const index = app.jobs.findIndex(j => j.id === app.currentJobId);
        if (index !== -1) {
            app.jobs[index] = { ...app.jobs[index], ...jobData };
            showToast('Trabajo actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo trabajo
        const newJob = {
            id: Date.now(),
            ...jobData,
            createdAt: new Date().toISOString()
        };
        app.jobs.push(newJob);
        showToast('Trabajo agregado correctamente', 'success');
    }
    
    // Actualizar el estado del cliente basado en los trabajos
    updateClientStatusFromJobs(app.currentClientId);
    
    closeJobModal();
    
    // Actualizar lista de trabajos si el modal del cliente está abierto
    if (app.currentClientId) {
        renderJobs(app.currentClientId);
    }
    
    renderClients();
    saveToLocalStorage();
}

// Función para abrir el modal de detalles del trabajo
function openJobDetailsModal(jobId) {
    app.currentJobId = jobId;
    const job = app.jobs.find(j => j.id === jobId);
    
    if (job) {
        document.getElementById('jobDetailsModalTitle').textContent = 'Detalles del Trabajo';
        document.getElementById('jobDetailsName').textContent = job.name;
        document.getElementById('jobDetailsMaterial').textContent = job.material || 'No especificado';
        document.getElementById('jobDetailsMeasures').textContent = job.measures || 'No especificado';
        document.getElementById('jobDetailsStatus').textContent = job.status.charAt(0).toUpperCase() + job.status.slice(1);
        document.getElementById('jobDetailsDetails').innerHTML = job.details || 'Sin detalles';
        document.getElementById('jobDetailsNotes').innerHTML = job.followUpNotes || 'Sin notas';
        
        // Actualizar calculadora si hay datos
        if (job.calculator) {
            document.getElementById('jobDetailsCost').textContent = `₡${job.calculator.totalCost || 0}`;
            document.getElementById('jobDetailsPriceWithoutIva').textContent = `₡${job.calculator.priceWithoutIva || 0}`;
            document.getElementById('jobDetailsFinalPrice').textContent = `₡${job.calculator.finalPrice || 0}`;
            
            const profit = job.calculator.finalPrice - job.calculator.totalCost;
            const profitPercentage = job.calculator.finalPrice > 0 ? (profit / job.calculator.finalPrice * 100) : 0;
            document.getElementById('jobDetailsProfit').textContent = `₡${profit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`;
        }
        
        // Renderizar archivos
        renderJobDetailsFiles(job.files || []);
        
        document.getElementById('jobDetailsModal').classList.add('active');
    }
}

// Función para cerrar el modal de detalles del trabajo
function closeJobDetailsModal() {
    document.getElementById('jobDetailsModal').classList.remove('active');
}

// Función para editar el trabajo actual (CORREGIDA)
function editCurrentJob() {
    if (app.currentJobId) {
        closeJobDetailsModal();
        openEditJobModal(app.currentJobId);
    }
}

// Función para eliminar el trabajo actual
function deleteCurrentJob() {
    if (app.currentJobId) {
        const job = app.jobs.find(j => j.id === app.currentJobId);
        if (job) {
            showConfirm(
                'Eliminar Trabajo',
                '¿Está seguro de que desea eliminar este trabajo? Esta acción no se puede deshacer.',
                () => {
                    const clientId = job.clientId;
                    app.jobs = app.jobs.filter(j => j.id !== app.currentJobId);
                    
                    // Actualizar el estado del cliente
                    updateClientStatusFromJobs(clientId);
                    
                    showToast('Trabajo eliminado correctamente', 'success');
                    closeJobDetailsModal();
                    
                    // Actualizar lista de trabajos si el modal del cliente está abierto
                    if (app.currentClientId) {
                        renderJobs(clientId);
                    }
                    
                    renderClients();
                    saveToLocalStorage();
                }
            );
        }
    }
}

// Función para actualizar el estado de un cliente basado en los estados de sus trabajos
function updateClientStatusFromJobs(clientId) {
    const client = app.clients.find(c => c.id === clientId);
    if (!client) return;
    
    const clientJobs = app.jobs.filter(job => job.clientId === clientId);
    
    if (clientJobs.length === 0) {
        // Si no hay trabajos, mantener el estado actual
        return;
    }
    
    // Contar trabajos por estado
    const jobStatusCounts = {
        seguimiento: 0,
        cerrado: 0,
        pendiente: 0
    };
    
    clientJobs.forEach(job => {
        if (jobStatusCounts.hasOwnProperty(job.status)) {
            jobStatusCounts[job.status]++;
        }
    });
    
    // Determinar el estado del cliente basado en los trabajos
    let newStatus = client.status; // Mantener el estado actual por defecto
    
    // Si hay trabajos pendientes, el cliente está pendiente
    if (jobStatusCounts.pendiente > 0) {
        newStatus = 'pendiente';
    }
    // Si todos los trabajos están cerrados, el cliente está cerrado
    else if (jobStatusCounts.cerrado === clientJobs.length) {
        newStatus = 'cerrado';
    }
    // Si hay trabajos en seguimiento y no hay pendientes, el cliente está en seguimiento
    else if (jobStatusCounts.seguimiento > 0 && jobStatusCounts.pendiente === 0) {
        newStatus = 'seguimiento';
    }
    
    // Actualizar el estado del cliente si ha cambiado
    if (newStatus !== client.status) {
        client.status = newStatus;
        client.lastUpdated = new Date().toISOString();
        saveToLocalStorage();
        
        // Mostrar notificación
        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        showToast(`Estado del cliente actualizado a: ${statusText}`, 'info');
    }
}
// Función para manejar la selección de archivos
function handleFileSelect(e) {
    const files = e.target.files;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.type.startsWith('image/')) {
            // Para imágenes, leer como Data URL
            const reader = new FileReader();
            reader.onload = function(event) {
                const fileData = {
                    id: Date.now() + i,
                    name: file.name,
                    type: file.type,
                    url: event.target.result,
                    thumbnail: event.target.result,
                    isLocal: true
                };
                
                addFileToCurrentJob(fileData);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            // Para videos, generar miniatura
            generateLocalVideoThumbnail(file, function(thumbnail) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const fileData = {
                        id: Date.now() + i,
                        name: file.name,
                        type: file.type,
                        url: event.target.result,
                        thumbnail: thumbnail,
                        isLocal: true
                    };
                    
                    addFileToCurrentJob(fileData);
                };
                reader.readAsDataURL(file);
            });
        } else if (file.type === 'application/pdf') {
            // Para PDFs, intentar generar miniatura
            generateLocalPdfThumbnail(file, function(thumbnail) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const fileData = {
                        id: Date.now() + i,
                        name: file.name,
                        type: file.type,
                        url: event.target.result,
                        thumbnail: thumbnail,
                        isLocal: true
                    };
                    
                    addFileToCurrentJob(fileData);
                };
                reader.readAsDataURL(file);
            });
        } else {
            // Para otros tipos de archivos
            const reader = new FileReader();
            reader.onload = function(event) {
                const fileData = {
                    id: Date.now() + i,
                    name: file.name,
                    type: file.type,
                    url: event.target.result,
                    thumbnail: null,
                    isLocal: true
                };
                
                addFileToCurrentJob(fileData);
            };
            reader.readAsDataURL(file);
        }
    }
}

// Función para agregar archivo por URL
function addFileByUrl() {
    const url = document.getElementById('fileUrlInput').value.trim();
    const type = document.getElementById('fileTypeSelect').value;
    
    if (!url) {
        showToast('Por favor, ingrese una URL válida', 'error');
        return;
    }
    
    let mimeType = '';
    if (type === 'image') {
        mimeType = 'image/jpeg';
    } else if (type === 'video') {
        mimeType = 'video/mp4';
    } else if (type === 'pdf') {
        mimeType = 'application/pdf';
    } else {
        mimeType = 'application/octet-stream';
    }
    
    const fileData = {
        id: Date.now(),
        name: url.split('/').pop() || 'Archivo externo',
        type: mimeType,
        url: url,
        isLocal: false
    };
    
    // Generar miniaturas para imágenes y videos de internet
    if (type === 'image') {
        // Para imágenes, la miniatura es la misma imagen
        fileData.thumbnail = url;
    } else if (type === 'video') {
        // Para videos de internet, intentar usar el servicio de miniaturas de YouTube si es un video de YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = extractYouTubeId(url);
            if (videoId) {
                fileData.thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`;
            }
        } else {
            // Para otros videos, intentar generar miniatura
            generateVideoThumbnail(url, function(thumbnail) {
                fileData.thumbnail = thumbnail;
            });
        }
    } else if (type === 'pdf') {
        // Para PDFs de internet, intentar generar miniatura
        generatePdfThumbnail(url, function(thumbnail) {
            fileData.thumbnail = thumbnail;
        });
    }
    
    // Agregar archivo a la lista correspondiente
    if (app.currentJobId) {
        // Si es un trabajo existente, agregar a editingFiles
        app.editingFiles.push(fileData);
    } else {
        // Si es un trabajo nuevo, agregar a tempFiles
        app.tempFiles.push(fileData);
    }
    
    // Actualizar vista de archivos
    renderFiles(app.currentJobId ? app.editingFiles : app.tempFiles);
    
    // Limpiar campos
    document.getElementById('fileUrlInput').value = '';
    
    showToast('Archivo agregado correctamente', 'success');
}

// Función auxiliar para agregar archivos al trabajo actual
function addFileToCurrentJob(fileData) {
    if (app.currentJobId) {
        // Si es un trabajo existente, agregar a editingFiles
        app.editingFiles.push(fileData);
        renderFiles(app.editingFiles);
    } else {
        // Si es un trabajo nuevo, agregar a tempFiles
        app.tempFiles.push(fileData);
        renderFiles(app.tempFiles);
    }
}

// Función para renderizar archivos
function renderFiles(files) {
    const filesList = document.getElementById('filesList');
    
    if (!files || files.length === 0) {
        filesList.innerHTML = '<p>No hay archivos adjuntos</p>';
        return;
    }
    
    filesList.innerHTML = files.map((file, index) => {
        let thumbnail = '';
        
        if (file.type.startsWith('image/')) {
            thumbnail = `<img src="${file.thumbnail || file.url}" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
        } else if (file.type.startsWith('video/')) {
            // Si es un video de YouTube, usar la miniatura de YouTube
            if (file.url.includes('youtube.com') || file.url.includes('youtu.be')) {
                const videoId = extractYouTubeId(file.url);
                if (videoId) {
                    thumbnail = `<img src="https://img.youtube.com/vi/${videoId}/0.jpg" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
                } else {
                    thumbnail = file.thumbnail ? 
                        `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">` : 
                        `<div class="file-thumbnail"><i class="fas fa-video"></i></div>`;
                }
            } else {
                thumbnail = file.thumbnail ? 
                    `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">` : 
                    `<div class="file-thumbnail"><i class="fas fa-video"></i></div>`;
            }
        } else if (file.type === 'application/pdf') {
            // Para PDFs, intentar usar una miniatura si está disponible
            if (file.thumbnail) {
                thumbnail = `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
            } else {
                thumbnail = `<div class="file-thumbnail" style="display: flex; align-items: center; justify-content: center; background-color: #ffecec;">
                    <i class="fas fa-file-pdf" style="font-size: 24px; color: #ff0000;"></i>
                </div>`;
            }
        } else {
            thumbnail = `<div class="file-thumbnail" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;">
                <i class="fas fa-file" style="font-size: 24px; color: #999;"></i>
            </div>`;
        }
        
        return `
            <div class="file-item" onclick="openLightbox(${index})">
                ${thumbnail}
                <button class="file-remove" onclick="event.stopPropagation(); removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Función para renderizar archivos en el modal de detalles
function renderJobDetailsFiles(files) {
    const filesList = document.getElementById('jobDetailsFiles');
    
    if (!files || files.length === 0) {
        filesList.innerHTML = '<p>No hay archivos adjuntos</p>';
        return;
    }
    
    filesList.innerHTML = files.map((file, index) => {
        let thumbnail = '';
        
        if (file.type.startsWith('image/')) {
            thumbnail = `<img src="${file.thumbnail || file.url}" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
        } else if (file.type.startsWith('video/')) {
            // Si es un video de YouTube, usar la miniatura de YouTube
            if (file.url.includes('youtube.com') || file.url.includes('youtu.be')) {
                const videoId = extractYouTubeId(file.url);
                if (videoId) {
                    thumbnail = `<img src="https://img.youtube.com/vi/${videoId}/0.jpg" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
                } else {
                    thumbnail = file.thumbnail ? 
                        `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">` : 
                        `<div class="file-thumbnail"><i class="fas fa-video"></i></div>`;
                }
            } else {
                thumbnail = file.thumbnail ? 
                    `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">` : 
                    `<div class="file-thumbnail"><i class="fas fa-video"></i></div>`;
            }
        } else if (file.type === 'application/pdf') {
            // Para PDFs, intentar usar una miniatura si está disponible
            if (file.thumbnail) {
                thumbnail = `<img src="${file.thumbnail}" alt="${file.name}" class="file-thumbnail" loading="lazy">`;
            } else {
                thumbnail = `<div class="file-thumbnail" style="display: flex; align-items: center; justify-content: center; background-color: #ffecec;">
                    <i class="fas fa-file-pdf" style="font-size: 24px; color: #ff0000;"></i>
                </div>`;
            }
        } else {
            thumbnail = `<div class="file-thumbnail" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;">
                <i class="fas fa-file" style="font-size: 24px; color: #999;"></i>
            </div>`;
        }
        
        return `
            <div class="file-item" onclick="openLightbox(${index})">
                ${thumbnail}
                <div class="file-name">${file.name}</div>
            </div>
        `;
    }).join('');
}

// Función para eliminar un archivo
function removeFile(index) {
    if (app.currentJobId) {
        // Si es un trabajo existente, eliminar de editingFiles
        app.editingFiles.splice(index, 1);
        renderFiles(app.editingFiles);
    } else {
        // Si es un trabajo nuevo, eliminar de tempFiles
        app.tempFiles.splice(index, 1);
        renderFiles(app.tempFiles);
    }
    
    showToast('Archivo eliminado correctamente', 'success');
}

// Función para abrir el lightbox
function openLightbox(index) {
    // Determinar qué lista de archivos usar
    const files = app.currentJobId ? app.editingFiles : app.tempFiles;
    
    if (!files || files.length === 0) return;
    
    app.currentLightboxFiles = files;
    app.currentLightboxIndex = index;
    
    showLightboxImage(index);
    document.getElementById('lightbox').classList.add('active');
}

// Función para cerrar el lightbox
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    app.currentLightboxFiles = [];
    app.currentLightboxIndex = 0;
}

// Función para mostrar una imagen en el lightbox
function showLightboxImage(index) {
    const file = app.currentLightboxFiles[index];
    const lightboxContent = document.getElementById('lightboxContent');
    
    if (file.type.startsWith('image/')) {
        lightboxContent.innerHTML = `<img src="${file.url}" alt="${file.name}" class="lightbox-image" loading="lazy">`;
    } else if (file.type.startsWith('video/')) {
        // Si es un video de YouTube, usar el reproductor de YouTube
        if (file.url.includes('youtube.com') || file.url.includes('youtu.be')) {
            const videoId = extractYouTubeId(file.url);
            if (videoId) {
                lightboxContent.innerHTML = `
                    <iframe width="560" height="315" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            } else {
                lightboxContent.innerHTML = `
                    <video src="${file.url}" class="lightbox-video" id="lightboxVideo" controls>
                        Tu navegador no soporta el elemento de video.
                    </video>
                    <div class="video-custom-controls">
                        <button class="video-control-btn" id="videoPlayPause">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="video-progress">
                            <div class="video-progress-filled" id="videoProgress"></div>
                        </div>
                        <button class="video-control-btn" id="videoMute">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <input type="range" class="video-volume-slider" id="videoVolume" min="0" max="1" step="0.1" value="1">
                        <button class="video-control-btn" id="videoFullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="video-control-btn" id="videoForward10">
                            <i class="fas fa-forward"></i>
                        </button>
                        <button class="video-control-btn" id="videoBackward10">
                            <i class="fas fa-backward"></i>
                        </button>
                    </div>
                `;
                
                // Configurar controles personalizados de video
                setupVideoControls();
            }
        } else {
            lightboxContent.innerHTML = `
                <video src="${file.url}" class="lightbox-video" id="lightboxVideo" controls>
                    Tu navegador no soporta el elemento de video.
                </video>
                <div class="video-custom-controls">
                    <button class="video-control-btn" id="videoPlayPause">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="video-progress">
                        <div class="video-progress-filled" id="videoProgress"></div>
                    </div>
                    <button class="video-control-btn" id="videoMute">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" class="video-volume-slider" id="videoVolume" min="0" max="1" step="0.1" value="1">
                    <button class="video-control-btn" id="videoFullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="video-control-btn" id="videoForward10">
                        <i class="fas fa-forward"></i>
                    </button>
                    <button class="video-control-btn" id="videoBackward10">
                        <i class="fas fa-backward"></i>
                    </button>
                </div>
            `;
            
            // Configurar controles personalizados de video
            setupVideoControls();
        }
    } else if (file.type === 'application/pdf') {
        if (file.isLocal) {
            // Para PDFs locales, usar un objeto o embed
            lightboxContent.innerHTML = `
                <div style="width: 90%; height: 90%; background-color: white; border-radius: 10px; overflow: hidden;">
                    <object data="${file.url}" type="application/pdf" width="100%" height="100%">
                        <p>Tu navegador no tiene un visor de PDF instalado. 
                        <a href="${file.url}" download="${file.name}">Descargar el PDF</a>.</p>
                    </object>
                </div>
            `;
        } else {
            // Para PDFs de internet, usar un iframe
            lightboxContent.innerHTML = `
                <div style="width: 90%; height: 90%; background-color: white; border-radius: 10px; overflow: hidden;">
                    <iframe src="${file.url}" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
            `;
        }
    } else {
        lightboxContent.innerHTML = `<div style="color: white; text-align: center;">
            <i class="fas fa-file" style="font-size: 48px;"></i>
            <p>${file.name}</p>
            <a href="${file.url}" download="${file.name}" style="color: white; text-decoration: underline;">
                <i class="fas fa-download"></i> Descargar
            </a>
        </div>`;
    }
    
    // Resetear zoom
    currentZoom = 1;
}

// Función para mostrar la imagen anterior en el lightbox
function showPrevLightboxImage() {
    if (app.currentLightboxIndex > 0) {
        app.currentLightboxIndex--;
        showLightboxImage(app.currentLightboxIndex);
    }
}

// Función para mostrar la siguiente imagen en el lightbox
function showNextLightboxImage() {
    if (app.currentLightboxIndex < app.currentLightboxFiles.length - 1) {
        app.currentLightboxIndex++;
        showLightboxImage(app.currentLightboxIndex);
    }
}

// Función para aplicar zoom
function applyZoom() {
    const lightboxContent = document.getElementById('lightboxContent');
    const image = lightboxContent.querySelector('img, video, iframe, object');
    
    if (image) {
        image.style.transform = `scale(${currentZoom})`;
    }
}

// Función para extraer el ID de un video de YouTube
function extractYouTubeId(url) {
    // Patrones para diferentes formatos de URLs de YouTube
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
        /youtube\.com\/live\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Función para generar miniaturas de videos de YouTube
function generateYouTubeThumbnail(videoId, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const thumbnail = canvas.toDataURL('image/jpeg');
        callback(thumbnail);
    };
    
    img.onerror = function() {
        // Si no se puede cargar la imagen, usar una miniatura genérica
        callback(null);
    };
    
    img.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

// Función para generar miniaturas de videos locales
function generateLocalVideoThumbnail(videoFile, callback) {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    
    video.onloadeddata = function() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const thumbnail = canvas.toDataURL('image/jpeg');
        URL.revokeObjectURL(video.src);
        callback(thumbnail);
    };
    
    video.onerror = function() {
        URL.revokeObjectURL(video.src);
        callback(null);
    };
}

// Función para generar miniaturas de PDFs locales
function generateLocalPdfThumbnail(pdfFile, callback) {
    // Para PDFs locales, no podemos generar miniaturas sin una librería externa
    // Por ahora, usaremos un icono de PDF
    callback(null);
}

// Función para generar miniaturas de videos de internet
function generateVideoThumbnail(videoUrl, callback) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    
    video.addEventListener('loadeddata', function() {
        // Saltar a un punto intermedio del video para obtener una miniatura representativa
        video.currentTime = video.duration / 2;
    });
    
    video.addEventListener('seeked', function() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir canvas a data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg');
        callback(thumbnailUrl);
    });
    
    video.addEventListener('error', function() {
        // Si hay un error al cargar el video, usar un icono por defecto
        callback(null);
    });
}

// Función para generar miniaturas de PDFs de internet
function generatePdfThumbnail(pdfUrl, callback) {
    // Nota: Esta función es una simulación, ya que la generación de miniaturas de PDF 
    // requiere bibliotecas adicionales como PDF.js que no están incluidas en este código
    // En una implementación real, se debería usar PDF.js o similar
    
    // Simulamos una miniatura con un icono
    callback(null);
}

// Función para configurar los controles de video
function setupVideoControls() {
    const video = document.getElementById('lightboxVideo');
    if (!video) return;
    
    const playPauseBtn = document.getElementById('videoPlayPause');
    const progressBar = document.getElementById('videoProgress');
    const muteBtn = document.getElementById('videoMute');
    const volumeSlider = document.getElementById('videoVolume');
    const fullscreenBtn = document.getElementById('videoFullscreen');
    const forward10Btn = document.getElementById('videoForward10');
    const backward10Btn = document.getElementById('videoBackward10');
    
    // Play/Pause
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (video.paused) {
                video.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }
    
    // Actualizar barra de progreso
    video.addEventListener('timeupdate', function() {
        if (progressBar) {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = progress + '%';
        }
    });
    
    // Click en la barra de progreso
    if (progressBar && progressBar.parentElement) {
        progressBar.parentElement.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });
    }
    
    // Silenciar/Activar sonido
    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
    }
    
    // Control de volumen
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            video.volume = this.value;
        });
    }
    
    // Pantalla completa
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
        });
    }
    
    // Adelantar 10 segundos
    if (forward10Btn) {
        forward10Btn.addEventListener('click', function() {
            video.currentTime = Math.min(video.currentTime + 10, video.duration);
        });
    }
    
    // Retroceder 10 segundos
    if (backward10Btn) {
        backward10Btn.addEventListener('click', function() {
            video.currentTime = Math.max(video.currentTime - 10, 0);
        });
    }
    
    // Atajos de teclado
    const handleKeydown = function(e) {
        if (document.getElementById('lightbox').classList.contains('active')) {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    if (playPauseBtn) playPauseBtn.click();
                    break;
                case 'ArrowRight':
                    video.currentTime = Math.min(video.currentTime + 10, video.duration);
                    break;
                case 'ArrowLeft':
                    video.currentTime = Math.max(video.currentTime - 10, 0);
                    break;
                case 'ArrowUp':
                    video.volume = Math.min(video.volume + 0.1, 1);
                    if (volumeSlider) volumeSlider.value = video.volume;
                    break;
                case 'ArrowDown':
                    video.volume = Math.max(video.volume - 0.1, 0);
                    if (volumeSlider) volumeSlider.value = video.volume;
                    break;
                case 'f':
                    if (fullscreenBtn) fullscreenBtn.click();
                    break;
            }
        }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    // Limpiar event listener cuando se cierra el lightbox
    const originalCloseLightbox = closeLightbox;
    closeLightbox = function() {
        document.removeEventListener('keydown', handleKeydown);
        document.getElementById('lightbox').classList.remove('active');
        closeLightbox = originalCloseLightbox;
    };
}
// Función para renderizar el calendario
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonth = app.currentDate.getMonth();
    const currentYear = app.currentDate.getFullYear();
    
    // Actualizar título del calendario
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calendarTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Actualizar selectores
    document.getElementById('monthSelect').value = currentMonth;
    document.getElementById('yearSelect').value = currentYear;
    
    // Limpiar calendario
    calendarGrid.innerHTML = '';
    
    // Agregar encabezados de días
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Obtener el primer día del mes y el número de días
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Agregar días del mes anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = createDayElement(daysInPrevMonth - i, currentMonth - 1, currentYear, true);
        calendarGrid.appendChild(dayElement);
    }
    
    // Agregar días del mes actual
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const dayElement = createDayElement(i, currentMonth, currentYear, false, isToday);
        calendarGrid.appendChild(dayElement);
    }
    
    // Agregar días del siguiente mes
    const totalCells = calendarGrid.children.length - 7; // Restar los encabezados
    const remainingCells = 42 - totalCells; // 6 semanas × 7 días
    for (let i = 1; i <= remainingCells; i++) {
        const dayElement = createDayElement(i, currentMonth + 1, currentYear, true);
        calendarGrid.appendChild(dayElement);
    }
}

// Función para crear un elemento de día del calendario
function createDayElement(day, month, year, isOtherMonth, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('calendar-other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('calendar-today');
    }
    
    // Ajustar mes y año si es de otro mes
    let actualMonth = month;
    let actualYear = year;
    
    if (month < 0) {
        actualMonth = 11;
        actualYear = year - 1;
    } else if (month > 11) {
        actualMonth = 0;
        actualYear = year + 1;
    }
    
    // Crear fecha para comparar
    const dateStr = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Agregar número del día
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Agregar eventos del día
    const dayEvents = document.createElement('div');
    dayEvents.className = 'calendar-day-events';
    
    const events = app.events.filter(event => event.date === dateStr);
    events.slice(0, 3).forEach((event, index) => {
        const eventContainer = document.createElement('div');
        eventContainer.style.position = 'relative';
        
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        eventElement.textContent = event.title;
        eventElement.title = `${event.title}${event.time ? ` a las ${event.time}` : ''}`;
        eventElement.onclick = function(e) {
            e.stopPropagation();
            openEditEventModal(event.id);
        };
        
        // Agregar botón de eliminar evento
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'calendar-event-action';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.title = 'Eliminar evento';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteCalendarEvent(event.id);
        };
        
        eventContainer.appendChild(eventElement);
        eventContainer.appendChild(deleteBtn);
        dayEvents.appendChild(eventContainer);
    });
    
    if (events.length > 3) {
        const moreElement = document.createElement('div');
        moreElement.className = 'calendar-event';
        moreElement.textContent = `+${events.length - 3} más`;
        moreElement.title = `Hay ${events.length} eventos en este día`;
        dayEvents.appendChild(moreElement);
    }
    
    dayElement.appendChild(dayEvents);
    
    // Agregar evento de clic para agregar un nuevo evento
    dayElement.addEventListener('click', function() {
        document.getElementById('eventDateInput').value = dateStr;
        openAddEventModal();
    });
    
    return dayElement;
}

// Función para navegar al mes actual
function goToToday() {
    app.currentDate = new Date();
    renderCalendar();
}

// Función para cambiar de mes
function changeMonth(direction) {
    app.currentDate.setMonth(app.currentDate.getMonth() + direction);
    renderCalendar();
}

// Función para actualizar el calendario desde los selectores
function updateCalendarFromSelects() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    
    app.currentDate.setMonth(month);
    app.currentDate.setFullYear(year);
    renderCalendar();
}

// Función para abrir el modal de agregar evento
function openAddEventModal() {
    app.currentEventId = null;
    document.getElementById('eventModalTitle').textContent = 'Agregar Evento';
    document.getElementById('eventTitleInput').value = '';
    document.getElementById('eventDescriptionInput').value = '';
    document.getElementById('eventDateInput').value = '';
    document.getElementById('eventTimeInput').value = '';
    document.getElementById('eventClientInput').value = '';
    document.getElementById('deleteEventBtn').style.display = 'none';
    
    // Actualizar lista de clientes
    const clientSelect = document.getElementById('eventClientInput');
    clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
        app.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
    
    document.getElementById('eventModal').classList.add('active');
}

// Función para abrir el modal de editar evento
function openEditEventModal(eventId) {
    app.currentEventId = eventId;
    const event = app.events.find(e => e.id === eventId);
    
    if (event) {
        document.getElementById('eventModalTitle').textContent = 'Editar Evento';
        document.getElementById('eventTitleInput').value = event.title;
        document.getElementById('eventDescriptionInput').value = event.description || '';
        document.getElementById('eventDateInput').value = event.date;
        document.getElementById('eventTimeInput').value = event.time || '';
        document.getElementById('eventClientInput').value = event.clientId || '';
        document.getElementById('deleteEventBtn').style.display = 'inline-block';
        
        // Actualizar lista de clientes
        const clientSelect = document.getElementById('eventClientInput');
        clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
            app.clients.map(client => `<option value="${client.id}" ${client.id == event.clientId ? 'selected' : ''}>${client.name}</option>`).join('');
        
        document.getElementById('eventModal').classList.add('active');
    }
}

// Función para cerrar el modal de evento
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

// Función para guardar un evento
function saveEvent() {
    const title = document.getElementById('eventTitleInput').value.trim();
    const description = document.getElementById('eventDescriptionInput').value.trim();
    const date = document.getElementById('eventDateInput').value;
    const time = document.getElementById('eventTimeInput').value;
    const clientId = document.getElementById('eventClientInput').value;
    
    if (!title || !date) {
        showToast('Por favor, complete los campos obligatorios', 'error');
        return;
    }
    
    const eventData = {
        title,
        description,
        date,
        time,
        clientId: clientId ? parseInt(clientId) : null,
        lastUpdated: new Date().toISOString()
    };
    
    if (app.currentEventId) {
        // Editar evento existente
        const index = app.events.findIndex(e => e.id === app.currentEventId);
        if (index !== -1) {
            app.events[index] = { ...app.events[index], ...eventData };
            showToast('Evento actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo evento
        const newEvent = {
            id: Date.now(),
            ...eventData,
            createdAt: new Date().toISOString()
        };
        app.events.push(newEvent);
        showToast('Evento agregado correctamente', 'success');
    }
    
    closeEventModal();
    renderCalendar();
    saveToLocalStorage();
}

// Función para eliminar el evento actual
function deleteCurrentEvent() {
    if (app.currentEventId) {
        showConfirm(
            'Eliminar Evento',
            '¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer.',
            () => {
                app.events = app.events.filter(event => event.id !== app.currentEventId);
                showToast('Evento eliminado correctamente', 'success');
                closeEventModal();
                renderCalendar();
                saveToLocalStorage();
            }
        );
    }
}

// Función para eliminar un evento del calendario
function deleteCalendarEvent(eventId) {
    showConfirm(
        'Eliminar Evento',
        '¿Está seguro de que desea eliminar este evento?',
        () => {
            app.events = app.events.filter(event => event.id !== eventId);
            renderCalendar();
            saveToLocalStorage();
            showToast('Evento eliminado correctamente', 'success');
        }
    );
}
// Función para renderizar los reportes
function renderReports() {
    // Reporte de clientes por estado
    renderClientsByStatusChart();
    
    // Reporte de trabajos por material
    renderJobsByMaterialChart();
    
    // Reporte de ingresos mensuales
    renderMonthlyIncomeChart();
    
    // Reporte de ganancias
    renderProfitsChart();
    
    // Actualizar estadísticas
    updateStatistics();
}

// Función para renderizar el gráfico de clientes por estado
function renderClientsByStatusChart() {
    const canvas = document.getElementById('clientsByStatusChart');
    const ctx = canvas.getContext('2d');
    
    // Contar clientes por estado
    const statusCounts = {
        seguimiento: 0,
        cerrado: 0,
        pendiente: 0
    };
    
    app.clients.forEach(client => {
        if (statusCounts.hasOwnProperty(client.status)) {
            statusCounts[client.status]++;
        }
    });
    
    // Preparar datos para el gráfico
    const labels = ['Seguimiento', 'Cerrado', 'Pendiente'];
    const data = [statusCounts.seguimiento, statusCounts.cerrado, statusCounts.pendiente];
    const colors = ['rgba(23, 162, 184, 0.7)', 'rgba(40, 167, 69, 0.7)', 'rgba(255, 193, 7, 0.7)'];
    
    // Destruir gráfico existente si hay uno
    if (app.charts.clientsByStatus) {
        app.charts.clientsByStatus.destroy();
    }
    
    // Crear nuevo gráfico
    app.charts.clientsByStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Distribución de Clientes por Estado'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para renderizar el gráfico de trabajos por material
function renderJobsByMaterialChart() {
    const canvas = document.getElementById('jobsByMaterialChart');
    const ctx = canvas.getContext('2d');
    
    // Contar trabajos por material
    const materialCounts = {};
    
    app.jobs.forEach(job => {
        if (job.material) {
            materialCounts[job.material] = (materialCounts[job.material] || 0) + 1;
        }
    });
    
    // Preparar datos para el gráfico
    const labels = Object.keys(materialCounts);
    const data = Object.values(materialCounts);
    
    // Destruir gráfico existente si hay uno
    if (app.charts.jobsByMaterial) {
        app.charts.jobsByMaterial.destroy();
    }
    
    // Crear nuevo gráfico
    app.charts.jobsByMaterial = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Trabajos',
                data: data,
                backgroundColor: 'rgba(74, 111, 220, 0.7)',
                borderColor: 'rgba(74, 111, 220, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Trabajos por Material'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para renderizar el gráfico de ingresos mensuales
function renderMonthlyIncomeChart() {
    const canvas = document.getElementById('monthlyIncomeChart');
    const ctx = canvas.getContext('2d');
    
    // Agrupar trabajos por mes y calcular ingresos
    const monthlyIncome = {};
    
    app.jobs.forEach(job => {
        if (job.calculator && job.calculator.finalPrice) {
            const date = new Date(job.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyIncome[monthKey]) {
                monthlyIncome[monthKey] = 0;
            }
            
            monthlyIncome[monthKey] += job.calculator.finalPrice;
        }
    });
    
    // Preparar datos para el gráfico
    const sortedMonths = Object.keys(monthlyIncome).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    });
    const data = sortedMonths.map(month => monthlyIncome[month]);
    
    // Destruir gráfico existente si hay uno
    if (app.charts.monthlyIncome) {
        app.charts.monthlyIncome.destroy();
    }
    
    // Crear nuevo gráfico
    app.charts.monthlyIncome = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos (₡)',
                data: data,
                backgroundColor: 'rgba(74, 111, 220, 0.2)',
                borderColor: 'rgba(74, 111, 220, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₡' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Ingresos Mensuales'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ₡${value.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

// Función para renderizar el gráfico de ganancias
function renderProfitsChart() {
    const canvas = document.getElementById('profitsChart');
    const ctx = canvas.getContext('2d');
    
    // Calcular ganancias por trabajo
    const profits = [];
    
    app.jobs.forEach(job => {
        if (job.calculator && job.calculator.finalPrice) {
            const totalCost = (job.calculator.providerCost || 0) + 
                             (job.calculator.packagingCost || 0) + 
                             (job.calculator.publicity || 0) + 
                             (job.calculator.services || 0) + 
                             (job.calculator.installationCost || 0) + 
                             (job.calculator.transport || 0);
            
            const profit = job.calculator.finalPrice - totalCost;
            profits.push(profit);
        }
    });
    
    // Agrupar ganancias por rango
    const profitRanges = {
        'Negativa': 0,
        '0-10%': 0,
        '10-25%': 0,
        '25-50%': 0,
        '50%+': 0
    };
    
    app.jobs.forEach(job => {
        if (job.calculator && job.calculator.finalPrice) {
            const totalCost = (job.calculator.providerCost || 0) + 
                             (job.calculator.packagingCost || 0) + 
                             (job.calculator.publicity || 0) + 
                             (job.calculator.services || 0) + 
                             (job.calculator.installationCost || 0) + 
                             (job.calculator.transport || 0);
            
            const profit = job.calculator.finalPrice - totalCost;
            const profitPercentage = job.calculator.finalPrice > 0 ? (profit / job.calculator.finalPrice * 100) : 0;
            
            if (profit < 0) {
                profitRanges['Negativa']++;
            } else if (profitPercentage < 10) {
                profitRanges['0-10%']++;
            } else if (profitPercentage < 25) {
                profitRanges['10-25%']++;
            } else if (profitPercentage < 50) {
                profitRanges['25-50%']++;
            } else {
                profitRanges['50%+']++;
            }
        }
    });
    
    // Preparar datos para el gráfico
    const labels = Object.keys(profitRanges);
    const data = Object.values(profitRanges);
    
    // Destruir gráfico existente si hay uno
    if (app.charts.profits) {
        app.charts.profits.destroy();
    }
    
    // Crear nuevo gráfico
    app.charts.profits = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(32, 201, 151, 0.7)',
                    'rgba(23, 162, 184, 0.7)',
                    'rgba(40, 167, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(220, 53, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(32, 201, 151, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Distribución de Ganancias'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar las estadísticas
function updateStatistics() {
    // Estadísticas de clientes
    const totalClients = app.clients.length;
    const activeClients = app.clients.filter(client => client.status === 'seguimiento').length;
    
    document.getElementById('totalClientsStat').textContent = totalClients;
    document.getElementById('activeClientsStat').textContent = activeClients;
    
    // Estadísticas de trabajos
    const totalJobs = app.jobs.length;
    const completedJobs = app.jobs.filter(job => job.status === 'cerrado').length;
    
    document.getElementById('totalJobsStat').textContent = totalJobs;
    document.getElementById('completedJobsStat').textContent = completedJobs;
    
    // Estadísticas de ingresos
    let totalIncome = 0;
    let totalProfit = 0;
    let totalCost = 0;
    
    app.jobs.forEach(job => {
        if (job.calculator && job.calculator.finalPrice) {
            totalIncome += job.calculator.finalPrice;
            
            const jobCost = (job.calculator.providerCost || 0) + 
                           (job.calculator.packagingCost || 0) + 
                           (job.calculator.publicity || 0) + 
                           (job.calculator.services || 0) + 
                           (job.calculator.installationCost || 0) + 
                           (job.calculator.transport || 0);
            
            totalCost += jobCost;
            totalProfit += (job.calculator.finalPrice - jobCost);
        }
    });
    
    const avgIncome = totalJobs > 0 ? totalIncome / totalJobs : 0;
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome * 100) : 0;
    
    document.getElementById('totalIncomeStat').textContent = `₡${totalIncome.toFixed(2)}`;
    document.getElementById('avgIncomeStat').textContent = `₡${avgIncome.toFixed(2)}`;
    document.getElementById('totalProfitStat').textContent = `₡${totalProfit.toFixed(2)}`;
    document.getElementById('profitMarginStat').textContent = `${profitMargin.toFixed(2)}%`;
}

// Función para exportar un reporte
function exportReport(reportType, format) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `reporte_${reportType}_${dateStr}_${timeStr}`;
    
    // Guardar el reporte en el almacenamiento
    const reportData = {
        type: reportType,
        format: format,
        date: now.toISOString(),
        data: getReportData(reportType)
    };
    
    app.reports.push(reportData);
    
    // Guardar reporte por fecha
    if (!app.reportsByDate[dateStr]) {
        app.reportsByDate[dateStr] = [];
    }
    app.reportsByDate[dateStr].push(reportData);
    
    saveToLocalStorage();
    
    if (format === 'pdf') {
        exportReportAsPDF(reportType, fileName);
    } else if (format === 'html') {
        exportReportAsHTML(reportType, fileName);
    } else if (format === 'image') {
        exportReportAsImage(reportType, fileName);
    }
    
    showToast(`Reporte ${reportType} exportado como ${format.toUpperCase()}`, 'success');
}

// Función para obtener los datos de un reporte
function getReportData(reportType) {
    switch (reportType) {
        case 'clientsByStatus':
            const statusCounts = {
                seguimiento: 0,
                cerrado: 0,
                pendiente: 0
            };
            
            app.clients.forEach(client => {
                if (statusCounts.hasOwnProperty(client.status)) {
                    statusCounts[client.status]++;
                }
            });
            
            return {
                title: 'Clientes por Estado',
                data: statusCounts,
                total: app.clients.length
            };
            
        case 'jobsByMaterial':
            const materialCounts = {};
            
            app.jobs.forEach(job => {
                if (job.material) {
                    materialCounts[job.material] = (materialCounts[job.material] || 0) + 1;
                }
            });
            
            return {
                title: 'Trabajos por Material',
                data: materialCounts,
                total: app.jobs.length
            };
            
        case 'monthlyIncome':
            const monthlyIncome = {};
            
            app.jobs.forEach(job => {
                if (job.calculator && job.calculator.finalPrice) {
                    const date = new Date(job.createdAt);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (!monthlyIncome[monthKey]) {
                        monthlyIncome[monthKey] = 0;
                    }
                    
                    monthlyIncome[monthKey] += job.calculator.finalPrice;
                }
            });
            
            return {
                title: 'Ingresos Mensuales',
                data: monthlyIncome,
                total: Object.values(monthlyIncome).reduce((sum, val) => sum + val, 0)
            };
            
        case 'profits':
            const profitRanges = {
                'Negativa': 0,
                '0-10%': 0,
                '10-25%': 0,
                '25-50%': 0,
                '50%+': 0
            };
            
            app.jobs.forEach(job => {
                if (job.calculator && job.calculator.finalPrice) {
                    const totalCost = (job.calculator.providerCost || 0) + 
                                     (job.calculator.packagingCost || 0) + 
                                     (job.calculator.publicity || 0) + 
                                     (job.calculator.services || 0) + 
                                     (job.calculator.installationCost || 0) + 
                                     (job.calculator.transport || 0);
                    
                    const profit = job.calculator.finalPrice - totalCost;
                    const profitPercentage = job.calculator.finalPrice > 0 ? (profit / job.calculator.finalPrice * 100) : 0;
                    
                    if (profit < 0) {
                        profitRanges['Negativa']++;
                    } else if (profitPercentage < 10) {
                        profitRanges['0-10%']++;
                    } else if (profitPercentage < 25) {
                        profitRanges['10-25%']++;
                    } else if (profitPercentage < 50) {
                        profitRanges['25-50%']++;
                    } else {
                        profitRanges['50%+']++;
                    }
                }
            });
            
            return {
                title: 'Distribución de Ganancias',
                data: profitRanges,
                total: app.jobs.length
            };
            
        default:
            return null;
    }
}

// Función para exportar reporte como PDF
function exportReportAsPDF(reportType, fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const reportData = getReportData(reportType);
    
    // Agregar título
    doc.setFontSize(18);
    doc.text(reportData.title, 105, 20, { align: 'center' });
    
    // Agregar fecha
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Agregar datos
    let yPosition = 50;
    
    if (reportType === 'clientsByStatus' || reportType === 'profits') {
        // Para reportes de distribución
        Object.entries(reportData.data).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, 20, yPosition);
            yPosition += 10;
        });
    } else if (reportType === 'jobsByMaterial') {
        // Para reportes de materiales
        Object.entries(reportData.data).forEach(([material, count]) => {
            doc.text(`${material}: ${count} trabajos`, 20, yPosition);
            yPosition += 10;
        });
    } else if (reportType === 'monthlyIncome') {
        // Para reportes de ingresos mensuales
        Object.entries(reportData.data).forEach(([month, income]) => {
            doc.text(`${month}: ₡${income.toFixed(2)}`, 20, yPosition);
            yPosition += 10;
        });
    }
    
    // Agregar total
    doc.text(`Total: ${reportData.total}`, 20, yPosition + 10);
    
    // Guardar el PDF
    doc.save(`${fileName}.pdf`);
}

// Función para exportar reporte como HTML
function exportReportAsHTML(reportType, fileName) {
    const reportData = getReportData(reportType);
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportData.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>${reportData.title}</h1>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
            
            <table>
                <tr>
                    <th>Categoría</th>
                    <th>Valor</th>
                </tr>
    `;
    
    if (reportType === 'clientsByStatus' || reportType === 'profits') {
        // Para reportes de distribución
        Object.entries(reportData.data).forEach(([key, value]) => {
            htmlContent += `
                <tr>
                    <td>${key}</td>
                    <td>${value}</td>
                </tr>
            `;
        });
    } else if (reportType === 'jobsByMaterial') {
        // Para reportes de materiales
        Object.entries(reportData.data).forEach(([material, count]) => {
            htmlContent += `
                <tr>
                    <td>${material}</td>
                    <td>${count} trabajos</td>
                </tr>
            `;
        });
    } else if (reportType === 'monthlyIncome') {
        // Para reportes de ingresos mensuales
        Object.entries(reportData.data).forEach(([month, income]) => {
            htmlContent += `
                <tr>
                    <td>${month}</td>
                    <td>₡${income.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    htmlContent += `
            </table>
            <div class="total">Total: ${reportData.total}</div>
        </body>
        </html>
    `;
    
    // Crear un blob y descargar
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Función para exportar reporte como imagen
function exportReportAsImage(reportType, fileName) {
    const reportCard = document.querySelector(`#${reportType}Chart`).closest('.report-card');
    
    html2canvas(reportCard).then(canvas => {
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Función para abrir el modal de filtros
function openFilterModal() {
    renderMaterials();
    renderStatuses();
    renderCompanies();
    document.getElementById('filterModal').classList.add('active');
}

// Función para cerrar el modal de filtros
function closeFilterModal() {
    document.getElementById('filterModal').classList.remove('active');
}

// Función para renderizar materiales
function renderMaterials() {
    const materialsList = document.getElementById('materialsList');
    const materials = app.filters.materials;
    
    if (materials.length === 0) {
        materialsList.innerHTML = '<p>No hay materiales configurados</p>';
        return;
    }
    
    materialsList.innerHTML = materials.map((material, index) => `
        <div class="filter-item">
            <input type="text" class="form-control" value="${material.name}" data-index="${index}">
            <button class="btn btn-danger btn-sm" onclick="removeMaterial(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Función para renderizar estados
function renderStatuses() {
    const statusList = document.getElementById('statusList');
    const statuses = app.filters.statuses;
    
    if (statuses.length === 0) {
        statusList.innerHTML = '<p>No hay estados configurados</p>';
        return;
    }
    
    statusList.innerHTML = statuses.map((status, index) => `
        <div class="filter-item">
            <input type="text" class="form-control" value="${status.name}" data-index="${index}">
            <button class="btn btn-danger btn-sm" onclick="removeStatus(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Función para renderizar empresas
function renderCompanies() {
    const companiesList = document.getElementById('companiesList');
    const companies = app.filters.companies;
    
    if (companies.length === 0) {
        companiesList.innerHTML = '<p>No hay empresas configuradas</p>';
        return;
    }
    
    companiesList.innerHTML = companies.map((company, index) => `
        <div class="filter-item">
            <input type="text" class="form-control" value="${company.name}" data-index="${index}">
            <button class="btn btn-danger btn-sm" onclick="removeCompany(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Función para agregar un material
function addMaterial() {
    const materialsList = document.getElementById('materialsList');
    const newIndex = app.filters.materials.length;
    
    const newMaterialItem = document.createElement('div');
    newMaterialItem.className = 'filter-item';
    newMaterialItem.innerHTML = `
        <input type="text" class="form-control" placeholder="Nombre del material" data-index="${newIndex}">
        <button class="btn btn-danger btn-sm" onclick="removeMaterial(${newIndex})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    materialsList.appendChild(newMaterialItem);
    
    // Añadir filtro temporal
    app.filters.materials.push({
        id: Date.now(),
        name: ''
    });
}

// Función para agregar un estado
function addStatus() {
    const statusList = document.getElementById('statusList');
    const newIndex = app.filters.statuses.length;
    
    const newStatusItem = document.createElement('div');
    newStatusItem.className = 'filter-item';
    newStatusItem.innerHTML = `
        <input type="text" class="form-control" placeholder="Nombre del estado" data-index="${newIndex}">
        <button class="btn btn-danger btn-sm" onclick="removeStatus(${newIndex})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    statusList.appendChild(newStatusItem);
    
    // Añadir filtro temporal
    app.filters.statuses.push({
        id: Date.now(),
        name: ''
    });
}

// Función para agregar una empresa
function addCompany() {
    const companiesList = document.getElementById('companiesList');
    const newIndex = app.filters.companies.length;
    
    const newCompanyItem = document.createElement('div');
    newCompanyItem.className = 'filter-item';
    newCompanyItem.innerHTML = `
        <input type="text" class="form-control" placeholder="Nombre de la empresa" data-index="${newIndex}">
        <button class="btn btn-danger btn-sm" onclick="removeCompany(${newIndex})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    companiesList.appendChild(newCompanyItem);
    
    // Añadir empresa temporal
    app.filters.companies.push({
        id: Date.now(),
        name: ''
    });
}

// Función para eliminar un material
function removeMaterial(index) {
    app.filters.materials.splice(index, 1);
    renderMaterials();
}

// Función para eliminar un estado
function removeStatus(index) {
    app.filters.statuses.splice(index, 1);
    renderStatuses();
}

// Función para eliminar una empresa
function removeCompany(index) {
    app.filters.companies.splice(index, 1);
    renderCompanies();
}

// Función para guardar los filtros (CORREGIDA)
function saveFilters() {
    const materialInputs = document.querySelectorAll('#materialsList input');
    const statusInputs = document.querySelectorAll('#statusList input');
    const companyInputs = document.querySelectorAll('#companiesList input');
    
    // Actualizar materiales
    materialInputs.forEach((input, index) => {
        const filterIndex = parseInt(input.getAttribute('data-index'));
        if (app.filters.materials[filterIndex]) {
            app.filters.materials[filterIndex].name = input.value.trim();
        }
    });
    
    // Actualizar estados
    statusInputs.forEach((input, index) => {
        const filterIndex = parseInt(input.getAttribute('data-index'));
        if (app.filters.statuses[filterIndex]) {
            app.filters.statuses[filterIndex].name = input.value.trim();
        }
    });
    
    // Actualizar empresas
    companyInputs.forEach((input, index) => {
        const filterIndex = parseInt(input.getAttribute('data-index'));
        if (app.filters.companies[filterIndex]) {
            app.filters.companies[filterIndex].name = input.value.trim();
        }
    });
    
    // Eliminar filtros vacíos
    app.filters.materials = app.filters.materials.filter(material => material.name.trim() !== '');
    app.filters.statuses = app.filters.statuses.filter(status => status.name.trim() !== '');
    app.filters.companies = app.filters.companies.filter(company => company.name.trim() !== '');
    
    // Actualizar selectores
    updateFilterSelects();
    updateCompanyFilter();
    
    closeFilterModal();
    saveToLocalStorage();
    showToast('Filtros actualizados correctamente', 'success');
}

// Función para actualizar el filtro de empresas
function updateCompanyFilter() {
    const companyFilter = document.getElementById('companyFilter');
    const companiesList = document.getElementById('companiesList');
    
    // Obtener todas las empresas únicas
    const companies = [...new Set(app.clients.map(client => client.company).filter(company => company))];
    
    // Limpiar selectores
    companyFilter.innerHTML = '<option value="">Todas las empresas</option>';
    companiesList.innerHTML = '';
    
    // Agregar opciones
    companies.forEach(company => {
        const option1 = document.createElement('option');
        option1.value = company;
        option1.textContent = company;
        companyFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = company;
        companiesList.appendChild(option2);
    });
}

// Función para actualizar los selectores de filtros
function updateFilterSelects() {
    const materialFilter = document.getElementById('materialFilter');
    const jobMaterialInput = document.getElementById('jobMaterialInput');
    const statusFilter = document.getElementById('statusFilter');
    const jobStatusInput = document.getElementById('jobStatusInput');
    
    // Limpiar selectores
    materialFilter.innerHTML = '<option value="">Todos los materiales</option>';
    jobMaterialInput.innerHTML = '<option value="">Seleccionar material</option>';
    statusFilter.innerHTML = '<option value="">Todos los estados</option>';
    jobStatusInput.innerHTML = '<option value="">Seleccionar estado</option>';
    
    // Agregar opciones de materiales
    app.filters.materials.forEach(material => {
        const option1 = document.createElement('option');
        option1.value = material.name;
        option1.textContent = material.name;
        materialFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = material.name;
        option2.textContent = material.name;
        jobMaterialInput.appendChild(option2);
    });
    
    // Agregar opciones de estados
    app.filters.statuses.forEach(status => {
        const option1 = document.createElement('option');
        option1.value = status.name;
        option1.textContent = status.name.charAt(0).toUpperCase() + status.name.slice(1);
        statusFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = status.name;
        option2.textContent = status.name.charAt(0).toUpperCase() + status.name.slice(1);
        jobStatusInput.appendChild(option2);
    });
}

// Función para filtrar clientes
function filterClients() {
    renderClients();
}

// Función para limpiar filtros
function clearFilters() {
    document.getElementById('clientSearchInput').value = '';
    document.getElementById('companyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('materialFilter').value = '';
    document.getElementById('alphabeticalFilter').value = '';
    
    renderClients();
    showToast('Filtros limpiados', 'info');
}

// Función para abrir el modal de la calculadora
function openCalculatorModal(jobId) {
    app.currentJobId = jobId;
    const job = app.jobs.find(j => j.id === jobId);
    
    if (job && job.calculator) {
        // Cargar datos guardados
        document.getElementById('publicityInput').value = job.calculator.publicity || 400;
        document.getElementById('servicesInput').value = job.calculator.services || 200;
        document.getElementById('transportInput').value = job.calculator.transport || 1000;
        document.getElementById('providerCostInput').value = job.calculator.providerCost || 0;
        document.getElementById('packagingCostInput').value = job.calculator.packagingCost || 0;
        document.getElementById('designCostInput').value = job.calculator.designCost || 0;
        document.getElementById('installationCostInput').value = job.calculator.installationCost || 0;
        document.getElementById('profitMarginSelect').value = job.calculator.profitMargin || 20;
        document.getElementById('priceWithoutIvaInput').value = job.calculator.priceWithoutIva || 0;
        document.getElementById('ivaSelect').value = job.calculator.iva || 13;
        document.getElementById('finalPriceInput').value = job.calculator.finalPrice || 0;
    } else {
        // Valores predeterminados
        document.getElementById('publicityInput').value = 400;
        document.getElementById('servicesInput').value = 200;
        document.getElementById('transportInput').value = 1000;
        document.getElementById('providerCostInput').value = 0;
        document.getElementById('packagingCostInput').value = 0;
        document.getElementById('designCostInput').value = 0;
        document.getElementById('installationCostInput').value = 0;
        document.getElementById('profitMarginSelect').value = 20;
        document.getElementById('priceWithoutIvaInput').value = 0;
        document.getElementById('ivaSelect').value = 13;
        document.getElementById('finalPriceInput').value = 0;
    }
    
    // Calcular totales
    calculateTotals();
    
    document.getElementById('calculatorModal').classList.add('active');
}

// Función para cerrar el modal de la calculadora
function closeCalculatorModal() {
    document.getElementById('calculatorModal').classList.remove('active');
}

// Función para calcular totales en la calculadora
function calculateTotals() {
    const publicity = parseFloat(document.getElementById('publicityInput').value) || 0;
    const services = parseFloat(document.getElementById('servicesInput').value) || 0;
    const transport = parseFloat(document.getElementById('transportInput').value) || 0;
    const providerCost = parseFloat(document.getElementById('providerCostInput').value) || 0;
    const packagingCost = parseFloat(document.getElementById('packagingCostInput').value) || 0;
    const designCost = parseFloat(document.getElementById('designCostInput').value) || 0;
    const installationCost = parseFloat(document.getElementById('installationCostInput').value) || 0;
    
    const totalCost = publicity + services + transport + providerCost + packagingCost + designCost + installationCost;
    
    const profitMargin = parseFloat(document.getElementById('profitMarginSelect').value) || 0;
    const priceWithoutIva = parseFloat(document.getElementById('priceWithoutIvaInput').value) || 0;
    const iva = parseFloat(document.getElementById('ivaSelect').value) || 0;
    const finalPrice = parseFloat(document.getElementById('finalPriceInput').value) || 0;
    
    // Actualizar total de costos
    document.getElementById('totalCostResult').textContent = `₡${totalCost.toFixed(2)}`;
    
    // Calcular precio sin IVA si no está definido
    if (!priceWithoutIva && totalCost > 0) {
        const calculatedPriceWithoutIva = totalCost * (1 + profitMargin / 100);
        document.getElementById('priceWithoutIvaInput').value = calculatedPriceWithoutIva.toFixed(2);
    }
    
    // Calcular precio final si no está definido
    if (!finalPrice && priceWithoutIva > 0) {
        const calculatedFinalPrice = priceWithoutIva * (1 + iva / 100);
        document.getElementById('finalPriceInput').value = calculatedFinalPrice.toFixed(2);
    }
    
    // Calcular ganancia
    const profit = finalPrice - totalCost;
    const profitPercentage = totalCost > 0 ? (profit / totalCost * 100) : 0;
    
    document.getElementById('profitResult').textContent = `₡${profit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`;
}

// Función para guardar la calculadora
function saveCalculator() {
    if (!app.currentJobId) return;
    
    const job = app.jobs.find(j => j.id === app.currentJobId);
    if (job) {
        job.calculator = {
            publicity: parseFloat(document.getElementById('publicityInput').value) || 0,
            services: parseFloat(document.getElementById('servicesInput').value) || 0,
            transport: parseFloat(document.getElementById('transportInput').value) || 0,
            providerCost: parseFloat(document.getElementById('providerCostInput').value) || 0,
            packagingCost: parseFloat(document.getElementById('packagingCostInput').value) || 0,
            designCost: parseFloat(document.getElementById('designCostInput').value) || 0,
            installationCost: parseFloat(document.getElementById('installationCostInput').value) || 0,
            profitMargin: parseFloat(document.getElementById('profitMarginSelect').value) || 0,
            priceWithoutIva: parseFloat(document.getElementById('priceWithoutIvaInput').value) || 0,
            iva: parseFloat(document.getElementById('ivaSelect').value) || 0,
            finalPrice: parseFloat(document.getElementById('finalPriceInput').value) || 0,
            totalCost: parseFloat(document.getElementById('totalCostResult').textContent.replace('₡', '')) || 0
        };
        
        showToast('Cálculos guardados correctamente', 'success');
        closeCalculatorModal();
        saveToLocalStorage();
        
        // Si el modal de detalles está abierto, actualizarlo
        if (document.getElementById('jobDetailsModal').classList.contains('active')) {
            openJobDetailsModal(app.currentJobId);
        }
    }
}

// Función para cargar un archivo de base de datos
function loadDatabaseFile(e) {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const database = JSON.parse(event.target.result);
                app.clients = database.clients || [];
                app.jobs = database.jobs || [];
                app.events = database.events || [];
                app.filters = database.filters || {
                    materials: [],
                    statuses: [],
                    companies: []
                };
                app.reports = database.reports || [];
                app.reportsByDate = database.reportsByDate || {};
                
                // Guardar en localStorage
                localStorage.setItem('clientManagementDatabase', JSON.stringify(database));
                
                // Actualizar selectores
                updateFilterSelects();
                updateCompanyFilter();
                
                // Actualizar vistas
                renderClients();
                renderCalendar();
                renderReports();
                
                app.databaseLoaded = true;
                showToast('Base de datos importada correctamente', 'success');
            } catch (error) {
                console.error('Error al cargar el archivo de base de datos:', error);
                showToast('Error al cargar el archivo de base de datos', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}