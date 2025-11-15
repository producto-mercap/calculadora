// JavaScript principal para funcionalidades comunes

// Toggle del sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
}

// Restaurar estado del sidebar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebar && isCollapsed) {
        sidebar.classList.add('collapsed');
    }
});

// Función auxiliar para formatear números
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) {
        return '-';
    }
    return parseFloat(num).toFixed(decimals);
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
}

// Función auxiliar para parsear fechas desde input
function parseDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString);
}

// Función para mostrar mensajes de error
function showError(message) {
    alert('Error: ' + message);
}

// Función para mostrar mensajes de éxito
function showSuccess(message) {
    alert('Éxito: ' + message);
}

