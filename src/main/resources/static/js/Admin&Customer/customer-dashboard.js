let availablePackages = [];
let customerBookings = [];

function getDashboardForRole(role) {
    if (!role) return 'customer-dashboard.html';
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

async function checkSession() {
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status && data.data) {
            const user = data.data;
            const normalizedRole = (user.role || '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');

            // Enforce role-based access: If not a customer, redirect to specific role dashboard
            if (normalizedRole !== 'CUSTOMER' && normalizedRole !== 'CLIENT') {
                const targetDashboard = getDashboardForRole(normalizedRole);
                if (targetDashboard !== 'customer-dashboard.html') {
                    console.log(`User role is "${user.role}". Redirecting to ${targetDashboard}`);
                    window.location.href = targetDashboard;
                    return;
                }
            }

            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
            const firstLetter = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
            const lastLetter = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
            const initials = `${firstLetter}${lastLetter}` || 'CU';

            // Update sidebar user name
            const nameEl = document.getElementById('customerName');
            if (nameEl) {
                nameEl.textContent = fullName;
            }

            // Update sidebar avatar initials
            const initialsEl = document.getElementById('customerInitials');
            if (initialsEl) {
                initialsEl.textContent = initials;
            }

            // Update welcome hero banner
            const heroEl = document.getElementById('welcomeCustomerName');
            if (heroEl) {
                heroEl.textContent = `Welcome back, ${user.firstName || 'Customer'}! 👋`;
            }

            // Update email badge if present
            const emailEl = document.getElementById('customerEmail');
            if (emailEl) {
                emailEl.textContent = user.email || '';
            }

            // Mobile menu name and initials
            const mobileNameEl = document.getElementById('mobileCustomerName');
            if (mobileNameEl) {
                mobileNameEl.textContent = fullName;
            }
            const mobileInitialsEl = document.getElementById('mobileCustomerInitials');
            if (mobileInitialsEl) {
                mobileInitialsEl.textContent = initials;
            }

            // Once authenticated, load packages and bookings dynamically
            loadPackages();
            loadCustomerBookings();

        } else {
            // No valid session, redirect to login
            sessionStorage.setItem('postLoginRedirect', window.location.pathname);
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error verifying session:', error);
        sessionStorage.setItem('postLoginRedirect', window.location.pathname);
        window.location.href = 'login.html';
    }
}

// 1. Load Packages from Backend
async function loadPackages() {
    const container = document.getElementById('packagesContainer');
    const packageSelect = document.getElementById('packageSelect');

    if (!container) return;

    try {
        const response = await fetch('/api/packages', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status && Array.isArray(data.data)) {
            availablePackages = data.data;

            if (availablePackages.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-box-seam fs-1 text-muted"></i>
                        <p class="text-muted mt-2">No photography packages found in the system.</p>
                    </div>
                `;
                if (packageSelect) {
                    packageSelect.innerHTML = '<option value="">No packages available</option>';
                }
                return;
            }

            let cardsHtml = '';
            let selectOptionsHtml = '<option value="">Choose a standardized package...</option>';

            availablePackages.forEach((pkg, index) => {
                const isFeatured = index === 1 || (pkg.discountRate && Number(pkg.discountRate) > 0);
                const priceFormatted = Number(pkg.price || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                const coverageHours = pkg.coverageHours ? `${pkg.coverageHours} Hours Coverage` : 'Dedicated Coverage';

                // Process inclusions separated by ';' into individual bullet items
                let inclusionsHtml = '';
                if (pkg.inclusions) {
                    const items = pkg.inclusions.split(';').map(s => s.trim()).filter(Boolean);
                    items.forEach(item => {
                        inclusionsHtml += `<li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i>${escapeHtml(item)}</li>`;
                    });
                } else {
                    inclusionsHtml = `<li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i>Full Event Photography</li>`;
                }

                cardsHtml += `
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="package-card ${isFeatured ? 'featured' : ''} p-4">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="text-uppercase ${isFeatured ? 'text-primary' : 'text-muted'} fw-bold" style="font-size: 11px;">
                                    ${escapeHtml(coverageHours)}
                                </span>
                                ${isFeatured ? '<span class="badge bg-primary">Popular</span>' : ''}
                            </div>
                            <h4 class="fw-bold">${escapeHtml(pkg.title || 'Package')}</h4>
                            <div class="my-2">
                                <span class="fs-2 fw-bolder text-primary">LKR ${priceFormatted}</span>
                                <span class="text-muted">/ event</span>
                            </div>
                            <p class="text-muted small">${escapeHtml(pkg.description || '')}</p>
                            <ul class="list-unstyled small mb-4 flex-grow-1">
                                ${inclusionsHtml}
                            </ul>
                            <button class="btn ${isFeatured ? 'btn-primary' : 'btn-outline-primary'} w-100" 
                                    onclick="selectPackageForBooking(${pkg.id}, '${escapeForJs(pkg.title)}')">
                                Select Package
                            </button>
                        </div>
                    </div>
                `;

                selectOptionsHtml += `<option value="${pkg.id}">${escapeHtml(pkg.title)} (${pkg.coverageHours || 0} hrs - LKR ${priceFormatted})</option>`;
            });

            container.innerHTML = cardsHtml;

            if (packageSelect) {
                packageSelect.innerHTML = selectOptionsHtml;
            }

        } else {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">${data.message || 'Failed to load packages.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching packages:', error);
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Unable to load packages from the server.</p>
                </div>
            `;
        }
    }
}

// 2. Select Package and open Standard Booking Modal
function selectPackageForBooking(packageId, packageName) {
    const packageSelect = document.getElementById('packageSelect');
    if (packageSelect) {
        let matched = false;
        for (let opt of packageSelect.options) {
            if (opt.value == packageId) {
                opt.selected = true;
                matched = true;
                break;
            }
        }
        if (!matched && packageName) {
            for (let opt of packageSelect.options) {
                if (opt.text.includes(packageName)) {
                    opt.selected = true;
                    matched = true;
                    break;
                }
            }
        }
    }

    const modalEl = document.getElementById('newBookingModal');
    if (modalEl) {
        const bookingModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bookingModal.show();
    }
}

// 3. Submit Standard Event Package Booking Request (status: Pending)
async function handleBookingSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    const packageSelect = document.getElementById('packageSelect');
    const eventTitle = document.getElementById('eventTitle');
    const eventLocation = document.getElementById('eventLocation');
    const eventDate = document.getElementById('eventDate');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const customNotes = document.getElementById('customNotes');
    const alertBox = document.getElementById('bookingAlert');

    const packageIdVal = packageSelect ? packageSelect.value : '';
    const titleVal = eventTitle ? eventTitle.value.trim() : '';
    const locationVal = eventLocation ? eventLocation.value.trim() : '';
    const dateVal = eventDate ? eventDate.value : '';
    const startVal = startTime ? startTime.value : '';
    const endVal = endTime ? endTime.value : '';
    const notesVal = customNotes ? customNotes.value.trim() : '';

    // Validation checks
    if (!packageIdVal) {
        alert("Please select a photography package.");
        return;
    }
    if (!titleVal) {
        alert("Please enter the event title.");
        return;
    }
    if (!locationVal) {
        alert("Please enter the event location address.");
        return;
    }
    if (!dateVal) {
        alert("Please choose an event date.");
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateVal < todayStr) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Booking date cannot be in the past.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Validation error: Booking date cannot be in the past.');
        }
        return;
    }

    if (!startVal || !endVal) {
        alert("Please provide both start time and end time.");
        return;
    }

    if (startVal >= endVal) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Event end time must be after start time.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Validation error: Event end time must be after start time.');
        }
        return;
    }

    if (alertBox) {
        alertBox.classList.add('d-none');
    }

    const formattedStartTime = startVal.length === 5 ? `${startVal}:00` : startVal;
    const formattedEndTime = endVal.length === 5 ? `${endVal}:00` : endVal;

    const bookingDto = {
        packageId: parseInt(packageIdVal),
        eventTitle: titleVal,
        eventLocation: locationVal,
        eventDate: dateVal,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        customRequirements: notesVal
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(bookingDto)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || 'Booking request recorded successfully with "Pending" status!');

            const modalEl = document.getElementById('newBookingModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            const formEl = document.getElementById('bookingForm');
            if (formEl) {
                formEl.reset();
            }

            loadCustomerBookings();

        } else {
            alert(data.message || 'Failed to submit booking request.');
        }
    } catch (error) {
        console.error('Error creating booking:', error);
        alert('An error occurred while connecting to the server to submit your booking.');
    }
}

// 4. Submit Custom Requirement Event Booking Request (No packageId, Advance LKR 3000, Mandatory custom requirements)
async function handleCustomBookingSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    const eventTitle = document.getElementById('customEventTitle');
    const eventLocation = document.getElementById('customEventLocation');
    const eventDate = document.getElementById('customEventDate');
    const startTime = document.getElementById('customStartTime');
    const endTime = document.getElementById('customEndTime');
    const customNotes = document.getElementById('customRequirementsNotes');
    const alertBox = document.getElementById('customBookingAlert');

    const titleVal = eventTitle ? eventTitle.value.trim() : '';
    const locationVal = eventLocation ? eventLocation.value.trim() : '';
    const dateVal = eventDate ? eventDate.value : '';
    const startVal = startTime ? startTime.value : '';
    const endVal = endTime ? endTime.value : '';
    const reqsVal = customNotes ? customNotes.value.trim() : '';

    // Validation checks for Custom Booking
    if (!titleVal) {
        alert("Please enter the event title for your custom booking.");
        return;
    }
    if (!locationVal) {
        alert("Please enter the event location address.");
        return;
    }
    if (!dateVal) {
        alert("Please select the event date.");
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateVal < todayStr) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Booking date cannot be in the past.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Validation error: Booking date cannot be in the past.');
        }
        return;
    }

    if (!startVal || !endVal) {
        alert("Please provide both start time and end time.");
        return;
    }

    if (startVal >= endVal) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Event end time must be after start time.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Validation error: Event end time must be after start time.');
        }
        return;
    }

    // MANDATORY Custom Requirements Validation
    if (!reqsVal) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Please describe your event details in the Custom Requirements field.';
            alertBox.classList.remove('d-none');
        } else {
            alert("Validation error: Please enter your event details in the Custom Requirements field before submitting.");
        }
        if (customNotes) {
            customNotes.focus();
        }
        return;
    }

    if (alertBox) {
        alertBox.classList.add('d-none');
    }

    const formattedStartTime = startVal.length === 5 ? `${startVal}:00` : startVal;
    const formattedEndTime = endVal.length === 5 ? `${endVal}:00` : endVal;

    // Custom Booking Request DTO (packageId is null)
    const customBookingDto = {
        packageId: null,
        eventTitle: titleVal,
        eventLocation: locationVal,
        eventDate: dateVal,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        customRequirements: reqsVal
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(customBookingDto)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            alert(data.message || 'Custom booking request submitted successfully with "Pending" status (Advance: LKR 3,000)!');

            const modalEl = document.getElementById('customBookingModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            const formEl = document.getElementById('customBookingForm');
            if (formEl) {
                formEl.reset();
            }

            loadCustomerBookings();

        } else {
            alert(data.message || 'Failed to submit custom booking request.');
        }
    } catch (error) {
        console.error('Error creating custom booking:', error);
        alert('An error occurred while connecting to the server to submit your custom booking.');
    }
}

// 5. Load Customer Bookings and populate tables
async function loadCustomerBookings() {
    const fullTableBody = document.querySelector('#customerBookingList tbody');
    const recentTableBody = document.getElementById('dashboardRecentTable');

    try {
        const response = await fetch('/api/bookings/my-bookings', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.status && Array.isArray(data.data)) {
            customerBookings = data.data;

            let fullRowsHtml = '';
            let recentRowsHtml = '';

            if (customerBookings.length === 0) {
                if (fullTableBody) {
                    fullTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No bookings found. Click "Custom Booking Request" or select a package to request a shoot!</td></tr>`;
                }
                if (recentTableBody) {
                    recentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No recent bookings found.</td></tr>`;
                }
                return;
            }

            customerBookings.forEach((b, idx) => {
                const status = (b.bookingStatus || 'Pending').toLowerCase();
                let badgeClass = 'badge-soft-warning';
                if (status === 'confirmed' || status === 'active') {
                    badgeClass = 'badge-soft-success';
                } else if (status === 'completed') {
                    badgeClass = 'badge-soft-primary';
                } else if (status === 'cancelled') {
                    badgeClass = 'badge-soft-danger';
                } else {
                    badgeClass = 'badge-soft-warning';
                }

                const amountVal = Number(b.totalAmount || 0);
                const amountFormatted = amountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const balanceVal = Number(b.balanceAmount || 0);
                const balanceFormatted = balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const timeFormatted = b.startTime ? b.startTime.substring(0, 5) : '';

                // Row for Full Bookings Tab (7 columns)
                fullRowsHtml += `
                    <tr>
                        <td class="fw-semibold">
                            <div>${escapeHtml(b.eventTitle || 'Untitled Event')}</div>
                            <small class="text-muted">#EVT-${b.id}</small>
                        </td>
                        <td>${escapeHtml(b.eventLocation || 'Location TBD')}</td>
                        <td>${escapeHtml(b.eventDate || '')} (${escapeHtml(timeFormatted)})</td>
                        <td>
                            <div>${escapeHtml(b.packageTitle || 'Custom Requirement Event')}</div>
                            <strong class="text-primary small">LKR ${amountFormatted}</strong>
                        </td>
                        <td>
                            ${balanceVal > 0 
                                ? `<span class="badge bg-warning-subtle text-warning fw-bold border border-warning-subtle">LKR ${balanceFormatted}</span>` 
                                : `<span class="text-muted small">LKR 0.00</span>`}
                        </td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(b.bookingStatus || 'Pending')}</span></td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary" onclick="openCustomerBookingDetails(${b.id})">
                                <i class="bi bi-eye me-1"></i>Details
                            </button>
                        </td>
                    </tr>
                `;

                // Row for Overview Recent Tab (first 5 bookings)
                if (idx < 5) {
                    recentRowsHtml += `
                        <tr>
                            <td class="fw-semibold">#EVT-${b.id}</td>
                            <td>${escapeHtml(b.eventTitle || '')}</td>
                            <td>${escapeHtml(b.packageTitle || 'Custom Event')}</td>
                            <td>${escapeHtml(b.eventDate || '')}</td>
                            <td>
                                <div>LKR ${amountFormatted}</div>
                                ${balanceVal > 0 ? `<small class="text-warning fw-semibold">+ Bal: LKR ${balanceFormatted}</small>` : ''}
                            </td>
                            <td><span class="badge ${badgeClass}">${escapeHtml(b.bookingStatus || 'Pending')}</span></td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-light border" title="View Booking Details" onclick="openCustomerBookingDetails(${b.id})"><i class="bi bi-eye"></i></button>
                            </td>
                        </tr>
                    `;
                }
            });

            if (fullTableBody) {
                fullTableBody.innerHTML = fullRowsHtml;
            }
            if (recentTableBody) {
                recentTableBody.innerHTML = recentRowsHtml;
            }

        }
    } catch (error) {
        console.error('Error fetching customer bookings:', error);
    }
}

// 6. Open Customer Booking Details Modal
function openCustomerBookingDetails(bookingId) {
    const booking = customerBookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Booking details could not be found.');
        return;
    }

    let createdStr = booking.createdAt || '';
    try {
        createdStr = new Date(booking.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {}

    const totalVal = Number(booking.totalAmount || 0);
    const balanceVal = Number(booking.balanceAmount || 0);
    const overallPayable = totalVal + balanceVal;

    const refEl = document.getElementById('custDetailBookingRef');
    if (refEl) refEl.textContent = `#EVT-${booking.id} - ${booking.eventTitle || 'Event'}`;

    const createdEl = document.getElementById('custDetailCreatedAt');
    if (createdEl) createdEl.textContent = `Submitted on ${createdStr || booking.createdAt || 'N/A'}`;

    const titleEl = document.getElementById('custDetailEventTitle');
    if (titleEl) titleEl.textContent = booking.eventTitle || '-';

    const locEl = document.getElementById('custDetailEventLocation');
    if (locEl) locEl.textContent = booking.eventLocation || '-';

    const dtEl = document.getElementById('custDetailEventDateTime');
    if (dtEl) dtEl.textContent = `${booking.eventDate || ''} (${(booking.startTime || '').substring(0, 5)} - ${(booking.endTime || '').substring(0, 5)})`;

    const pkgEl = document.getElementById('custDetailPackageTitle');
    if (pkgEl) pkgEl.textContent = booking.packageTitle || 'Custom Requirement Event';

    const statusEl = document.getElementById('custDetailBookingStatus');
    if (statusEl) {
        const st = (booking.bookingStatus || 'Pending').toLowerCase();
        statusEl.textContent = booking.bookingStatus || 'Pending';
        if (st === 'confirmed') statusEl.className = 'badge badge-soft-success';
        else if (st === 'completed') statusEl.className = 'badge badge-soft-primary';
        else if (st === 'cancelled') statusEl.className = 'badge badge-soft-danger';
        else statusEl.className = 'badge badge-soft-warning';
    }

    const payEl = document.getElementById('custDetailPaymentMethod');
    if (payEl) payEl.textContent = booking.paymentMethod || 'Cash on Event Date';

    const reqsEl = document.getElementById('custDetailCustomReqs');
    if (reqsEl) reqsEl.textContent = booking.customRequirements || 'None specified.';

    const totalEl = document.getElementById('custDetailTotalAmount');
    if (totalEl) totalEl.textContent = `LKR ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const balanceEl = document.getElementById('custDetailBalanceAmount');
    if (balanceEl) balanceEl.textContent = `LKR ${balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const overallEl = document.getElementById('custDetailTotalPayable');
    if (overallEl) overallEl.textContent = `LKR ${overallPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const modalEl = document.getElementById('customerBookingDetailsModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function escapeForJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function signOut() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.status) {
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Logout Failed!');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = 'login.html';
    }
}

// Automatically verify session and trigger initial loading on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date to today on date pickers
    const todayStr = new Date().toISOString().split('T')[0];
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        eventDateInput.setAttribute('min', todayStr);
    }
    const customEventDateInput = document.getElementById('customEventDate');
    if (customEventDateInput) {
        customEventDateInput.setAttribute('min', todayStr);
    }
    checkSession();
});
