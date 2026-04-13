/* ================================ */
/* SCRIPT PRINCIPAL - BOLSUR */
/* Sistema de Gestión de Pedidos */
/* ================================ */

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar iconos de Lucide
    lucide.createIcons();
    
    // Configurar funcionalidades
    initSidebar();
    initStatusChange();
    initPrintButton();
    initEmailButton();
});


/* ================================ */
/* SIDEBAR / MENÚ LATERAL */
/* ================================ */

/**
 * Configura el toggle del sidebar para dispositivos móviles
 */
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
        
        // Cerrar sidebar al hacer clic fuera de él
        document.addEventListener('click', function(event) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
}


/* ================================ */
/* CAMBIO DE ESTADO DEL PEDIDO */
/* ================================ */

/**
 * Configura la funcionalidad para cambiar el estado del pedido
 */
function initStatusChange() {
    const updateBtn = document.getElementById('updateStatusBtn');
    const statusSelect = document.getElementById('statusSelect');
    
    if (updateBtn && statusSelect) {
        updateBtn.addEventListener('click', function() {
            const newStatus = statusSelect.value;
            const statusLabels = {
                'pending': 'Pendiente',
                'in-progress': 'En Proceso',
                'finished': 'Terminado',
                'delivered': 'Entregado'
            };
            
            // Mostrar confirmación
            const confirmed = confirm(`¿Cambiar el estado del pedido a "${statusLabels[newStatus]}"?`);
            
            if (confirmed) {
                // Actualizar el badge de estado en la UI
                updateStatusBadge(newStatus);
                
                // Actualizar el timeline
                updateTimeline(newStatus);
                
                // Mostrar mensaje de éxito
                showNotification(`Estado actualizado a: ${statusLabels[newStatus]}`, 'success');
                
                // Aquí iría la llamada al servidor para guardar el cambio
                console.log('Estado actualizado:', newStatus);
            }
        });
    }
}

/**
 * Actualiza el badge de estado en la UI
 * @param {string} status - Nuevo estado del pedido
 */
function updateStatusBadge(status) {
    const badge = document.querySelector('.status-badge');
    if (!badge) return;
    
    // Remover todas las clases de estado
    badge.classList.remove('status-pending', 'status-in-progress', 'status-finished', 'status-delivered');
    
    // Agregar la nueva clase
    badge.classList.add(`status-${status}`);
    
    // Actualizar el contenido
    const icons = {
        'pending': '<i data-lucide="clock"></i>',
        'in-progress': '<i data-lucide="loader-2" class="spin"></i>',
        'finished': '<i data-lucide="check-circle-2"></i>',
        'delivered': '<i data-lucide="truck"></i>'
    };
    
    const labels = {
        'pending': 'Pendiente',
        'in-progress': 'En Proceso',
        'finished': 'Terminado',
        'delivered': 'Entregado'
    };
    
    badge.innerHTML = `${icons[status]} ${labels[status]}`;
    
    // Reinicializar iconos de Lucide
    lucide.createIcons();
}

/**
 * Actualiza el timeline de progreso según el estado
 * @param {string} status - Nuevo estado del pedido
 */
function updateTimeline(status) {
    const steps = document.querySelectorAll('.timeline-step');
    const statusOrder = ['pending', 'in-progress', 'finished', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    
    steps.forEach((step, index) => {
        step.classList.remove('completed', 'active');
        
        if (index < currentIndex) {
            step.classList.add('completed');
            // Actualizar indicador a check
            const indicator = step.querySelector('.step-indicator');
            indicator.innerHTML = '<i data-lucide="check"></i>';
        } else if (index === currentIndex) {
            step.classList.add('active');
            const indicator = step.querySelector('.step-indicator');
            indicator.innerHTML = `<span>${index + 1}</span>`;
        } else {
            const indicator = step.querySelector('.step-indicator');
            indicator.innerHTML = `<span>${index + 1}</span>`;
        }
    });
    
    // Reinicializar iconos
    lucide.createIcons();
}


/* ================================ */
/* IMPRIMIR PEDIDO */
/* ================================ */

/**
 * Configura el botón de impresión
 */
function initPrintButton() {
    const printBtn = document.querySelector('.btn-outline:has([data-lucide="printer"])');
    
    // Alternativa si :has() no está soportado
    const buttons = document.querySelectorAll('.btn-outline');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Imprimir')) {
            btn.addEventListener('click', handlePrint);
        }
    });
}

/**
 * Maneja la acción de imprimir
 */
function handlePrint() {
    // Preparar estilos para impresión
    const printStyles = `
        <style>
            @media print {
                .sidebar, .top-header, .order-actions, .status-change, .menu-toggle {
                    display: none !important;
                }
                .main-content {
                    margin-left: 0 !important;
                }
                .order-grid {
                    grid-template-columns: 1fr !important;
                }
                body {
                    background: white !important;
                }
                .card {
                    break-inside: avoid;
                    box-shadow: none !important;
                    border: 1px solid #ddd !important;
                }
            }
        </style>
    `;
    
    // Agregar estilos temporalmente
    const styleElement = document.createElement('div');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement.firstChild);
    
    // Imprimir
    window.print();
    
    showNotification('Enviando a impresora...', 'info');
}


/* ================================ */
/* ENVIAR POR CORREO */
/* ================================ */

/**
 * Configura el botón de envío por correo
 */
function initEmailButton() {
    const buttons = document.querySelectorAll('.btn-outline');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Enviar')) {
            btn.addEventListener('click', handleEmail);
        }
    });
}

/**
 * Maneja la acción de enviar por correo
 */
function handleEmail() {
    // Obtener datos del pedido
    const orderNumber = document.querySelector('.order-number').textContent;
    const clientEmail = 'contacto@elsabor.com'; // En producción, obtener de los datos
    
    // Simular envío
    const confirmed = confirm(`¿Enviar el pedido ${orderNumber} al correo ${clientEmail}?`);
    
    if (confirmed) {
        // Aquí iría la llamada al servidor para enviar el correo
        showNotification(`Correo enviado a ${clientEmail}`, 'success');
        console.log('Enviando correo a:', clientEmail);
    }
}


/* ================================ */
/* NOTIFICACIONES */
/* ================================ */

/**
 * Muestra una notificación temporal en pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'info', 'warning'
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        background-color: ${type === 'success' ? 'hsl(142, 70%, 40%)' : 
                          type === 'error' ? 'hsl(0, 70%, 50%)' : 
                          type === 'warning' ? 'hsl(38, 92%, 50%)' : 
                          'hsl(210, 80%, 55%)'};
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Botón de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;
    
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        removeNotification(notification);
    }, 4000);
}

/**
 * Remueve una notificación con animación
 * @param {HTMLElement} notification - Elemento de notificación a remover
 */
function removeNotification(notification) {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}


/* ================================ */
/* UTILIDADES */
/* ================================ */

/**
 * Formatea un número como moneda mexicana
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

/**
 * Formatea una fecha en formato legible
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

/**
 * Calcula los días restantes hasta una fecha
 * @param {Date} targetDate - Fecha objetivo
 * @returns {number} Número de días restantes
 */
function getDaysRemaining(targetDate) {
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}


/* ================================ */
/* DATOS DE EJEMPLO (Para pruebas) */
/* ================================ */

// En producción, estos datos vendrían del servidor
const sampleOrder = {
    id: '3',
    orderNumber: 'PED-2024-003',
    clientName: 'Restaurante El Sabor',
    clientEmail: 'contacto@elsabor.com',
    clientPhone: '555-123-4567',
    status: 'in-progress',
    createdAt: new Date('2024-01-15'),
    deliveryDate: new Date('2024-01-18'),
    items: [
        {
            productName: 'Bolsa Kraft Grande',
            specs: '40 x 50 cm',
            service: 'Impresión a Color',
            quantity: 500,
            unitPrice: 3.50,
            total: 1750
        },
        {
            productName: 'Bolsa Kraft Mediana',
            specs: '30 x 40 cm',
            service: 'Venta Directa',
            quantity: 200,
            unitPrice: 2.80,
            total: 560
        }
    ],
    subtotal: 2310,
    tax: 369.60,
    total: 2679.60,
    notes: 'Cliente requiere impresión a una tinta en color azul marino. Entregar antes de las 2:00 PM del día de entrega.',
    createdBy: 'María García',
    assignedTo: 'Juan López'
};

// Exponer funciones globalmente para debugging
window.bolsurApp = {
    showNotification,
    formatCurrency,
    formatDate,
    getDaysRemaining,
    sampleOrder
};
