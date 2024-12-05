export function showToast(message, type = 'error', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const messageContainer = document.createElement('span');
    messageContainer.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => removeToast(toast);
    
    toast.appendChild(messageContainer);
    toast.appendChild(closeButton);
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
    setTimeout(() => toast.remove(), 300);
}