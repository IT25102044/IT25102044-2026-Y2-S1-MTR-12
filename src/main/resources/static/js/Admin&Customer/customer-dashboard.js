let availablePackages = [];
let customerBookings = [];
let currentUser = null;

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

// 1. Session Checking & Guest / Customer Mode Configuration
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

            // Enforce role-based redirection if non-customer user is logged in
            if (normalizedRole !== 'CUSTOMER' && normalizedRole !== 'CLIENT') {
                const targetDashboard = getDashboardForRole(normalizedRole);
                if (targetDashboard !== 'customer-dashboard.html') {
                    console.log(`User role is "${user.role}". Redirecting to ${targetDashboard}`);
                    window.location.href = targetDashboard;
                    return;
                }
            }

            // Customer is authenticated
            currentUser = user;
            setupCustomerUI(user);
            loadCustomerBookings();

        } else {
            // Guest mode (unauthenticated visitor)
            currentUser = null;
            setupGuestUI();
        }
    } catch (error) {
        console.warn('Session check failed or user not logged in:', error);
        currentUser = null;
        setupGuestUI();
    } finally {
        // Load packages for all users (guests and authenticated customers)
        loadPackages().then(() => {
            handleUrlIntentions();
        });
    }
}

// Configure UI for Authenticated Customer
function setupCustomerUI(user) {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
    const firstLetter = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const lastLetter = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    const initials = `${firstLetter}${lastLetter}` || 'CU';

    // Toggle Desktop Sidebar containers
    const sidebarLoggedIn = document.getElementById('sidebarLoggedInUser');
    const sidebarGuest = document.getElementById('sidebarGuestUser');
    if (sidebarLoggedIn) sidebarLoggedIn.style.display = 'block';
    if (sidebarGuest) sidebarGuest.style.display = 'none';

    // Update Desktop Sidebar Info
    const nameEl = document.getElementById('customerName');
    if (nameEl) nameEl.textContent = fullName;

    const emailEl = document.getElementById('customerEmail');
    if (emailEl) emailEl.textContent = user.email || 'customer@snappro.com';

    const initialsEl = document.getElementById('customerInitials');
    if (initialsEl) initialsEl.textContent = initials;

    // Toggle Mobile containers
    const mobileLoggedIn = document.getElementById('mobileLoggedInUser');
    const mobileGuest = document.getElementById('mobileGuestUser');
    if (mobileLoggedIn) mobileLoggedIn.style.display = 'block';
    if (mobileGuest) mobileGuest.style.display = 'none';

    const mobileNameEl = document.getElementById('mobileCustomerName');
    if (mobileNameEl) mobileNameEl.textContent = fullName;

    const mobileInitialsEl = document.getElementById('mobileCustomerInitials');
    if (mobileInitialsEl) mobileInitialsEl.textContent = initials;

    // Show Customer Personal Hub on Overview Page
    const personalHub = document.getElementById('customerPersonalHub');
    if (personalHub) personalHub.style.display = 'block';

    const welcomeEl = document.getElementById('welcomeCustomerName');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.firstName || 'Customer'}! 👋`;

    // Bookings Tab UI
    const bookingsPrompt = document.getElementById('bookingsGuestPrompt');
    const bookingsCard = document.getElementById('bookingsTableCard');
    if (bookingsPrompt) bookingsPrompt.style.display = 'none';
    if (bookingsCard) bookingsCard.style.display = 'block';
}

// Configure UI for Guest Visitor
function setupGuestUI() {
    // Toggle Desktop Sidebar containers
    const sidebarLoggedIn = document.getElementById('sidebarLoggedInUser');
    const sidebarGuest = document.getElementById('sidebarGuestUser');
    if (sidebarLoggedIn) sidebarLoggedIn.style.display = 'none';
    if (sidebarGuest) sidebarGuest.style.display = 'block';

    // Toggle Mobile containers
    const mobileLoggedIn = document.getElementById('mobileLoggedInUser');
    const mobileGuest = document.getElementById('mobileGuestUser');
    if (mobileLoggedIn) mobileLoggedIn.style.display = 'none';
    if (mobileGuest) mobileGuest.style.display = 'block';

    // Hide Customer Personal Hub on Overview Page
    const personalHub = document.getElementById('customerPersonalHub');
    if (personalHub) personalHub.style.display = 'none';

    // Bookings Tab UI
    const bookingsPrompt = document.getElementById('bookingsGuestPrompt');
    const bookingsCard = document.getElementById('bookingsTableCard');
    if (bookingsPrompt) bookingsPrompt.style.display = 'block';
    if (bookingsCard) bookingsCard.style.display = 'none';
}

// 2. Tab Navigation Helpers & Interceptors
function switchTab(tabId) {
    // If user tries to open bookings while not logged in, prompt login
    if (tabId === 'bookings' && !currentUser) {
        showLoginPrompt('Please sign in to view your bookings and manage scheduled photo shoots.', 'customer-dashboard.html#bookings');
        return;
    }

    const tabTriggerEl = document.querySelector(`a[href="#${tabId}"]`);
    if (tabTriggerEl) {
        const tab = bootstrap.Tab.getOrCreateInstance(tabTriggerEl);
        tab.show();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleBookingsNavClick(event) {
    if (!currentUser) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        showLoginPrompt('Please sign in to access your booking history and manage scheduled photo shoots.', 'customer-dashboard.html#bookings');
        return false;
    }
    // If logged in, reload customer bookings
    loadCustomerBookings();
    return true;
}

// 3. Login Prompt Handling
function showLoginPrompt(message, redirectUrl) {
    if (redirectUrl) {
        sessionStorage.setItem('postLoginRedirect', redirectUrl);
    }

    const msgEl = document.getElementById('loginPromptMessage');
    if (msgEl && message) {
        msgEl.textContent = message;
    }

    const modalEl = document.getElementById('loginPromptModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }
}

function handlePromptLogin() {
    const modalEl = document.getElementById('loginPromptModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
    window.location.href = 'login.html';
}

function handlePromptRegister() {
    const modalEl = document.getElementById('loginPromptModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
    window.location.href = 'register.html';
}

// 4. Load Packages Catalog (Public)
async function loadPackages() {
    const container = document.getElementById('packagesContainer');

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
                        <p class="text-muted mt-2">No photography packages currently available.</p>
                    </div>
                `;
                return;
            }

            let cardsHtml = '';

            availablePackages.forEach((pkg, index) => {
                const isFeatured = index === 1 || (pkg.discountRate && Number(pkg.discountRate) > 0);
                const priceFormatted = Number(pkg.price || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                const coverageHours = pkg.coverageHours ? `${pkg.coverageHours} Hours Coverage` : 'Dedicated Coverage';

                // Process inclusions
                let inclusionsHtml = '';
                if (pkg.inclusions) {
                    const items = pkg.inclusions.split(';').map(s => s.trim()).filter(Boolean);
                    items.forEach(item => {
                        inclusionsHtml += `<li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i>${escapeHtml(item)}</li>`;
                    });
                } else {
                    inclusionsHtml = `<li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i>Full Event Photography & Highlights</li>`;
                }

                cardsHtml += `
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="package-card ${isFeatured ? 'featured' : ''} p-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-uppercase ${isFeatured ? 'text-primary' : 'text-muted'} fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">
                                    <i class="bi bi-clock me-1"></i>${escapeHtml(coverageHours)}
                                </span>
                                ${isFeatured ? '<span class="badge bg-primary px-3 py-1 rounded-pill">Most Popular</span>' : ''}
                            </div>
                            <h4 class="fw-bold mb-1">${escapeHtml(pkg.title || 'Standard Package')}</h4>
                            <div class="my-3">
                                <span class="fs-2 fw-bolder text-primary">LKR ${priceFormatted}</span>
                                <span class="text-muted small">/ complete shoot</span>
                            </div>
                            <p class="text-muted small mb-3">${escapeHtml(pkg.description || '')}</p>
                            <hr class="opacity-25 my-2" />
                            <ul class="list-unstyled small mb-4 flex-grow-1">
                                ${inclusionsHtml}
                            </ul>
                            <button class="btn ${isFeatured ? 'btn-primary' : 'btn-outline-primary'} w-100 py-2 fw-bold" 
                                    onclick="selectPackageForBooking(${pkg.id}, '${escapeForJs(pkg.title)}')">
                                <i class="bi bi-camera me-1"></i> Book Package
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = cardsHtml;

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

// Helper to get local date string YYYY-MM-DD
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 5. Select Package and trigger booking (Shows selected package only, no dropdown)
function selectPackageForBooking(packageId, packageName) {
    if (!currentUser) {
        showLoginPrompt(
            `Please sign in or create an account to book the "${packageName || 'selected'}" photography package.`,
            `customer-dashboard.html?bookPackage=${packageId}`
        );
        return;
    }

    let pkg = availablePackages.find(p => p.id === packageId);
    if (!pkg && packageName) {
        pkg = availablePackages.find(p => (p.title || '').toLowerCase() === packageName.toLowerCase());
    }

    const hiddenIdInput = document.getElementById('selectedPackageId');
    const titleEl = document.getElementById('selectedPackageTitle');
    const priceBadge = document.getElementById('selectedPackagePriceBadge');

    if (hiddenIdInput) hiddenIdInput.value = pkg ? pkg.id : packageId;
    if (titleEl) titleEl.textContent = pkg ? pkg.title : (packageName || 'Standard Photography Package');
    if (priceBadge && pkg) {
        const priceFormatted = Number(pkg.price || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        const hrs = pkg.coverageHours ? ` (${pkg.coverageHours} hrs)` : '';
        priceBadge.textContent = `LKR ${priceFormatted}${hrs}`;
    }

    const alertBox = document.getElementById('bookingAlert');
    if (alertBox) alertBox.classList.add('d-none');

    const todayStr = getTodayDateString();
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        eventDateInput.setAttribute('min', todayStr);
    }

    checkAndRenderBookedSlots('standard');

    const modalEl = document.getElementById('newBookingModal');
    if (modalEl) {
        const bookingModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bookingModal.show();
    }
}

// 6. Open Custom Booking Modal (Gated with login check)
function openCustomBookingModal() {
    if (!currentUser) {
        showLoginPrompt(
            'Please sign in or create an account to submit a custom photography booking request.',
            'customer-dashboard.html?customBooking=true'
        );
        return;
    }

    const alertBox = document.getElementById('customBookingAlert');
    if (alertBox) alertBox.classList.add('d-none');

    const todayStr = getTodayDateString();
    const customEventDateInput = document.getElementById('customEventDate');
    if (customEventDateInput) {
        customEventDateInput.setAttribute('min', todayStr);
    }

    checkAndRenderBookedSlots('custom');

    const modalEl = document.getElementById('customBookingModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }
}

// 7. Open Review Modal (Gated with login check)
function openReviewModal() {
    if (!currentUser) {
        showLoginPrompt('Please sign in to submit a service review and rating.', 'customer-dashboard.html#feedback');
        return;
    }

    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }
}

// ========================================================
// DATEWISE BOOKED TIMESLOTS & OVERLAP VALIDATION SYSTEM
// ========================================================

let bookedSlotsCache = {};

async function fetchBookedSlotsForDate(dateStr) {
    if (!dateStr) return [];
    if (bookedSlotsCache[dateStr]) {
        return bookedSlotsCache[dateStr];
    }
    try {
        const response = await fetch(`/api/bookings/booked-slots?date=${encodeURIComponent(dateStr)}`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.status && Array.isArray(data.data)) {
            bookedSlotsCache[dateStr] = data.data;
            return data.data;
        }
        return [];
    } catch (e) {
        console.warn('Could not fetch booked slots for date:', dateStr, e);
        return [];
    }
}

function clearBookedSlotsCache() {
    bookedSlotsCache = {};
}

/**
 * Validates and updates the Booked Timeslots UI for either 'standard' or 'custom' booking modal
 * Returns { valid: boolean, message: string }
 */
async function checkAndRenderBookedSlots(prefix) {
    const isCustom = prefix === 'custom';
    const dateInput = document.getElementById(isCustom ? 'customEventDate' : 'eventDate');
    const startInput = document.getElementById(isCustom ? 'customStartTime' : 'startTime');
    const endInput = document.getElementById(isCustom ? 'customEndTime' : 'endTime');

    const dateDisplay = document.getElementById(isCustom ? 'customSelectedDateDisplay' : 'selectedDateDisplay');
    const statusBadge = document.getElementById(isCustom ? 'customSlotsStatusBadge' : 'slotsStatusBadge');
    const slotsList = document.getElementById(isCustom ? 'customDateBookedSlotsList' : 'dateBookedSlotsList');
    const conflictAlert = document.getElementById(isCustom ? 'customSlotConflictAlert' : 'slotConflictAlert');
    const conflictMsg = document.getElementById(isCustom ? 'customSlotConflictMsg' : 'slotConflictMsg');
    const availableAlert = document.getElementById(isCustom ? 'customSlotAvailableAlert' : 'slotAvailableAlert');
    const availableMsg = document.getElementById(isCustom ? 'customSlotAvailableMsg' : 'slotAvailableMsg');

    if (!dateInput || !slotsList) return { valid: true };

    const dateVal = dateInput.value;
    const startVal = startInput ? startInput.value : '';
    const endVal = endInput ? endInput.value : '';
    const todayStr = getTodayDateString();

    // 1. If no date selected
    if (!dateVal) {
        if (dateDisplay) dateDisplay.textContent = 'Selected Date';
        if (statusBadge) {
            statusBadge.innerHTML = '<i class="bi bi-info-circle me-1"></i>Select a date';
            statusBadge.className = 'badge bg-white text-secondary border px-2 py-1 small';
        }
        slotsList.innerHTML = '<span class="text-muted small fst-italic">Pick an event date above to check already reserved time intervals.</span>';
        if (conflictAlert) conflictAlert.classList.add('d-none');
        if (availableAlert) availableAlert.classList.add('d-none');
        if (dateInput) dateInput.classList.remove('is-invalid');
        if (startInput) startInput.classList.remove('is-invalid');
        if (endInput) endInput.classList.remove('is-invalid');
        return { valid: true };
    }

    // Format date for title
    let formattedDate = dateVal;
    try {
        formattedDate = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {}
    if (dateDisplay) dateDisplay.textContent = formattedDate;

    // 2. Strict Past Date Validation
    if (dateVal < todayStr) {
        dateInput.classList.add('is-invalid');
        if (statusBadge) {
            statusBadge.innerHTML = '<i class="bi bi-x-circle-fill me-1"></i>Past Date Not Allowed';
            statusBadge.className = 'badge bg-danger text-white border px-2 py-1 small fw-semibold';
        }
        slotsList.innerHTML = `
            <div class="p-2 px-3 bg-danger-subtle border border-danger-subtle rounded-2 text-danger small d-flex align-items-center w-100">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5 flex-shrink-0"></i>
                <span><strong>Date Error:</strong> You cannot make a booking for past dates. Please pick today (${todayStr}) or a future date.</span>
            </div>`;
        if (conflictMsg) {
            conflictMsg.innerHTML = `<strong>Date Validation Error:</strong> Booking date cannot be in the past (${formattedDate}). Please select today or a future date.`;
        }
        if (conflictAlert) conflictAlert.classList.remove('d-none');
        if (availableAlert) availableAlert.classList.add('d-none');
        return { valid: false, message: `Booking date (${formattedDate}) cannot be in the past. Please select today or a future date.` };
    } else {
        dateInput.classList.remove('is-invalid');
    }

    // 3. Fetch slots from API for valid date
    const slots = await fetchBookedSlotsForDate(dateVal);

    if (slots.length === 0) {
        if (statusBadge) {
            statusBadge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Available All Day';
            statusBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-semibold';
        }
        slotsList.innerHTML = `
            <div class="p-2 bg-success-subtle border border-success-subtle rounded-2 text-success small d-flex align-items-center w-100">
                <i class="bi bi-check-circle-fill me-2 fs-6"></i>
                <span><strong>No bookings on this date:</strong> All time slots throughout the day are currently open & free to book!</span>
            </div>`;
    } else {
        if (statusBadge) {
            statusBadge.innerHTML = `<i class="bi bi-calendar-x-fill me-1"></i>${slots.length} Reserved Slot${slots.length > 1 ? 's' : ''}`;
            statusBadge.className = 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small fw-semibold';
        }
        let chipsHtml = `
            <div class="mb-1 w-100 text-secondary" style="font-size: 11px;">
                <i class="bi bi-lock-fill text-danger me-1"></i><strong>Unavailable Windows (Already Booked):</strong>
            </div>
            <div class="d-flex flex-wrap gap-2 w-100">`;
        slots.forEach(s => {
            const sStart = (s.startTime || '').substring(0, 5);
            const sEnd = (s.endTime || '').substring(0, 5);
            const stName = s.bookingStatus || 'Reserved';
            chipsHtml += `
                <span class="badge bg-danger text-white border border-danger px-2 py-1 shadow-sm d-inline-flex align-items-center rounded-pill" style="font-size: 11.5px;">
                    <i class="bi bi-clock-fill me-1 text-white opacity-75"></i> ${sStart} - ${sEnd} (${escapeHtml(stName)})
                </span>`;
        });
        chipsHtml += `</div>`;
        slotsList.innerHTML = chipsHtml;
    }

    // 4. Validate start and end times if both provided
    if (startVal && endVal) {
        if (startVal >= endVal) {
            if (conflictMsg) conflictMsg.innerHTML = `<strong>Invalid Time Range:</strong> Event End Time (${endVal}) must be strictly after Start Time (${startVal}).`;
            if (conflictAlert) conflictAlert.classList.remove('d-none');
            if (availableAlert) availableAlert.classList.add('d-none');
            if (startInput) startInput.classList.remove('is-invalid');
            if (endInput) endInput.classList.add('is-invalid');
            return { valid: false, message: 'Event end time must be after start time.' };
        }

        // Overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
        let hasConflict = false;
        let conflictingSlot = null;

        for (let s of slots) {
            const sStart = (s.startTime || '').substring(0, 5);
            const sEnd = (s.endTime || '').substring(0, 5);
            if (sStart && sEnd) {
                if (startVal < sEnd && endVal > sStart) {
                    hasConflict = true;
                    conflictingSlot = s;
                    break;
                }
            }
        }

        if (hasConflict && conflictingSlot) {
            const cStart = (conflictingSlot.startTime || '').substring(0, 5);
            const cEnd = (conflictingSlot.endTime || '').substring(0, 5);
            if (conflictMsg) {
                conflictMsg.innerHTML = `
                    <strong>Time Slot Conflict:</strong> Your chosen time window (<strong>${startVal} - ${endVal}</strong>) overlaps with an already booked shoot (<strong>${cStart} - ${cEnd}</strong>) on ${formattedDate}. Please select an open time slot.`;
            }
            if (conflictAlert) conflictAlert.classList.remove('d-none');
            if (availableAlert) availableAlert.classList.add('d-none');
            if (startInput) startInput.classList.add('is-invalid');
            if (endInput) endInput.classList.add('is-invalid');
            return {
                valid: false,
                message: `Selected time (${startVal} - ${endVal}) overlaps with an existing booking (${cStart} - ${cEnd}) on ${formattedDate}.`
            };
        } else {
            // Valid and free!
            if (conflictAlert) conflictAlert.classList.add('d-none');
            if (availableMsg) {
                availableMsg.innerHTML = `<strong>✓ Time Slot Available:</strong> <strong>${startVal} - ${endVal}</strong> on ${formattedDate} is open and ready to book!`;
            }
            if (availableAlert) availableAlert.classList.remove('d-none');
            if (startInput) startInput.classList.remove('is-invalid');
            if (endInput) endInput.classList.remove('is-invalid');
            return { valid: true };
        }
    } else {
        // Not both times filled yet
        if (conflictAlert) conflictAlert.classList.add('d-none');
        if (availableAlert) availableAlert.classList.add('d-none');
        if (startInput) startInput.classList.remove('is-invalid');
        if (endInput) endInput.classList.remove('is-invalid');
        return { valid: true };
    }
}

function setupBookedSlotListeners() {
    const stdDate = document.getElementById('eventDate');
    const stdStart = document.getElementById('startTime');
    const stdEnd = document.getElementById('endTime');

    [stdDate, stdStart, stdEnd].forEach(el => {
        if (el) {
            el.addEventListener('input', () => checkAndRenderBookedSlots('standard'));
            el.addEventListener('change', () => checkAndRenderBookedSlots('standard'));
        }
    });

    const custDate = document.getElementById('customEventDate');
    const custStart = document.getElementById('customStartTime');
    const custEnd = document.getElementById('customEndTime');

    [custDate, custStart, custEnd].forEach(el => {
        if (el) {
            el.addEventListener('input', () => checkAndRenderBookedSlots('custom'));
            el.addEventListener('change', () => checkAndRenderBookedSlots('custom'));
        }
    });
}

// 8. Submit Standard Package Booking Request
async function handleBookingSubmit(event) {
    if (event) event.preventDefault();

    if (!currentUser) {
        showLoginPrompt('Please sign in to submit a booking request.', 'customer-dashboard.html');
        return;
    }

    const packageIdInput = document.getElementById('selectedPackageId');
    const eventTitle = document.getElementById('eventTitle');
    const eventLocation = document.getElementById('eventLocation');
    const eventDate = document.getElementById('eventDate');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const customNotes = document.getElementById('customNotes');
    const alertBox = document.getElementById('bookingAlert');

    const packageIdVal = packageIdInput ? packageIdInput.value : '';
    const titleVal = eventTitle ? eventTitle.value.trim() : '';
    const locationVal = eventLocation ? eventLocation.value.trim() : '';
    const dateVal = eventDate ? eventDate.value : '';
    const startVal = startTime ? startTime.value : '';
    const endVal = endTime ? endTime.value : '';
    const notesVal = customNotes ? customNotes.value.trim() : '';

    if (!packageIdVal) {
        alert("Please select a photography package from the Service Packages section.");
        return;
    }
    if (!titleVal) {
        alert("Please enter the event title.");
        if (eventTitle) eventTitle.focus();
        return;
    }
    if (!locationVal) {
        alert("Please enter the event location address.");
        if (eventLocation) eventLocation.focus();
        return;
    }
    if (!dateVal) {
        alert("Please choose an event date.");
        if (eventDate) eventDate.focus();
        return;
    }

    // Past date validation
    const todayStr = getTodayDateString();
    if (dateVal < todayStr) {
        if (alertBox) {
            alertBox.innerHTML = `<strong>Date Validation Error:</strong> Booking date cannot be in the past (${dateVal}). Please select today (${todayStr}) or a future date.`;
            alertBox.classList.remove('d-none');
        } else {
            alert(`Date Validation Error: Booking date cannot be in the past (${dateVal}). Please select today or a future date.`);
        }
        if (eventDate) {
            eventDate.classList.add('is-invalid');
            eventDate.focus();
        }
        return;
    }

    if (!startVal || !endVal) {
        alert("Please provide both start time and end time.");
        return;
    }

    if (startVal >= endVal) {
        if (alertBox) {
            alertBox.innerHTML = '<strong>Time Validation Error:</strong> Event end time must be strictly after start time.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Time Validation Error: Event end time must be strictly after start time.');
        }
        if (endTime) {
            endTime.classList.add('is-invalid');
            endTime.focus();
        }
        return;
    }

    // Overlap validation check
    const slotCheck = await checkAndRenderBookedSlots('standard');
    if (!slotCheck.valid) {
        if (alertBox) {
            alertBox.innerHTML = `<strong>Booking Time Conflict:</strong> ${slotCheck.message || 'The selected time slot overlaps with an existing booking.'}`;
            alertBox.classList.remove('d-none');
        } else {
            alert(`Booking Time Conflict: ${slotCheck.message}`);
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
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bookingDto)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            clearBookedSlotsCache();
            alert(data.message || 'Booking request recorded successfully with "Pending" status!');

            const modalEl = document.getElementById('newBookingModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            const formEl = document.getElementById('bookingForm');
            if (formEl) formEl.reset();

            loadCustomerBookings();
            switchTab('bookings');

        } else {
            const errMsg = data.message || 'Failed to submit booking request.';
            if (alertBox) {
                alertBox.textContent = errMsg;
                alertBox.classList.remove('d-none');
            } else {
                alert(errMsg);
            }
        }
    } catch (error) {
        console.error('Error creating booking:', error);
        alert('An error occurred while connecting to the server to submit your booking.');
    }
}

// 9. Submit Custom Requirement Booking Request
async function handleCustomBookingSubmit(event) {
    if (event) event.preventDefault();

    if (!currentUser) {
        showLoginPrompt('Please sign in to submit a custom booking request.', 'customer-dashboard.html');
        return;
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

    if (!titleVal) {
        alert("Please enter the event title for your custom booking.");
        if (eventTitle) eventTitle.focus();
        return;
    }
    if (!locationVal) {
        alert("Please enter the event location address.");
        if (eventLocation) eventLocation.focus();
        return;
    }
    if (!dateVal) {
        alert("Please select the event date.");
        if (eventDate) eventDate.focus();
        return;
    }

    // Past date validation
    const todayStr = getTodayDateString();
    if (dateVal < todayStr) {
        if (alertBox) {
            alertBox.innerHTML = `<strong>Date Validation Error:</strong> Booking date cannot be in the past (${dateVal}). Please select today (${todayStr}) or a future date.`;
            alertBox.classList.remove('d-none');
        } else {
            alert(`Date Validation Error: Booking date cannot be in the past (${dateVal}). Please select today or a future date.`);
        }
        if (eventDate) {
            eventDate.classList.add('is-invalid');
            eventDate.focus();
        }
        return;
    }

    if (!startVal || !endVal) {
        alert("Please provide both start time and end time.");
        return;
    }

    if (startVal >= endVal) {
        if (alertBox) {
            alertBox.innerHTML = '<strong>Time Validation Error:</strong> Event end time must be strictly after start time.';
            alertBox.classList.remove('d-none');
        } else {
            alert('Time Validation Error: Event end time must be strictly after start time.');
        }
        if (endTime) {
            endTime.classList.add('is-invalid');
            endTime.focus();
        }
        return;
    }

    if (!reqsVal) {
        if (alertBox) {
            alertBox.textContent = 'Validation error: Please describe your event details in the Custom Requirements field.';
            alertBox.classList.remove('d-none');
        } else {
            alert("Validation error: Please enter your event details in the Custom Requirements field before submitting.");
        }
        if (customNotes) customNotes.focus();
        return;
    }

    // Overlap validation check
    const customSlotCheck = await checkAndRenderBookedSlots('custom');
    if (!customSlotCheck.valid) {
        if (alertBox) {
            alertBox.innerHTML = `<strong>Booking Time Conflict:</strong> ${customSlotCheck.message || 'The selected time slot overlaps with an existing booking.'}`;
            alertBox.classList.remove('d-none');
        } else {
            alert(`Booking Time Conflict: ${customSlotCheck.message}`);
        }
        return;
    }

    if (alertBox) {
        alertBox.classList.add('d-none');
    }

    const formattedStartTime = startVal.length === 5 ? `${startVal}:00` : startVal;
    const formattedEndTime = endVal.length === 5 ? `${endVal}:00` : endVal;

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
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(customBookingDto)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            clearBookedSlotsCache();
            alert(data.message || 'Custom booking request submitted successfully with "Pending" status (Advance: LKR 3,000)!');

            const modalEl = document.getElementById('customBookingModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            const formEl = document.getElementById('customBookingForm');
            if (formEl) formEl.reset();

            loadCustomerBookings();
            switchTab('bookings');

        } else {
            const errMsg = data.message || 'Failed to submit custom booking request.';
            if (alertBox) {
                alertBox.textContent = errMsg;
                alertBox.classList.remove('d-none');
            } else {
                alert(errMsg);
            }
        }
    } catch (error) {
        console.error('Error creating custom booking:', error);
        alert('An error occurred while connecting to the server to submit your custom booking.');
    }
}

// 10. Load Customer Bookings and populate tables & metrics
async function loadCustomerBookings() {
    if (!currentUser) return;

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

            // Calculate metrics
            let activeCount = 0;
            let pendingCount = 0;
            let completedCount = 0;

            customerBookings.forEach(b => {
                const st = (b.bookingStatus || '').toLowerCase();
                if (st === 'confirmed' || st === 'active') activeCount++;
                else if (st === 'pending') pendingCount++;
                else if (st === 'completed') completedCount++;
            });

            const activeMetricEl = document.getElementById('metricActiveShoots');
            if (activeMetricEl) activeMetricEl.textContent = activeCount;

            const pendingMetricEl = document.getElementById('metricPendingShoots');
            if (pendingMetricEl) pendingMetricEl.textContent = pendingCount;

            const completedMetricEl = document.getElementById('metricCompletedShoots');
            if (completedMetricEl) completedMetricEl.textContent = completedCount;

            let fullRowsHtml = '';
            let recentRowsHtml = '';

            if (customerBookings.length === 0) {
                if (fullTableBody) {
                    fullTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No bookings found. Click "Custom Booking Request" or select a package to book a shoot!</td></tr>`;
                }
                if (recentTableBody) {
                    recentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No recent bookings recorded yet.</td></tr>`;
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

            if (fullTableBody) fullTableBody.innerHTML = fullRowsHtml;
            if (recentTableBody) recentTableBody.innerHTML = recentRowsHtml;

        }
    } catch (error) {
        console.error('Error fetching customer bookings:', error);
    }
}

// 11. Open Booking Details Modal
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
        if (st === 'confirmed' || st === 'active') statusEl.className = 'badge badge-soft-success';
        else if (st === 'completed') statusEl.className = 'badge badge-soft-primary';
        else if (st === 'cancelled') statusEl.className = 'badge badge-soft-danger';
        else statusEl.className = 'badge badge-soft-warning';
    }

    // Update the visual booking status tracker & progress bar
    updateBookingStatusTracker(booking.bookingStatus, 'cust');

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

// Visual Booking Status Tracker Updater
function updateBookingStatusTracker(status, prefix = 'cust') {
    const rawStatus = (status || 'Pending').toString().trim();
    const st = rawStatus.toLowerCase();

    const progressBar = document.getElementById(`${prefix}DetailProgressBar`);
    const statusPill = document.getElementById(`${prefix}DetailStatusPill`);
    const statusAlertContainer = document.getElementById(`${prefix}DetailStatusAlert`);
    const step1 = document.getElementById(`${prefix}Step1`);
    const step2 = document.getElementById(`${prefix}Step2`);
    const step3 = document.getElementById(`${prefix}Step3`);
    const step4 = document.getElementById(`${prefix}Step4`);

    if (!progressBar || !statusPill) return;

    // Reset base classes for steps
    [step1, step2, step3, step4].forEach(s => { if (s) s.className = 'step-node'; });

    if (st === 'cancelled') {
        progressBar.style.width = '100%';
        progressBar.className = 'progress-bar bg-danger';
        statusPill.textContent = 'Cancelled';
        statusPill.className = 'badge badge-soft-danger px-3 py-1 fw-bold';
        [step1, step2, step3, step4].forEach(s => { if (s) s.className = 'step-node cancelled'; });
        if (statusAlertContainer) {
            statusAlertContainer.innerHTML = `
                <div class="alert alert-danger py-2 px-3 d-flex align-items-center mb-0 rounded-3 small">
                    <i class="bi bi-x-circle-fill fs-5 me-2 text-danger"></i>
                    <div><strong>Booking Cancelled:</strong> This event booking request is cancelled/rejected and is no longer active.</div>
                </div>`;
        }
    } else if (st === 'completed') {
        progressBar.style.width = '100%';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-primary';
        statusPill.textContent = 'Completed';
        statusPill.className = 'badge badge-soft-primary px-3 py-1 fw-bold';
        if (step1) step1.className = 'step-node completed';
        if (step2) step2.className = 'step-node completed';
        if (step3) step3.className = 'step-node completed';
        if (step4) step4.className = 'step-node active-completed';
        if (statusAlertContainer) {
            statusAlertContainer.innerHTML = `
                <div class="p-2 px-3 bg-primary-subtle border border-primary-subtle rounded-3 small text-primary d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2 fs-6"></i>
                    <span><strong>Event Completed:</strong> Photo shoot was completed successfully and deliverables are available in the gallery.</span>
                </div>`;
        }
    } else if (st === 'confirmed' || st === 'active') {
        progressBar.style.width = '65%';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
        statusPill.textContent = rawStatus;
        statusPill.className = 'badge badge-soft-success px-3 py-1 fw-bold';
        if (step1) step1.className = 'step-node completed';
        if (step2) step2.className = 'step-node active-confirmed';
        if (step3) step3.className = 'step-node';
        if (step4) step4.className = 'step-node';
        if (statusAlertContainer) {
            statusAlertContainer.innerHTML = `
                <div class="p-2 px-3 bg-success-subtle border border-success-subtle rounded-3 small text-success d-flex align-items-center">
                    <i class="bi bi-calendar2-check-fill me-2 fs-6"></i>
                    <span><strong>Booking Confirmed:</strong> Date locked & lead photographer assigned.</span>
                </div>`;
        }
    } else {
        progressBar.style.width = '25%';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-warning text-dark';
        statusPill.textContent = 'Pending';
        statusPill.className = 'badge badge-soft-warning px-3 py-1 fw-bold';
        if (step1) step1.className = 'step-node active-pending';
        if (step2) step2.className = 'step-node';
        if (step3) step3.className = 'step-node';
        if (step4) step4.className = 'step-node';
        if (statusAlertContainer) {
            statusAlertContainer.innerHTML = `
                <div class="p-2 px-3 bg-warning-subtle border border-warning-subtle rounded-3 small text-warning-emphasis d-flex align-items-center">
                    <i class="bi bi-clock-history me-2 fs-6"></i>
                    <span><strong>Request Pending:</strong> Submitted successfully. Awaiting review and scheduling.</span>
                </div>`;
        }
    }
}

// 12. Handle URL Intentions (e.g. after login redirection)
function handleUrlIntentions() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookPackageId = urlParams.get('bookPackage');
    const isCustomBooking = urlParams.get('customBooking');
    const hash = window.location.hash;

    if (bookPackageId) {
        if (currentUser) {
            selectPackageForBooking(parseInt(bookPackageId));
        } else {
            showLoginPrompt('Please sign in to book your selected photography package.', `customer-dashboard.html?bookPackage=${bookPackageId}`);
        }
        // Clean query parameters
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    } else if (isCustomBooking) {
        if (currentUser) {
            openCustomBookingModal();
        } else {
            showLoginPrompt('Please sign in to submit a custom booking request.', 'customer-dashboard.html?customBooking=true');
        }
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    } else if (hash === '#bookings') {
        if (currentUser) {
            switchTab('bookings');
        } else {
            showLoginPrompt('Please sign in to view your bookings.', 'customer-dashboard.html#bookings');
        }
    } else if (hash) {
        const cleanTab = hash.replace('#', '');
        switchTab(cleanTab);
    }
}

// 13. Escape Helpers
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

// 14. Sign Out
async function signOut() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        currentUser = null;
        setupGuestUI();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = 'login.html';
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        eventDateInput.setAttribute('min', todayStr);
    }
    const customEventDateInput = document.getElementById('customEventDate');
    if (customEventDateInput) {
        customEventDateInput.setAttribute('min', todayStr);
    }

    // Attach listeners for live datewise booked timeslot checking
    setupBookedSlotListeners();

    // Check session on page load
    checkSession();
});
