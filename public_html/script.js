////////////// Configuración de Firebase
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

// Navegación entre secciones
document.addEventListener('DOMContentLoaded', function() {
    // Navegación principal
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // Menús desplegables - PERMITIR MÚLTIPLES ABIERTOS
    const navParents = document.querySelectorAll('.nav-parent');
    
    // Inicializar menús desplegables
    navParents.forEach(parent => {
        parent.addEventListener('click', function(e) {
            e.stopPropagation();
            const parentId = this.getAttribute('data-parent');
            const submenu = document.getElementById(`submenu-${parentId}`);
            
            // NO cerrar otros menús - permitir múltiples abiertos
            // Solo alternar el menú actual
            this.classList.toggle('active');
            submenu.classList.toggle('active');
        });
    });

    // Navegación para elementos regulares y sub-items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // No procesar clics en elementos padre (solo en sub-items)
            if (this.classList.contains('nav-parent')) {
                return;
            }
            
            const targetSection = this.getAttribute('data-section');
            if (!targetSection) return;
            
            // Actualizar navegación activa
            navItems.forEach(nav => {
                nav.classList.remove('active');
            });
            
            this.classList.add('active');
            
            // Mostrar sección correspondiente
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                    
                    // Si es la sección de citas, cargar desde Firebase
                    if (section.id === 'citas') {
                        loadAppointmentsFromFirebase();
                    }
                    
                    // Si es una sección de agendar cita, inicializar selectores de fecha
                    if (section.id === 'hipnosis' || section.id === 'salud') {
                        const serviceId = section.id;
                        setTimeout(() => {
                            initializeDateSelectors(serviceId);
                        }, 100);
                    }
                }
            });
        });
    });

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', function(e) {
        // Solo cerrar si no se hizo clic en un elemento del menú
        if (!e.target.closest('.sidebar')) {
            document.querySelectorAll('.nav-submenu').forEach(menu => {
                menu.classList.remove('active');
            });
            document.querySelectorAll('.nav-parent').forEach(parent => {
                parent.classList.remove('active');
            });
        }
    });

    // Inicializar formularios de agendar citas
    initializeBookingForms();
});

// Inicializar formularios de agendar citas
function initializeBookingForms() {
    // Crear formularios dinámicamente para cada servicio
    createBookingForm('hipnosis', 'Hipnosis Terapéutica', 1850);
    createBookingForm('salud', 'Salud Multidimensional', 2500);
    createCourseForm('conexion', 'Curso de Mantenimiento Espiritual', 3500);
}

// Crear formulario de agendar cita (Hipnosis y Salud)
function createBookingForm(serviceId, serviceName, price) {
    const formContainer = document.getElementById(`form-${serviceId}`);
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <form class="booking-form" id="booking-form-${serviceId}">
            <div class="form-group">
                <label for="name-${serviceId}">Nombre completo *</label>
                <input type="text" id="name-${serviceId}" name="name" required placeholder="Ingresa tu nombre completo">
            </div>
            
            <div class="form-group">
                <label for="email-${serviceId}">Correo electrónico *</label>
                <input type="email" id="email-${serviceId}" name="email" required placeholder="Ingresa tu correo electrónico">
            </div>
            
            <div class="form-group">
                <label class="date-selector-label">Fecha preferida *</label>
                <div class="date-selector-container">
                    <div class="date-selector-wrapper" id="date-selector-${serviceId}">
                        <!-- Los selectores de fecha se generan dinámicamente -->
                    </div>
                    <input type="hidden" id="selected-date-${serviceId}" name="selected-date" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Horario preferido *</label>
                <div class="time-slots-container" id="time-slots-${serviceId}">
                    <!-- Los horarios se generan dinámicamente según el día seleccionado -->
                </div>
                <input type="hidden" id="selected-time-${serviceId}" name="selected-time" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-draft" onclick="saveDraft('${serviceId}')">
                    Guardar borrador
                </button>
                <button type="button" class="btn-submit" onclick="submitBooking('${serviceId}', '${serviceName}', ${price})">
                    Agendar Cita
                </button>
            </div>
        </form>
    `;
    
    // Inicializar selectores de fecha
    setTimeout(() => {
        initializeDateSelectors(serviceId);
    }, 100);
}

// Crear formulario de curso (sin fecha, teléfono ni notas)
function createCourseForm(serviceId, serviceName, price) {
    const formContainer = document.getElementById(`form-${serviceId}`);
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <form class="booking-form" id="booking-form-${serviceId}">
            <div class="form-group">
                <label for="name-${serviceId}">Nombre completo *</label>
                <input type="text" id="name-${serviceId}" name="name" required placeholder="Ingresa tu nombre completo">
            </div>
            
            <div class="form-group">
                <label for="email-${serviceId}">Correo electrónico *</label>
                <input type="email" id="email-${serviceId}" name="email" required placeholder="Ingresa tu correo electrónico">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-draft" onclick="saveDraft('${serviceId}')">
                    Guardar borrador
                </button>
                <button type="button" class="btn-submit" onclick="submitBooking('${serviceId}', '${serviceName}', ${price})">
                    Comprar Curso
                </button>
            </div>
        </form>
    `;
}

// Función para verificar si un día ya pasó según las reglas de horarios
function isDayExpired(date) {
    const today = new Date();
    const currentHour = today.getHours();
    const dayOfWeek = date.getDay();
    
    // Si no es hoy, el día sigue disponible
    if (date.toDateString() !== today.toDateString()) {
        return false;
    }
    
    // Reglas para hoy:
    // - Lunes a Viernes: después de las 5 PM desaparece
    // - Sábados: después de las 4 PM desaparece
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
        return currentHour >= 17; // 5 PM
    } else if (dayOfWeek === 6) { // Sábados
        return currentHour >= 16; // 4 PM
    }
    
    return false;
}

// Inicializar selectores de fecha (como en la imagen)
function initializeDateSelectors(serviceId) {
    const dateSelectorContainer = document.getElementById(`date-selector-${serviceId}`);
    const hiddenInput = document.getElementById(`selected-date-${serviceId}`);
    
    if (!dateSelectorContainer) return;
    
    // Limpiar contenedor
    dateSelectorContainer.innerHTML = '';
    hiddenInput.value = '';
    
    // Generar selectores para los próximos 6 días hábiles (excluyendo domingos, días pasados y días expirados)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparación
    
    const daysToShow = 6;
    let daysAdded = 0;
    let currentDay = 0;
    
    while (daysAdded < daysToShow) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + currentDay);
        
        // Solo agregar días que:
        // 1. No sean domingos (0)
        // 2. No sean del pasado 
        // 3. No estén expirados según las reglas de horarios
        if (currentDate.getDay() !== 0 && 
            currentDate >= today && 
            !isDayExpired(currentDate)) {
            
            const day = currentDate.getDate();
            const month = getMonthName(currentDate.getMonth());
            const year = currentDate.getFullYear();
            const dateString = formatDate(currentDate);
            
            const dateElement = document.createElement('div');
            dateElement.className = 'date-selector';
            dateElement.setAttribute('data-date', dateString);
            
            dateElement.innerHTML = `
                <div class="date-day">${day}</div>
                <div class="date-month">${month}</div>
                <div class="date-year">${year}</div>
            `;
            
            dateElement.addEventListener('click', function() {
                // Remover selección anterior
                document.querySelectorAll(`#date-selector-${serviceId} .date-selector`).forEach(d => {
                    d.classList.remove('selected');
                });
                
                // Seleccionar actual
                this.classList.add('selected');
                hiddenInput.value = this.getAttribute('data-date');
                
                // Actualizar horarios disponibles
                updateTimeSlots(hiddenInput.value, serviceId);
            });
            
            dateSelectorContainer.appendChild(dateElement);
            daysAdded++;
        }
        currentDay++;
    }
    
    // Seleccionar la primera fecha por defecto (si hay fechas disponibles)
    const firstDateSelector = dateSelectorContainer.querySelector('.date-selector');
    if (firstDateSelector) {
        firstDateSelector.click();
    }
}

// Obtener nombre del mes
function getMonthName(monthIndex) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[monthIndex];
}

// Formatear fecha como YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Función corregida para parsear fecha sin problemas de zona horaria
function parseDateWithoutTimezone(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Crear fecha en hora local (sin problemas de UTC)
    return new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
}

// Actualizar horarios disponibles según el día seleccionado - CORREGIDA
function updateTimeSlots(dateString, serviceId) {
    const timeSlotsContainer = document.getElementById(`time-slots-${serviceId}`);
    const hiddenInput = document.getElementById(`selected-time-${serviceId}`);
    
    if (!dateString) {
        timeSlotsContainer.innerHTML = '<div class="no-slots">Selecciona una fecha primero</div>';
        return;
    }
    
    // CORRECCIÓN: Usar parseDateWithoutTimezone para evitar problemas de zona horaria
    const selectedDate = parseDateWithoutTimezone(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparación justa
    
    // Si es hoy, verificar qué horarios todavía están disponibles
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();
    
    // CORRECCIÓN: Usar parseDateWithoutTimezone aquí también
    const date = parseDateWithoutTimezone(dateString);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    console.log(`Fecha: ${dateString}, Día de la semana: ${dayOfWeek}, Nombre: ${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dayOfWeek]}`);
    
    let availableSlots = [];
    
    // Lógica basada en el día de la semana
    if (dayOfWeek === 6) { // SÁBADOS - solo 3:00 PM y 4:00 PM
        availableSlots = [
            { time: '15:00', display: '03:00 PM', hour: 15 },
            { time: '16:00', display: '04:00 PM', hour: 16 }
        ];
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // LUNES A VIERNES - todos los horarios
        availableSlots = [
            { time: '10:00', display: '10:00 AM', hour: 10 },
            { time: '11:00', display: '11:00 AM', hour: 11 },
            { time: '15:00', display: '03:00 PM', hour: 15 },
            { time: '17:00', display: '05:00 PM', hour: 17 }
        ];
    }
    // DOMINGOS (0) - no se muestran, por eso no hay condición
    
    // Filtrar horarios pasados si es hoy
    if (isToday) {
        availableSlots = availableSlots.filter(slot => {
            return slot.hour > currentHour || (slot.hour === currentHour && currentMinutes < 30);
        });
    }
    
    // Limpiar contenedor
    timeSlotsContainer.innerHTML = '';
    hiddenInput.value = '';
    
    if (availableSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="no-slots">No hay horarios disponibles para este día</div>';
        return;
    }
    
    // Crear botones de horarios
    availableSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.setAttribute('data-time', slot.time);
        slotElement.textContent = slot.display;
        
        slotElement.addEventListener('click', function() {
            // Remover selección anterior
            document.querySelectorAll(`#time-slots-${serviceId} .time-slot`).forEach(s => {
                s.classList.remove('selected');
            });
            
            // Seleccionar actual
            this.classList.add('selected');
            hiddenInput.value = this.getAttribute('data-time');
        });
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

// Enviar reserva
function submitBooking(serviceId, serviceName, price) {
    const form = document.getElementById(`booking-form-${serviceId}`);
    
    // Validar formulario
    if (!validateForm(serviceId)) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    // Para servicios con fecha, validar que tenga horario seleccionado
    if (serviceId !== 'conexion') {
        const dateInput = document.getElementById(`selected-date-${serviceId}`);
        const timeInput = document.getElementById(`selected-time-${serviceId}`);
        
        if (!timeInput.value) {
            alert('Por favor selecciona un horario disponible.');
            return;
        }
        
        // Validar que no se seleccione un horario pasado
        const selectedDate = parseDateWithoutTimezone(dateInput.value);
        const today = new Date();
        
        if (selectedDate.toDateString() === today.toDateString()) {
            const selectedTime = timeInput.value;
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const selectedDateTime = new Date();
            selectedDateTime.setHours(hours, minutes, 0, 0);
            
            if (selectedDateTime < today) {
                alert('No puedes seleccionar un horario que ya pasó. Por favor elige otro horario.');
                return;
            }
        }
    }
    
    // Preparar datos de la reserva
    const bookingData = {
        service: serviceName,
        price: price,
        customer: {
            name: document.getElementById(`name-${serviceId}`).value,
            email: document.getElementById(`email-${serviceId}`).value
        },
        type: serviceId === 'conexion' ? 'course' : 'appointment',
        status: 'pending',
        createdAt: new Date().toISOString(),
        reference: generateBookingReference()
    };
    
    // Solo agregar datos de cita si no es curso
    if (serviceId !== 'conexion') {
        bookingData.appointment = {
            date: document.getElementById(`selected-date-${serviceId}`).value,
            time: document.getElementById(`selected-time-${serviceId}`).value
        };
    }
    
    // Guardar en Firebase
    saveBookingToFirebase(bookingData);
    
    // Simular proceso de pago
    simulatePayment(bookingData);
}

// Guardar reserva en Firebase
function saveBookingToFirebase(bookingData) {
    db.collection('bookings').add(bookingData)
        .then((docRef) => {
            console.log('Reserva guardada con ID:', docRef.id);
            // Limpiar formulario después de guardar
            clearForm(bookingData.type === 'course' ? 'conexion' : bookingData.service.includes('Hipnosis') ? 'hipnosis' : 'salud');
            // Recargar citas si es una cita
            if (bookingData.type === 'appointment') {
                loadAppointmentsFromFirebase();
            }
        })
        .catch((error) => {
            console.error('Error al guardar reserva:', error);
            alert('Error al guardar la reserva. Por favor intenta de nuevo.');
        });
}

// Cargar citas desde Firebase
function loadAppointmentsFromFirebase() {
    const calendarContainer = document.getElementById('weekly-calendar');
    if (!calendarContainer) return;
    
    // Mostrar mensaje de carga
    calendarContainer.innerHTML = '<div class="no-citas">Cargando citas...</div>';
    
    db.collection('bookings')
        .where('type', '==', 'appointment')
        .where('status', 'in', ['pending', 'confirmed', 'paid'])
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            const appointments = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appointments.push({
                    id: doc.id,
                    ...data
                });
            });
            
            // Generar calendario con las citas
            generateWeeklyCalendar(appointments);
        })
        .catch((error) => {
            console.error('Error al cargar citas:', error);
            generateWeeklyCalendar([]);
        });
}

// Generar calendario semanal
function generateWeeklyCalendar(appointments = []) {
    const calendarContainer = document.getElementById('weekly-calendar');
    if (!calendarContainer) return;
    
    const today = new Date();
    const currentDay = today.getDay();
    const startDate = new Date(today);
    
    // Ajustar al lunes de la semana actual
    startDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    let calendarHTML = `
        <div class="calendar-header">
            <h3>Semana del ${formatDate(startDate)}</h3>
        </div>
        <div class="week-days">
    `;
    
    // Generar días de lunes a sábado
    for (let i = 0; i < 6; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayName = weekDays[i];
        const dateStr = formatDate(currentDate);
        const dayAppointments = appointments.filter(apt => 
            apt.appointment && apt.appointment.date === dateStr
        );
        
        calendarHTML += `
            <div class="day-column">
                <div class="day-header">${dayName}<br>${formatDayMonth(currentDate)}</div>
                <div class="appointments-list">
        `;
        
        if (dayAppointments.length > 0) {
            dayAppointments.forEach(apt => {
                calendarHTML += `
                    <div class="appointment-item">
                        <div class="apt-time">${apt.appointment.time}</div>
                        <div class="apt-service">${apt.service}</div>
                        <div class="apt-name">Ocupado</div>
                        <div class="apt-status ${apt.status === 'paid' ? 'status-paid' : 'status-pending'}">
                            ${apt.status === 'paid' ? 'Confirmada' : 'Pendiente'}
                        </div>
                    </div>
                `;
            });
        } else {
            calendarHTML += '<div class="no-appointments">Sin citas</div>';
        }
        
        calendarHTML += `
                </div>
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
}

// Validar formulario
function validateForm(serviceId) {
    const requiredFields = [
        `name-${serviceId}`,
        `email-${serviceId}`
    ];
    
    // Para servicios que no son cursos, validar campos adicionales
    if (serviceId !== 'conexion') {
        requiredFields.push(`selected-date-${serviceId}`, `selected-time-${serviceId}`);
    }
    
    for (let fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            // Marcar campos visibles con borde rojo
            if (fieldId.includes('name') || fieldId.includes('email')) {
                field.style.borderColor = '#d32f2f';
            }
            return false;
        } else {
            // Restaurar borde normal
            if (fieldId.includes('name') || fieldId.includes('email')) {
                field.style.borderColor = '#ddd';
            }
        }
    }
    return true;
}

// Simular proceso de pago
function simulatePayment(bookingData) {
    if (bookingData.type === 'course') {
        alert(`¡Curso reservado exitosamente!\n\nCurso: ${bookingData.service}\nPrecio: $${bookingData.price} MXN\nCliente: ${bookingData.customer.name}\n\nTe contactaremos pronto con los detalles del curso.`);
    } else {
        alert(`¡Cita agendada exitosamente!\n\nServicio: ${bookingData.service}\nFecha: ${bookingData.appointment.date}\nHora: ${bookingData.appointment.time}\nPrecio: $${bookingData.price} MXN\n\nTe contactaremos pronto para confirmar.`);
    }
}

// Generar referencia única para la reserva
function generateBookingReference() {
    return 'REF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Guardar borrador
function saveDraft(serviceId) {
    const formData = {
        name: document.getElementById(`name-${serviceId}`).value,
        email: document.getElementById(`email-${serviceId}`).value
    };
    
    // Solo guardar campos adicionales para servicios que no son cursos
    if (serviceId !== 'conexion') {
        formData.date = document.getElementById(`selected-date-${serviceId}`).value;
        formData.time = document.getElementById(`selected-time-${serviceId}`).value;
    }
    
    localStorage.setItem(`draft-${serviceId}`, JSON.stringify(formData));
    alert('Borrador guardado correctamente');
}

// Limpiar formulario después de enviar
function clearForm(serviceId) {
    // Limpiar campos de texto
    document.getElementById(`name-${serviceId}`).value = '';
    document.getElementById(`email-${serviceId}`).value = '';
    
    // Limpiar selección de horarios y fechas
    if (serviceId !== 'conexion') {
        document.querySelectorAll(`#time-slots-${serviceId} .time-slot`).forEach(slot => {
            slot.classList.remove('selected');
        });
        document.querySelectorAll(`#date-selector-${serviceId} .date-selector`).forEach(selector => {
            selector.classList.remove('selected');
        });
        document.getElementById(`selected-time-${serviceId}`).value = '';
        document.getElementById(`selected-date-${serviceId}`).value = '';
        
        // Re-inicializar selectores de fecha
        setTimeout(() => {
            initializeDateSelectors(serviceId);
        }, 100);
    }
    
    // Eliminar borrador
    localStorage.removeItem(`draft-${serviceId}`);
}

// Formatear día y mes (ej: "20 Oct")
function formatDayMonth(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}