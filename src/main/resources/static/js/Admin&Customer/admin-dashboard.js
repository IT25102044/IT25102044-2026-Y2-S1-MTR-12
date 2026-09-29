// SnapPro - Admin Dashboard User & Booking Management

let allUsersList = [];
let userToDeleteId = null;

let allBookingsList = [];
let allBookingStatuses = [];
let allPaymentMethods = [];

function getDashboardForRole(role) {
    if (!role) return 'admin-dashboard.html';
    const normalizedRole = role.toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
    switch (normalizedRole) {
        case 'ADMIN':
        case 'SYSTEM_ADMIN':
        case 'ADMINISTRATOR':
            return 'admin-dashboard.html';
        case 'CUSTOMER':
        case 'CLIENT':
            return 'customer-dashboard.html';
        case 'CRO':
        case 'CLIENT_RELATIONS_OFFICER':
            return 'cro-dashboard.html';
        case 'MARKETING_MANAGER':
        case 'MARKETING':
        case 'MARKETINGMANAGER':
            return 'marketingManager-dashboard.html';
        case 'OPERATION_MANAGER':
        case 'OPERATIONS_MANAGER':
        case 'OPERATIONS':
        case 'OPERATIONMANAGER':
            return 'operationManager-dashboard.html';
        case 'PHOTOGRAPHER':
            return 'photographer.html';
        case 'EQUIPMENT_MANAGER':
        case 'EQUIPMENT':
            return 'equipment-dashboard.html';
        default:
            return 'customer-dashboard.html';
    }
}

// 1. Session Verification
async function checkAdminSession() {
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status && data.data) {
            const user = data.data;
            const normalizedRole = (user.role || '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');

            // Enforce Admin access
            if (normalizedRole !== 'ADMIN' && normalizedRole !== 'SYSTEM_ADMIN' && normalizedRole !== 'ADMINISTRATOR') {
                const target = getDashboardForRole(normalizedRole);
                window.location.href = target;
                return;
            }

            // Populate Admin info in sidebar
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System Admin';
            const firstLetter = user.firstName ? user.firstName.charAt(0).toUpperCase() : 'A';
            const lastLetter = user.lastName ? user.lastName.charAt(0).toUpperCase() : 'D';

            const nameEl = document.getElementById('adminName');
            if (nameEl) nameEl.textContent = fullName;

            const emailEl = document.getElementById('adminEmail');
            if (emailEl) emailEl.textContent = user.email || 'admin@snappro.com';

            const initialsEl = document.getElementById('adminInitials');
            if (initialsEl) initialsEl.textContent = `${firstLetter}${lastLetter}`;

            // Load initial User data
            loadUserStatistics();
            loadUsers();

            // Load initial Booking data
            loadBookingStatistics();
            loadBookingDropdownOptions();
            loadAdminBookings();

        } else {
            sessionStorage.setItem('postLoginRedirect', window.location.pathname);
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Session verification error:', error);
        window.location.href = 'login.html';
    }
}

// 2. Load User Statistics
async function loadUserStatistics() {
    try {
        const response = await fetch('/api/admin/users/statistics', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.status && data.data) {
            const s = data.data;
            const totalEl = document.getElementById('statTotalUsers');
            if (totalEl) totalEl.textContent = s.totalUsers;

            const activeEl = document.getElementById('statActiveUsers');
            if (activeEl) activeEl.textContent = s.activeUsers;

            const photoEl = document.getElementById('statPhotographers');
            if (photoEl) photoEl.textContent = s.photographers;

            const suspendedEl = document.getElementById('statSuspendedUsers');
            if (suspendedEl) suspendedEl.textContent = s.suspendedUsers;
        }
    } catch (err) {
        console.error('Error fetching statistics:', err);
    }
}

// 3. Load All Users Directory
async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/admin/users', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.status && Array.isArray(data.data)) {
            allUsersList = data.data;
            applyUserFilters();
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${data.message || 'Failed to load users.'}</td></tr>`;
        }
    } catch (err) {
        console.error('Error loading users:', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Unable to connect to the server.</td></tr>`;
    }
}

// 4. Filter & Search Users
function applyUserFilters() {
    const roleFilterEl = document.getElementById('userRoleFilter');
    const searchInputEl = document.getElementById('userSearchInput');

    const selectedRole = roleFilterEl ? roleFilterEl.value.trim().toUpperCase() : 'ALL';
    const searchQuery = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';

    const filtered = allUsersList.filter(u => {
        // Role matching
        let roleMatches = true;
        if (selectedRole !== 'ALL' && selectedRole !== 'ALL ROLES' && selectedRole !== '') {
            const userRole = (u.role || '').toUpperCase().replace(/[\s-]+/g, '_');
            const targetRole = selectedRole.replace(/[\s-]+/g, '_');
            roleMatches = userRole.includes(targetRole) || targetRole.includes(userRole);
        }

        // Search matching (name, email, mobile, id)
        let searchMatches = true;
        if (searchQuery) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
            const email = (u.email || '').toLowerCase();
            const mobile = (u.mobile || '').toLowerCase();
            const idStr = `#usr-${u.id}`.toLowerCase();
            searchMatches = fullName.includes(searchQuery) || email.includes(searchQuery) || mobile.includes(searchQuery) || idStr.includes(searchQuery);
        }

        return roleMatches && searchMatches;
    });

    renderUsersTable(filtered);
}

// 5. Render Users Table
function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No user accounts found matching your search.</td></tr>`;
        return;
    }

    let rowsHtml = '';
    users.forEach(u => {
        const role = u.role || 'Customer';
        const status = u.status || 'Active';
        const isSuspended = status.toUpperCase() !== 'ACTIVE';
        const statusBadgeClass = isSuspended ? 'badge-soft-danger' : 'badge-soft-success';

        let roleBadgeStyle = 'bg-light text-primary border';
        if (role.toUpperCase().includes('ADMIN')) roleBadgeStyle = 'bg-dark text-white border';
        else if (role.toUpperCase().includes('PHOTOGRAPHER')) roleBadgeStyle = 'bg-light text-dark border';
        else if (role.toUpperCase().includes('CRO')) roleBadgeStyle = 'bg-info-subtle text-info border';
        else if (role.toUpperCase().includes('MARKETING')) roleBadgeStyle = 'bg-warning-subtle text-warning border';
        else if (role.toUpperCase().includes('OPERATION')) roleBadgeStyle = 'bg-secondary-subtle text-secondary border';

        let regDate = 'N/A';
        if (u.createdAt) {
            try {
                regDate = new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) {
                regDate = u.createdAt.substring(0, 10);
            }
        }

        rowsHtml += `
            <tr>
                <td class="fw-semibold">#USR-${u.id}</td>
                <td>
                    <div class="fw-semibold">${escapeHtml(u.firstName || '')} ${escapeHtml(u.lastName || '')}</div>
                    <small class="text-muted">${escapeHtml(u.email || '')}</small>
                </td>
                <td>${escapeHtml(u.mobile || '-')}</td>
                <td><span class="badge ${roleBadgeStyle}">${escapeHtml(role)}</span></td>
                <td><span class="badge ${statusBadgeClass}">${escapeHtml(status)}</span></td>
                <td>${escapeHtml(regDate)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light border me-1" title="Edit User" onclick="openEditUserModal(${u.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Delete User" onclick="openDeleteUserModal(${u.id}, '${escapeForJs((u.firstName || '') + ' ' + (u.lastName || ''))}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

// 6. Handle Add New User
async function handleCreateUser(event) {
    if (event) event.preventDefault();

    const firstName = document.getElementById('addFirstName')?.value.trim();
    const lastName = document.getElementById('addLastName')?.value.trim();
    const email = document.getElementById('addEmail')?.value.trim();
    const mobile = document.getElementById('addMobile')?.value.trim();
    const role = document.getElementById('addUserRole')?.value.trim();
    const password = document.getElementById('addPassword')?.value.trim();

    // Frontend Validations
    if (!firstName || !lastName) {
        alert("Please provide both First Name and Last Name.");
        return;
    }
    if (!email) {
        alert("Please provide an Email Address.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address (e.g. name@snappro.lk).");
        return;
    }
    if (!mobile) {
        alert("Please provide a Mobile Number.");
        return;
    }
    if (!password || password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    const payload = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        mobile: mobile,
        role: role,
        password: password
    };

    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || "User account provisioned successfully!");

            // Close modal & reset
            const modalEl = document.getElementById('addUserModal');
            if (modalEl) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }
            document.getElementById('addUserForm')?.reset();

            // Refresh table & stats
            loadUsers();
            loadUserStatistics();
        } else {
            alert(data.message || "Failed to provision user.");
        }
    } catch (err) {
        console.error('Error creating user:', err);
        alert("An error occurred while connecting to the server.");
    }
}

// 7. Open Edit User Modal
function openEditUserModal(userId) {
    const user = allUsersList.find(u => u.id === userId);
    if (!user) {
        alert("User details not found.");
        return;
    }

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserRef').value = `${user.firstName || ''} ${user.lastName || ''} (#USR-${user.id})`;
    document.getElementById('editFirstName').value = user.firstName || '';
    document.getElementById('editLastName').value = user.lastName || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editMobile').value = user.mobile || '';
    document.getElementById('editPassword').value = '';

    // Set Role
    const roleSelect = document.getElementById('editUserRole');
    if (roleSelect) {
        const currentRole = (user.role || 'CUSTOMER').toUpperCase();
        for (let opt of roleSelect.options) {
            if (opt.value.toUpperCase() === currentRole || opt.text.toUpperCase().includes(currentRole)) {
                opt.selected = true;
                break;
            }
        }
    }

    // Set Status
    const statusSelect = document.getElementById('editUserStatus');
    if (statusSelect) {
        const currentStatus = (user.status || 'ACTIVE').toUpperCase();
        for (let opt of statusSelect.options) {
            if (opt.value.toUpperCase() === currentStatus || opt.text.toUpperCase().includes(currentStatus)) {
                opt.selected = true;
                break;
            }
        }
    }

    const modalEl = document.getElementById('editUserModal');
    if (modalEl) {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.show();
    }
}

// 8. Handle Update User
async function handleUpdateUser(event) {
    if (event) event.preventDefault();

    const userId = document.getElementById('editUserId')?.value;
    const firstName = document.getElementById('editFirstName')?.value.trim();
    const lastName = document.getElementById('editLastName')?.value.trim();
    const email = document.getElementById('editEmail')?.value.trim();
    const mobile = document.getElementById('editMobile')?.value.trim();
    const role = document.getElementById('editUserRole')?.value;
    const status = document.getElementById('editUserStatus')?.value;
    const password = document.getElementById('editPassword')?.value.trim();

    if (!firstName || !lastName) {
        alert("First Name and Last Name cannot be blank.");
        return;
    }
    if (!email) {
        alert("Email cannot be blank.");
        return;
    }

    const payload = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        mobile: mobile,
        role: role,
        status: status,
        password: password || null
    };

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || "User account updated successfully!");

            const modalEl = document.getElementById('editUserModal');
            if (modalEl) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }

            loadUsers();
            loadUserStatistics();
        } else {
            alert(data.message || "Failed to update user.");
        }
    } catch (err) {
        console.error('Error updating user:', err);
        alert("An error occurred while updating the user account.");
    }
}

// 9. Open Delete User Modal
function openDeleteUserModal(userId, userName) {
    userToDeleteId = userId;

    const modalBodyText = document.getElementById('deleteModalBodyText');
    if (modalBodyText) {
        modalBodyText.innerHTML = `Are you sure you want to permanently delete user account <strong>${escapeHtml(userName)} (#USR-${userId})</strong>?`;
    }

    const modalEl = document.getElementById('deleteUserModal');
    if (modalEl) {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.show();
    }
}

// 10. Confirm Delete User
async function handleConfirmDelete() {
    if (!userToDeleteId) return;

    try {
        const response = await fetch(`/api/admin/users/${userToDeleteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || "User account deleted successfully.");

            const modalEl = document.getElementById('deleteUserModal');
            if (modalEl) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }

            userToDeleteId = null;
            loadUsers();
            loadUserStatistics();
        } else {
            alert(data.message || "Failed to delete user account.");
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        alert("An error occurred while deleting the user account.");
    }
}

// 11. Sign Out
async function signOut() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        window.location.href = 'login.html';
    } catch (err) {
        window.location.href = 'login.html';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function escapeForJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ========================================================
// BOOKING MANAGEMENT FUNCTIONS
// ========================================================

// 12. Load Booking Statistics
async function loadBookingStatistics() {
    try {
        const response = await fetch('/api/admin/bookings/statistics', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.status && data.data) {
            const s = data.data;
            const totalEl = document.getElementById('statTotalBookings');
            if (totalEl) totalEl.textContent = s.totalBookings;

            const pendingEl = document.getElementById('statPendingBookings');
            if (pendingEl) pendingEl.textContent = s.pendingBookings;

            const confirmedEl = document.getElementById('statConfirmedBookings');
            if (confirmedEl) confirmedEl.textContent = s.confirmedBookings;

            const cancelledEl = document.getElementById('statCancelledBookings');
            if (cancelledEl) cancelledEl.textContent = s.cancelledBookings;
        }
    } catch (err) {
        console.error('Error fetching booking statistics:', err);
    }
}

// 13. Load Booking Dropdown Options (Statuses & Payment Methods)
async function loadBookingDropdownOptions() {
    try {
        const [statusRes, paymentRes] = await Promise.all([
            fetch('/api/admin/bookings/statuses', { method: 'GET', credentials: 'include' }),
            fetch('/api/admin/bookings/payment-methods', { method: 'GET', credentials: 'include' })
        ]);

        const statusData = await statusRes.json();
        const paymentData = await paymentRes.json();

        if (statusRes.ok && statusData.status && Array.isArray(statusData.data)) {
            allBookingStatuses = statusData.data;
        }
        if (paymentRes.ok && paymentData.status && Array.isArray(paymentData.data)) {
            allPaymentMethods = paymentData.data;
        }
    } catch (err) {
        console.error('Error loading dropdown options:', err);
    }
}

// 14. Load Admin Bookings Directory
async function loadAdminBookings() {
    const tableBody = document.getElementById('bookingsTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/admin/bookings', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.status && Array.isArray(data.data)) {
            allBookingsList = data.data;
            applyBookingFilters();
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${data.message || 'Failed to load bookings.'}</td></tr>`;
        }
    } catch (err) {
        console.error('Error loading bookings:', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Unable to connect to server.</td></tr>`;
    }
}

// 15. Apply Booking Filters
function applyBookingFilters() {
    const statusFilterEl = document.getElementById('bookingStatusFilter');
    const dateFilterEl = document.getElementById('bookingDateFilter');
    const searchInputEl = document.getElementById('bookingSearchInput');

    const selectedStatus = statusFilterEl ? statusFilterEl.value.trim().toUpperCase() : 'ALL';
    const selectedDate = dateFilterEl ? dateFilterEl.value.trim() : '';
    const searchQuery = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';

    const filtered = allBookingsList.filter(b => {
        // Status filter
        let statusMatches = true;
        if (selectedStatus !== 'ALL' && selectedStatus !== '') {
            const bStatus = (b.bookingStatus || '').toUpperCase();
            statusMatches = bStatus === selectedStatus;
        }

        // Date filter
        let dateMatches = true;
        if (selectedDate !== '') {
            dateMatches = b.eventDate === selectedDate;
        }

        // Search text matching
        let searchMatches = true;
        if (searchQuery) {
            const idStr = `#evt-${b.id}`.toLowerCase();
            const customerName = (b.customerName || '').toLowerCase();
            const customerEmail = (b.customerEmail || '').toLowerCase();
            const eventTitle = (b.eventTitle || '').toLowerCase();
            const eventLocation = (b.eventLocation || '').toLowerCase();
            const packageTitle = (b.packageTitle || '').toLowerCase();

            searchMatches = idStr.includes(searchQuery) ||
                customerName.includes(searchQuery) ||
                customerEmail.includes(searchQuery) ||
                eventTitle.includes(searchQuery) ||
                eventLocation.includes(searchQuery) ||
                packageTitle.includes(searchQuery);
        }

        return statusMatches && dateMatches && searchMatches;
    });

    renderBookingsTable(filtered);
}

// 16. Render Bookings Table
function renderBookingsTable(bookings) {
    const tableBody = document.getElementById('bookingsTableBody');
    if (!tableBody) return;

    if (bookings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No booking records found matching criteria.</td></tr>`;
        return;
    }

    let rowsHtml = '';
    bookings.forEach(b => {
        const status = (b.bookingStatus || 'Pending').toLowerCase();
        let badgeClass = 'badge-soft-warning';
        if (status === 'confirmed') badgeClass = 'badge-soft-success';
        else if (status === 'completed') badgeClass = 'badge-soft-primary';
        else if (status === 'cancelled') badgeClass = 'badge-soft-danger';

        const totalFormatted = Number(b.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const balanceVal = Number(b.balanceAmount || 0);
        const balanceFormatted = balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const startTimeFormatted = b.startTime ? b.startTime.substring(0, 5) : '';
        const endTimeFormatted = b.endTime ? b.endTime.substring(0, 5) : '';

        let eventDateStr = b.eventDate || 'Date TBD';
        try {
            eventDateStr = new Date(b.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {}

        rowsHtml += `
            <tr>
                <td class="fw-semibold">#EVT-${b.id}</td>
                <td>
                    <div class="fw-semibold">${escapeHtml(b.customerName || 'Customer')}</div>
                    <small class="text-muted">${escapeHtml(b.customerEmail || `CID: #USR-${b.customerId || '-'}`)}</small>
                </td>
                <td>
                    <div class="fw-semibold">${escapeHtml(b.eventTitle || 'Untitled Event')}</div>
                    <small class="text-muted">${escapeHtml(b.eventLocation || 'Location TBD')}</small>
                </td>
                <td>
                    ${escapeHtml(eventDateStr)}<br>
                    <small class="text-muted">${escapeHtml(startTimeFormatted)} - ${escapeHtml(endTimeFormatted)}</small>
                </td>
                <td>
                    <div>${escapeHtml(b.packageTitle || 'Custom Requirement Event')}</div>
                    <strong class="text-primary">LKR ${totalFormatted}</strong>
                    ${balanceVal > 0 ? `<div class="small text-warning fw-semibold mt-1">+ Bal: LKR ${balanceFormatted}</div>` : ''}
                </td>
                <td><span class="badge ${badgeClass}">${escapeHtml(b.bookingStatus || 'Pending')}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light border me-1" title="View Booking Details" onclick="openBookingDetailsModal(${b.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-light border" title="Edit Booking & Balance" onclick="openEditBookingModal(${b.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

// 17. Open Booking Details Modal
function openBookingDetailsModal(bookingId) {
    const booking = allBookingsList.find(b => b.id === bookingId);
    if (!booking) {
        alert("Booking details not found.");
        return;
    }

    let createdStr = booking.createdAt || '';
    try {
        createdStr = new Date(booking.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {}

    const totalVal = Number(booking.totalAmount || 0);
    const balanceVal = Number(booking.balanceAmount || 0);
    const overallPayable = totalVal + balanceVal;

    document.getElementById('detailBookingRef').textContent = `#EVT-${booking.id} - ${booking.eventTitle || 'Event Photography'}`;
    document.getElementById('detailCreatedAt').textContent = `Submitted on ${createdStr}`;
    document.getElementById('detailCustomerName').textContent = booking.customerName || 'Customer';
    document.getElementById('detailCustomerEmail').textContent = booking.customerEmail || 'Not provided';
    document.getElementById('detailCustomerMobile').textContent = booking.customerMobile || 'Not provided';
    document.getElementById('detailEventTitle').textContent = booking.eventTitle || '-';
    document.getElementById('detailEventLocation').textContent = booking.eventLocation || '-';
    document.getElementById('detailEventDateTime').textContent = `${booking.eventDate || ''} (${(booking.startTime || '').substring(0, 5)} - ${(booking.endTime || '').substring(0, 5)})`;
    document.getElementById('detailPackageTitle').textContent = booking.packageTitle || 'Custom Requirement Event';
    document.getElementById('detailCustomReqs').textContent = booking.customRequirements || 'None specified.';
    document.getElementById('detailTotalAmount').textContent = `LKR ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailBalanceAmount').textContent = `LKR ${balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailTotalPayable').textContent = `LKR ${overallPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailPaymentMethod').textContent = booking.paymentMethod || 'Cash on Event Date';

    const statusEl = document.getElementById('detailBookingStatus');
    if (statusEl) {
        const st = (booking.bookingStatus || 'Pending').toLowerCase();
        statusEl.textContent = booking.bookingStatus || 'Pending';
        if (st === 'confirmed') statusEl.className = 'badge badge-soft-success mt-1';
        else if (st === 'completed') statusEl.className = 'badge badge-soft-primary mt-1';
        else if (st === 'cancelled') statusEl.className = 'badge badge-soft-danger mt-1';
        else statusEl.className = 'badge badge-soft-warning mt-1';
    }

    const editBtn = document.getElementById('detailEditBtn');
    if (editBtn) {
        editBtn.onclick = () => openEditBookingModal(booking.id);
    }

    const modalEl = document.getElementById('bookingDetailsModal');
    if (modalEl) {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.show();
    }
}

// 18. Open Edit Booking Modal
function openEditBookingModal(bookingId) {
    // Hide details modal if open
    const detailModalEl = document.getElementById('bookingDetailsModal');
    if (detailModalEl) {
        const detailInstance = bootstrap.Modal.getInstance(detailModalEl);
        if (detailInstance) detailInstance.hide();
    }

    const booking = allBookingsList.find(b => b.id === bookingId);
    if (!booking) {
        alert("Booking details not found.");
        return;
    }

    document.getElementById('editBookingId').value = booking.id;
    document.getElementById('editBookingRef').value = `#EVT-${booking.id} (${booking.packageTitle || 'Custom Event'})`;
    document.getElementById('editBookingCustomer').value = `${booking.customerName || ''} (${booking.customerEmail || ''})`;
    document.getElementById('editBookingTitle').value = booking.eventTitle || '';
    document.getElementById('editBookingDate').value = booking.eventDate || '';
    document.getElementById('editBookingLocation').value = booking.eventLocation || '';
    document.getElementById('editBookingStartTime').value = booking.startTime ? booking.startTime.substring(0, 5) : '';
    document.getElementById('editBookingEndTime').value = booking.endTime ? booking.endTime.substring(0, 5) : '';
    document.getElementById('editBookingReqs').value = booking.customRequirements || '';
    document.getElementById('editBookingTotalAmount').value = booking.totalAmount || 0;
    document.getElementById('editBookingBalanceAmount').value = booking.balanceAmount || 0;

    // Populate and select Payment Method dropdown
    const paymentSelect = document.getElementById('editBookingPaymentMethod');
    if (paymentSelect) {
        paymentSelect.innerHTML = '';
        const currentMethodName = (booking.paymentMethod || '').trim().toUpperCase();
        allPaymentMethods.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.paymentMethod;
            if (m.paymentMethod.toUpperCase() === currentMethodName || m.id === booking.paymentMethodId) {
                opt.selected = true;
            }
            paymentSelect.appendChild(opt);
        });
        if (paymentSelect.options.length === 0) {
            paymentSelect.innerHTML = `
                <option value="1" ${currentMethodName.includes('CASH') ? 'selected' : ''}>Cash on Event Date</option>
                <option value="2" ${currentMethodName.includes('CARD') || currentMethodName.includes('CREDIT') ? 'selected' : ''}>Credit Card</option>
                <option value="3" ${currentMethodName.includes('BANK') || currentMethodName.includes('TRANSFER') ? 'selected' : ''}>Bank Transfer</option>
            `;
        }
    }

    // Populate and select Booking Status dropdown
    const statusSelect = document.getElementById('editBookingStatus');
    if (statusSelect) {
        statusSelect.innerHTML = '';
        const currentStatusName = (booking.bookingStatus || '').trim().toUpperCase();
        allBookingStatuses.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.bookingStatus;
            if (s.bookingStatus.toUpperCase() === currentStatusName || s.id === booking.bookingStatusId) {
                opt.selected = true;
            }
            statusSelect.appendChild(opt);
        });
        if (statusSelect.options.length === 0) {
            statusSelect.innerHTML = `
                <option value="1" ${currentStatusName === 'PENDING' ? 'selected' : ''}>Pending</option>
                <option value="2" ${currentStatusName === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                <option value="3" ${currentStatusName === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                <option value="4" ${currentStatusName === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
            `;
        }
    }

    const modalEl = document.getElementById('editBookingModal');
    if (modalEl) {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.show();
    }
}

// 19. Handle Update Booking Submission
async function handleUpdateBooking(event) {
    if (event) event.preventDefault();

    const bookingId = document.getElementById('editBookingId')?.value;
    const eventTitle = document.getElementById('editBookingTitle')?.value.trim();
    const eventLocation = document.getElementById('editBookingLocation')?.value.trim();
    const eventDate = document.getElementById('editBookingDate')?.value;
    const startTimeVal = document.getElementById('editBookingStartTime')?.value;
    const endTimeVal = document.getElementById('editBookingEndTime')?.value;
    const customReqs = document.getElementById('editBookingReqs')?.value.trim();
    const totalAmount = parseFloat(document.getElementById('editBookingTotalAmount')?.value) || 0;
    const balanceAmount = parseFloat(document.getElementById('editBookingBalanceAmount')?.value) || 0;
    const paymentSelect = document.getElementById('editBookingPaymentMethod');
    const statusSelect = document.getElementById('editBookingStatus');

    // Frontend Validations
    if (!eventTitle) {
        alert("Please enter the Event Title.");
        return;
    }
    if (!eventLocation) {
        alert("Please enter the Venue Location.");
        return;
    }
    if (!eventDate) {
        alert("Please select the Event Date.");
        return;
    }
    if (!startTimeVal || !endTimeVal) {
        alert("Please specify both Start Time and End Time.");
        return;
    }
    if (startTimeVal >= endTimeVal) {
        alert("Event End Time must be strictly after Start Time.");
        return;
    }
    if (totalAmount < 0) {
        alert("Total / Advance Amount cannot be negative.");
        return;
    }
    if (balanceAmount < 0) {
        alert("Remaining Balance Amount cannot be negative.");
        return;
    }

    const formattedStartTime = startTimeVal.length === 5 ? `${startTimeVal}:00` : startTimeVal;
    const formattedEndTime = endTimeVal.length === 5 ? `${endTimeVal}:00` : endTimeVal;

    const paymentMethodId = paymentSelect ? parseInt(paymentSelect.value) : null;
    const paymentMethodName = paymentSelect && paymentSelect.selectedIndex >= 0 ? paymentSelect.options[paymentSelect.selectedIndex].text : null;

    const bookingStatusId = statusSelect ? parseInt(statusSelect.value) : null;
    const bookingStatusName = statusSelect && statusSelect.selectedIndex >= 0 ? statusSelect.options[statusSelect.selectedIndex].text : null;

    const payload = {
        eventTitle: eventTitle,
        eventLocation: eventLocation,
        eventDate: eventDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        customRequirements: customReqs,
        totalAmount: totalAmount,
        balanceAmount: balanceAmount,
        paymentMethodId: paymentMethodId,
        paymentMethod: paymentMethodName,
        bookingStatusId: bookingStatusId,
        bookingStatus: bookingStatusName
    };

    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || "Booking updated successfully!");

            const modalEl = document.getElementById('editBookingModal');
            if (modalEl) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }

            loadAdminBookings();
            loadBookingStatistics();
        } else {
            alert(data.message || "Failed to update booking.");
        }
    } catch (err) {
        console.error('Error updating booking:', err);
        alert("An error occurred while updating the booking record.");
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();

    // User Management filters
    document.getElementById('userRoleFilter')?.addEventListener('change', applyUserFilters);
    document.getElementById('userSearchInput')?.addEventListener('input', applyUserFilters);

    // Booking Management filters
    document.getElementById('bookingStatusFilter')?.addEventListener('change', applyBookingFilters);
    document.getElementById('bookingDateFilter')?.addEventListener('change', applyBookingFilters);
    document.getElementById('bookingSearchInput')?.addEventListener('input', applyBookingFilters);
});

