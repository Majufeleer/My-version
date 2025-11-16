// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAW-2fH8qFFYiY-9_8gkpjGU-LM7qchqCc",
    authDomain: "pagina-para-terapeuta.firebaseapp.com",
    databaseURL: "https://pagina-para-terapeuta-default-rtdb.firebaseio.com",
    projectId: "pagina-para-terapeuta",
    storageBucket: "pagina-para-terapeuta.firebasestorage.app",
    messagingSenderId: "638127291171",
    appId: "1:638127291171:web:1e15bf14bea029afc1ea96",
    measurementId: "G-W622BHY8HR"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Email de administrador
const ADMIN_EMAIL = "esthelasanchezaguirre@gmail.com";

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel-content');
const passwordForm = document.getElementById('password-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const cancelPasswordChange = document.getElementById('cancel-password-change');
const changePasswordForm = document.getElementById('change-password-form');
const passwordChangeError = document.getElementById('password-change-error');
const navItems = document.querySelectorAll('.nav-admin-item');
const tabContents = document.querySelectorAll('.tab-content');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Verificar estado de autenticación
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
        loadData();
    } else {
        showLoginScreen();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de login
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        // Iniciar sesión con Firebase Auth
        auth.signInWithEmailAndPassword(ADMIN_EMAIL, password)
            .then((userCredential) => {
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminPanel();
                loadData();
            })
            .catch((error) => {
                console.error("Error de autenticación:", error);
                loginError.style.display = 'block';
                setTimeout(() => {
                    loginError.style.display = 'none';
                }, 3000);
            });
    });
    
    // Logout
    logoutBtn.addEventListener('click', function() {
        auth.signOut().then(() => {
            localStorage.removeItem('adminLoggedIn');
            showLoginScreen();
        });
    });
    
    // Cambiar contraseña
    changePasswordBtn.addEventListener('click', function() {
        changePasswordModal.style.display = 'flex';
    });
    
    cancelPasswordChange.addEventListener('click', function() {
        changePasswordModal.style.display = 'none';
        changePasswordForm.reset();
        passwordChangeError.style.display = 'none';
    });
    
    changePasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validaciones
        if (newPassword !== confirmPassword) {
            passwordChangeError.textContent = "Las nuevas contraseñas no coinciden";
            passwordChangeError.style.display = 'block';
            return;
        }
        
        if (newPassword.length < 6) {
            passwordChangeError.textContent = "La contraseña debe tener al menos 6 caracteres";
            passwordChangeError.style.display = 'block';
            return;
        }
        
        // Reautenticar al usuario
        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(ADMIN_EMAIL, currentPassword);
        
        user.reauthenticateWithCredential(credential)
            .then(() => {
                // Cambiar contraseña
                user.updatePassword(newPassword)
                    .then(() => {
                        showAlert('Éxito', 'Contraseña cambiada correctamente');
                        changePasswordModal.style.display = 'none';
                        changePasswordForm.reset();
                    })
                    .catch((error) => {
                        console.error("Error al cambiar contraseña:", error);
                        passwordChangeError.textContent = "Error al cambiar la contraseña: " + error.message;
                        passwordChangeError.style.display = 'block';
                    });
            })
            .catch((error) => {
                console.error("Error de autenticación:", error);
                passwordChangeError.textContent = "La contraseña actual es incorrecta";
                passwordChangeError.style.display = 'block';
            });
    });
    
    // Navegación entre pestañas
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Actualizar navegación
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido correspondiente
            tabContents.forEach(tab => {
                tab.style.display = 'none';
            });
            document.getElementById(`tab-${tabId}`).style.display = 'block';
        });
    });
    
    // Formulario para bloquear fechas
    const blockDateForm = document.getElementById('block-date-form');
    if (blockDateForm) {
        blockDateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const date = document.getElementById('block-date').value;
            const reason = document.getElementById('block-reason').value;
            
            if (date) {
                try {
                    await db.collection('blocked_dates').add({
                        date: date,
                        reason: reason || 'Sin motivo especificado',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Mostrar mensaje de éxito
                    const successAlert = document.getElementById('block-success');
                    successAlert.style.display = 'block';
                    setTimeout(() => {
                        successAlert.style.display = 'none';
                    }, 3000);
                    
                    // Limpiar formulario
                    blockDateForm.reset();
                    
                    // Recargar fechas bloqueadas
                    loadBlockedDates();
                    
                } catch (error) {
                    console.error('Error al bloquear fecha:', error);
                    showAlert('Error', 'No se pudo bloquear la fecha. Intenta nuevamente.');
                }
            }
        });
    }
}

// Mostrar panel de administración
function showAdminPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
}

// Mostrar pantalla de login
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
    document.getElementById('admin-password').value = '';
}

// Cargar datos
function loadData() {
    loadAppointments();
    loadBlockedDates();
    loadStats();
}

// Cargar citas
async function loadAppointments() {
    try {
        const snapshot = await db.collection('appointments')
            .orderBy('timestamp', 'desc')
            .get();
        
        const tableBody = document.getElementById('reservations-table');
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">No hay citas registradas</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp ? new Date(data.timestamp.toDate()) : new Date();
            
            const row = `
                <tr>
                    <td>${data.nombre || 'No especificado'}</td>
                    <td>
                        <span class="badge bg-primary">${getServiceName(data.service)}</span>
                    </td>
                    <td>${formatDate(date)}</td>
                    <td>
                        <span class="badge bg-warning">Pendiente</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-success me-1" title="Confirmar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
        
    } catch (error) {
        console.error('Error al cargar citas:', error);
        document.getElementById('reservations-table').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">Error al cargar las citas</td>
            </tr>
        `;
    }
}

// Cargar fechas bloqueadas
async function loadBlockedDates() {
    try {
        const snapshot = await db.collection('blocked_dates')
            .orderBy('date', 'desc')
            .get();
        
        const tableBody = document.getElementById('blocked-dates-table');
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">No hay fechas bloqueadas</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = `
                <tr>
                    <td>${formatDisplayDate(data.date)}</td>
                    <td>${data.reason || 'Sin motivo'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="unblockDate('${doc.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
        
    } catch (error) {
        console.error('Error al cargar fechas bloqueadas:', error);
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        // Citas totales
        const appointmentsSnapshot = await db.collection('appointments').get();
        document.getElementById('total-citas').textContent = appointmentsSnapshot.size;
        
        // Fechas bloqueadas
        const blockedSnapshot = await db.collection('blocked_dates').get();
        document.getElementById('fechas-bloqueadas').textContent = blockedSnapshot.size;
        
        // Estadísticas de ejemplo (en una implementación real, estos vendrían de la base de datos)
        document.getElementById('citas-pendientes').textContent = Math.floor(appointmentsSnapshot.size * 0.7);
        document.getElementById('citas-confirmadas').textContent = Math.floor(appointmentsSnapshot.size * 0.3);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Desbloquear fecha
async function unblockDate(docId) {
    if (confirm('¿Estás seguro de que quieres desbloquear esta fecha?')) {
        try {
            await db.collection('blocked_dates').doc(docId).delete();
            loadBlockedDates();
            loadStats();
            showAlert('Éxito', 'Fecha desbloqueada correctamente');
        } catch (error) {
            console.error('Error al desbloquear fecha:', error);
            showAlert('Error', 'No se pudo desbloquear la fecha');
        }
    }
}

// Funciones auxiliares
function getServiceName(serviceKey) {
    const services = {
        'hipnosis': 'Hipnosis Terapéutica',
        'salud': 'Salud Integral',
        'conexion': 'Conexión Espiritual'
    };
    return services[serviceKey] || serviceKey;
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showAlert(title, message) {
    document.getElementById('custom-modal-title').textContent = title;
    document.getElementById('custom-modal-message').textContent = message;
    document.getElementById('custom-alert-modal').style.display = 'flex';
    
    document.getElementById('custom-modal-ok-btn').onclick = function() {
        document.getElementById('custom-alert-modal').style.display = 'none';
    };
}

// Cerrar modales al hacer clic fuera
document.getElementById('custom-alert-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

document.getElementById('change-password-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
        changePasswordForm.reset();
        passwordChangeError.style.display = 'none';
    }
});