let currentOrdersData = [];
const socket = io();

// DOM Elements
const connectionDot = document.getElementById('connection-dot');
const connectionStatus = document.getElementById('connection-status');
const qrContainer = document.getElementById('qr-container');
const qrcodeElement = document.getElementById('qrcode');

// Tab Switching
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.add('active');

        // Immediately fetch data for the active tab
        fetchData();
    });
});

// Socket Events
socket.on('connect', () => {
    updateConnection(true, 'Connected to Server');
});

socket.on('disconnect', () => {
    updateConnection(false, 'Disconnected');
    setDashboardBotStatus(false);
});

socket.on('status', (data) => {
    updateConnection(true, data.message);
    if (data.isConnected !== undefined) {
        setDashboardBotStatus(data.isConnected);
    }
});

socket.on('qr', (qrCode) => {
    updateConnection(false, 'Waiting for WhatsApp Scan');
    setDashboardBotStatus(false);
    qrContainer.style.display = 'block';
    qrcodeElement.innerHTML = '';
    new QRCode(qrcodeElement, {
        text: qrCode,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
    });
});

socket.on('ready', (info) => {
    updateConnection(true, 'Bot is Ready');
    setDashboardBotStatus(true);
    qrContainer.style.display = 'none';
    showToast('WhatsApp Bot is successfully connected and ready!');
});

function updateConnection(isConnected, text) {
    connectionDot.className = `dot ${isConnected ? 'connected' : 'disconnected'}`;
    connectionStatus.textContent = text;
}

function setDashboardBotStatus(isConnected) {
    const waCard = document.getElementById('wa-status-card');
    const waStatus = document.getElementById('stat-wa-status');
    const qrCont = document.getElementById('qr-container');
    
    if (waCard && waStatus) {
        if (isConnected) {
            waCard.style.borderLeftColor = 'var(--success)';
            waStatus.style.color = 'var(--success)';
            waStatus.textContent = 'Connected ✅';
            if (qrCont) qrCont.style.display = 'none';
        } else {
            waCard.style.borderLeftColor = 'var(--danger)';
            waStatus.style.color = 'var(--danger)';
            waStatus.textContent = 'Disconnected ❌';
        }
    }
}

// Modal Logic
const modal = document.getElementById('add-driver-modal');
const btnAddDriver = document.getElementById('btn-add-driver');
const btnCloseModal = document.getElementById('close-modal');
const btnCancelDriver = document.getElementById('cancel-driver');
const btnSubmitDriver = document.getElementById('submit-driver');

btnAddDriver.addEventListener('click', () => modal.classList.add('active'));
const closeModal = () => modal.classList.remove('active');
btnCloseModal.addEventListener('click', closeModal);
btnCancelDriver.addEventListener('click', closeModal);

const orderModal = document.getElementById('order-details-modal');
const btnCloseOrderModal = document.getElementById('close-order-modal');
const btnCloseOrder = document.getElementById('btn-close-order');
const closeOrderModal = () => orderModal.classList.remove('active');
btnCloseOrderModal.addEventListener('click', closeOrderModal);
btnCloseOrder.addEventListener('click', closeOrderModal);

btnSubmitDriver.addEventListener('click', async () => {
    const name = document.getElementById('driver-name').value;
    const phone = document.getElementById('driver-phone').value;

    if (!name || !phone) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch('/api/drivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });
        
        if (res.ok) {
            showToast('Driver added successfully!');
            document.getElementById('driver-name').value = '';
            document.getElementById('driver-phone').value = '';
            closeModal();
            fetchData();
        } else {
            showToast('Failed to add driver', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
});

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
    toast.textContent = message;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Data Fetching
async function fetchData() {
    try {
        // Fetch Stats
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();
        
        setDashboardBotStatus(stats.botConnected);

        document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
        document.getElementById('stat-completed').textContent = stats.completedOrders || 0;
        document.getElementById('stat-active-drivers').textContent = stats.activeDrivers || 0;
        document.getElementById('stat-queue').textContent = stats.queue || 0;

        // Check active tab
        const activeTab = document.querySelector('.nav-btn.active').getAttribute('data-target');
        
        if (activeTab === 'drivers') {
            const driversRes = await fetch('/api/drivers');
            const drivers = await driversRes.json();
            renderDrivers(drivers);
        } else if (activeTab === 'orders') {
            const ordersRes = await fetch('/api/orders');
            currentOrdersData = await ordersRes.json();
            renderOrders(currentOrdersData);
        }

    } catch (err) {
        console.error('Failed to fetch data:', err);
        setDashboardBotStatus(false);
    }
}

// Render Drivers
function renderDrivers(drivers) {
    const tbody = document.getElementById('drivers-tbody');
    tbody.innerHTML = '';
    
    if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No drivers found.</td></tr>';
        return;
    }

    drivers.forEach(driver => {
        const tr = document.createElement('tr');
        const statusClass = driver.status === 'On Duty' ? 'status-new' : 
                           driver.status === 'Busy' ? 'status-busy' : 'status-cancelled';
        
        let displayPhone = driver.phone;
        if (displayPhone && displayPhone.startsWith('8')) {
            displayPhone = '0' + displayPhone;
        } else if (displayPhone && displayPhone.startsWith('62')) {
            displayPhone = '0' + displayPhone.substring(2);
        }

        tr.innerHTML = `
            <td><strong>${driver.driverId}</strong></td>
            <td>${driver.name}</td>
            <td>${displayPhone}</td>
            <td><span class="status-badge ${statusClass}">${driver.status}</span></td>
            <td>${driver.todayOrders} orders</td>
            <td>
                <button class="danger-btn" onclick="deleteDriver('${driver.driverId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Orders
function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No orders found.</td></tr>';
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-new';
        if (o.status === 'DELIVERED') statusClass = 'status-delivered';
        if (o.status === 'CANCELLED') statusClass = 'status-cancelled';
        if (o.status === 'ASSIGNED') statusClass = 'status-busy';

        let displayPhone = o.customer.phone;
        if (displayPhone && displayPhone.length > 13) {
            if (o.orderType === 'Pengiriman' && o.pengiriman) displayPhone = o.pengiriman.nomorHpPengirim || displayPhone;
            if (o.orderType === 'Ojek' && o.ojek) displayPhone = o.ojek.nomorHp || displayPhone;
        }

        tr.innerHTML = `
            <td><strong>${o.orderNumber}</strong></td>
            <td>${o.orderType}</td>
            <td>${o.customer ? `${o.customer.name}<br><small style="color:var(--text-secondary)">${displayPhone}</small>` : 'Unknown'}</td>
            <td>${o.assignedDriver || '-'}</td>
            <td><span class="status-badge ${statusClass}">${o.status}</span></td>
            <td style="display: flex; gap: 8px;">
                <button class="primary-btn" style="padding: 6px 12px; font-size: 0.8rem;" onclick="viewOrderDetails('${o.orderNumber}')">View Details</button>
                ${o.status !== 'DELIVERED' && o.status !== 'CANCELLED' ? 
                  `<button class="danger-btn" onclick="cancelOrder('${o.orderNumber}')">Cancel</button>` : 
                  ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// View Order Details
window.viewOrderDetails = (orderNumber) => {
    const order = currentOrdersData.find(o => o.orderNumber === orderNumber);
    if (!order) return;

    let displayPhone = order.customer.phone;
    if (displayPhone && displayPhone.length > 13) {
        if (order.orderType === 'Pengiriman' && order.pengiriman) displayPhone = order.pengiriman.nomorHpPengirim || displayPhone;
        if (order.orderType === 'Ojek' && order.ojek) displayPhone = order.ojek.nomorHp || displayPhone;
    }

    let detailsHtml = `
        <div class="detail-grid">
            <div class="detail-box">
                <h4>Order Number</h4>
                <p><strong>${order.orderNumber}</strong></p>
                <p style="font-size:0.8rem; color:var(--text-secondary)">${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div class="detail-box">
                <h4>Status & Driver</h4>
                <p>${order.status}</p>
                <p style="font-size:0.8rem; color:var(--text-secondary)">Assigned: ${order.assignedDriver || 'None'}</p>
            </div>
            <div class="detail-box full-width">
                <h4>Customer Info</h4>
                <p>${order.customer.name} (${displayPhone})</p>
            </div>
    `;

    if (order.orderType === 'Pengiriman' && order.pengiriman) {
        detailsHtml += `
            <div class="detail-box full-width">
                <h4>📍 Pickup Address</h4>
                <p>${order.pengiriman.pickupAddress || order.pengiriman.lokasiPengambilan || '-'}</p>
            </div>
            <div class="detail-box full-width">
                <h4>🎯 Delivery Address</h4>
                <p>${order.pengiriman.deliveryAddress || order.pengiriman.lokasiPengantaran || '-'}</p>
            </div>
            <div class="detail-box">
                <h4>Item Details</h4>
                <p>${order.pengiriman.itemDescription || order.pengiriman.deskripsiPesanan || '-'}</p>
            </div>
            <div class="detail-box">
                <h4>Cost & Distance</h4>
                <p>Rp ${(order.pengiriman.price || 0).toLocaleString('id-ID')}</p>
                <p style="font-size:0.8rem; color:var(--text-secondary)">${order.pengiriman.distance || 0} km</p>
            </div>
        `;
    } else if (order.orderType === 'Ojek' && order.ojek) {
        detailsHtml += `
            <div class="detail-box full-width">
                <h4>📍 Pickup Address</h4>
                <p>${order.ojek.pickupAddress || order.ojek.lokasiJemput || '-'}</p>
            </div>
            <div class="detail-box full-width">
                <h4>🎯 Destination Address</h4>
                <p>${order.ojek.destinationAddress || order.ojek.lokasiTujuan || '-'}</p>
            </div>
            <div class="detail-box">
                <h4>Cost & Distance</h4>
                <p>Rp ${(order.ojek.price || 0).toLocaleString('id-ID')}</p>
                <p style="font-size:0.8rem; color:var(--text-secondary)">${order.ojek.distance || 0} km</p>
            </div>
        `;
    }

    detailsHtml += `</div>
        <h4>Order Timeline</h4>
        <div class="timeline-container">
    `;

    order.timeline.forEach(event => {
        detailsHtml += `
            <div class="timeline-item">
                <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                <div class="timeline-title">${event.status}</div>
                <div class="timeline-note">${event.note || ''}</div>
            </div>
        `;
    });

    detailsHtml += `</div>`;
    
    document.getElementById('order-details-body').innerHTML = detailsHtml;
    orderModal.classList.add('active');
};

// Delete Driver
window.deleteDriver = async (id) => {
    if (!confirm(`Are you sure you want to delete Driver ${id}?`)) return;
    
    try {
        const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast(`Driver ${id} deleted`);
            fetchData();
        }
    } catch (err) {
        showToast('Error deleting driver', 'error');
    }
};

// Cancel Order
window.cancelOrder = async (id) => {
    if (!confirm(`Are you sure you want to cancel Order ${id}?`)) return;
    
    try {
        const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast(`Order ${id} cancelled`);
            fetchData();
        }
    } catch (err) {
        showToast('Error cancelling order', 'error');
    }
};

// Auto-refresh data every 5 seconds
setInterval(fetchData, 5000);
fetchData();
