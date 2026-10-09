
/* Use the group's existing HTTP session. Never rely on localStorage JWT. */
    let photographerSession = null;
    async function verifyPhotographerSession() {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
            const body = await response.json();
            const user = body.data;
            if (!response.ok || !body.status || !user ||
                !['SENIORPHOTOGRAPHER', 'SENIOREVENTPHOTOGRAPHER'].includes(
                    String(user.role || '').trim().toUpperCase().replace(/[\s_-]+/g, ''))) {
                window.location.replace('/login.html');
                return;
            }
            photographerSession = user;
            const first = user.firstName || '';
            const last = user.lastName || '';
            const name = [first, last].filter(Boolean).join(' ') || 'Photographer';
            const initials = ((first[0] || '') + (last[0] || '')).toUpperCase() || 'SP';
            document.getElementById('sidebarName').textContent = name;
            document.getElementById('sidebarInitials').textContent = initials;
            document.getElementById('sidebarRole').textContent = 'Senior Photographer';
            await Promise.all([loadBookingEvents(), loadPhotographerProfile(), loadAllCatalogs()]);
        } catch (error) {
            window.location.replace('/login.html');
        }
    }
    document.addEventListener('DOMContentLoaded', verifyPhotographerSession);

    async function logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST', credentials: 'same-origin'
            });
        } finally {
            window.location.replace('/login.html');
        }
    }

    /* =========================================================
       BACKEND CONNECTION
       Theme/layout are unchanged. Only JavaScript behavior is
       connected to the Spring Boot backend.
    ========================================================= */

    /* =========================================================
       BACKEND CONNECTION
       Event Album & Photo Management
    ========================================================= */

    const API_BASE_URL = "/api/photos";
    const API_CATALOG_URL = "/api/catalogs";
    const API_BOOKING_URL = "/api/photographer/bookings";
    const API_PROFILE_URL = "/api/profile";

    let selectedBookingId = null;
    let selectedEventName = null;

    let selectedCatalogId = null;
    let selectedCatalogName = null;

    let showingAllCatalogs = true;
    let eventCatalogs = [];
    let availableBookingsForCatalog = [];
    let validatedFiles = [];
    let photos = [];


    /* =========================================================
       HELPER - AUTH HEADERS
    ========================================================= */

    // Escape database-controlled text before inserting it into HTML templates.
    function htmlText(value) {
        return String(value ?? '').replace(/[&<>"']/g, (c) => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
        })[c]);
    }

    function authHeaders() {
        return { "Accept": "application/json" }; // session cookie is automatically sent on same-origin requests
    }


    async function loadAllCatalogs() {
        showingAllCatalogs = true;

        try {
            const response = await fetch(API_CATALOG_URL, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            eventCatalogs = await response.json();
        } catch (error) {
            console.error(error);
            eventCatalogs = [];
        }

        renderCatalogs();
        populateUploadCatalogSelect();
    }


    async function loadPhotographerProfile() {
        const message = document.getElementById("profileSaveMessage");

        try {
            const response = await fetch(API_PROFILE_URL, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const profile = await response.json();
            document.getElementById("profileFirstName").value = profile.firstName || "";
            document.getElementById("profileLastName").value = profile.lastName || "";
            document.getElementById("profileMobile").value = profile.mobile || "";
            document.getElementById("profileEmail").value = profile.email || "";
            document.getElementById("profileExperienceYears").value = profile.experienceYears ?? 0;
            document.getElementById("profileBio").value = profile.bio || "";
            if (message) message.classList.add("d-none");
        } catch (error) {
            showProfileMessage(message, error.message || "Unable to load your profile.", "danger");
        }
    }


    async function savePhotographerProfile(event) {
        event.preventDefault();

        const message = document.getElementById("profileSaveMessage");
        const button = document.getElementById("saveProfileButton");
        button.disabled = true;

        try {
            const response = await fetch(API_PROFILE_URL, {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: document.getElementById("profileFirstName").value.trim(),
                    lastName: document.getElementById("profileLastName").value.trim(),
                    mobile: document.getElementById("profileMobile").value.trim(),
                    experienceYears: Number(document.getElementById("profileExperienceYears").value),
                    bio: document.getElementById("profileBio").value
                })
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const profile = await response.json();
            document.getElementById("sidebarName").textContent = `${profile.firstName} ${profile.lastName}`.trim();
            document.getElementById("sidebarInitials").textContent =
                ((profile.firstName || "").charAt(0) + (profile.lastName || "").charAt(0)).toUpperCase() || "SP";
            showProfileMessage(message, "Profile saved successfully.", "success");
        } catch (error) {
            showProfileMessage(message, error.message || "Unable to save your profile.", "danger");
        } finally {
            button.disabled = false;
        }
    }


    function changePhotographerPassword() {
        // The group login uses a different password system from the separate project.
        // Keep the requested original UI, but do not claim to change a password.
        document.getElementById('newProfilePassword').value = '';
        document.getElementById('confirmProfilePassword').value = '';
        document.getElementById('passwordChangeSuccess').classList.add('d-none');
        showProfileMessage(document.getElementById('passwordChangeMessage'),
            'Password changes are temporarily unavailable until the group login system supports them.',
            'warning');
    }


    function toggleProfilePassword(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector("i");
        const showPassword = input.type === "password";
        input.type = showPassword ? "text" : "password";
        icon.classList.toggle("bi-eye", !showPassword);
        icon.classList.toggle("bi-eye-slash", showPassword);
        button.title = showPassword ? "Hide password" : "Show password";
        button.setAttribute("aria-label", button.title);
    }


    function showProfileMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = "alert alert-" + type + " mb-3";
    }


    async function loadBookingEvents() {
        const container = document.getElementById("bookingEventsContainer");
        const message = document.getElementById("bookingEventsMessage");
        if (!container || !message) return;

        try {
            const response = await fetch(API_BOOKING_URL, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const bookings = await response.json();
            container.replaceChildren();

            if (!Array.isArray(bookings) || bookings.length === 0) {
                message.textContent = "No any bookings";
                return;
            }

            message.classList.add("d-none");
            bookings.forEach(renderBookingEvent);
        } catch (error) {
            console.error(error);
            message.textContent = "Unable to load bookings.";
        }
    }


    function renderBookingEvent(booking) {
        const container = document.getElementById("bookingEventsContainer");
        if (!container) return;

        const column = document.createElement("div");
        column.className = "col-12 col-lg-4";

        const card = document.createElement("div");
        card.className = "event-card p-4 h-100 d-flex flex-column justify-content-between";

        const details = document.createElement("div");
        const bookingLabel = document.createElement("span");
        bookingLabel.className = "badge badge-soft-primary mb-3";
        bookingLabel.textContent = "Booking #" + booking.id;

        const title = document.createElement("h5");
        title.className = "fw-bold";
        title.textContent = booking.eventTitle || "Untitled event";

        const date = document.createElement("p");
        date.className = "text-muted small mb-2";
        const dateIcon = document.createElement("i");
        dateIcon.className = "bi bi-calendar3 me-2";
        date.append(dateIcon, formatBookingDate(booking.eventDate));

        const location = document.createElement("p");
        location.className = "text-muted small mb-2";
        const locationIcon = document.createElement("i");
        locationIcon.className = "bi bi-geo-alt me-2";
        location.append(locationIcon, booking.eventLocation || "Location not provided");

        const time = document.createElement("p");
        time.className = "text-muted small mb-0";
        const timeIcon = document.createElement("i");
        timeIcon.className = "bi bi-clock me-2";
        time.append(timeIcon, `${booking.startTime || ""} - ${booking.endTime || ""}`);

        const selectButton = document.createElement("button");
        selectButton.className = "btn btn-primary w-100 mt-3";
        selectButton.type = "button";
        selectButton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Select Event';
        selectButton.addEventListener("click", () => selectEvent(booking.id, booking.eventTitle));

        details.append(bookingLabel, title, date, location, time);
        card.append(details, selectButton);
        column.append(card);
        container.append(column);
    }


    function formatBookingDate(value) {
        if (!value) return "Date not provided";

        const date = new Date(value + "T00:00:00");
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    /* =========================================================
       HELPER - READ ERROR MESSAGE FROM BACKEND
    ========================================================= */

    async function getErrorMessage(response) {
        if (response.status === 401) {
            // An expired/invalid session requires a fresh login, not a logout API call.
            window.location.replace('/login.html');
            return "Your login session has expired. Please log in again.";
        }
        if (response.status === 403) {
            // Forbidden actions must not destroy an otherwise valid login session.
            return "Access denied. You do not have permission to perform this action.";
        }

        try {
            const body = await response.json();
            return body.message || body.error || ("Request failed with status " + response.status);
        } catch (error) {
            return "Request failed with status " + response.status;
        }
    }


    /* =========================================================
       HELPER - CONVERT BACKEND PHOTO TO FRONTEND PHOTO OBJECT
    ========================================================= */

    function normalizePhoto(photo) {
        const rawPath = String(photo.filePath || '').replace(/^\/+/, '');
        const filePath = /^uploads\/event-photos\/[a-zA-Z0-9._-]+$/.test(rawPath)
            ? '/' + rawPath : '';

        return {
            id: photo.id,
            catalogId: photo.catalogId,
            bookingId: photo.bookingId,
            fileName: photo.fileName,
            title: photo.title || photo.fileName.replace(/\.[^/.]+$/, ""),
            description: photo.description || "",
            fileType: photo.fileType || "",
            fileSize: (photo.fileSizeKb || 0) * 1024,
            imageUrl: filePath,
            uploadedAt: photo.uploadedAt,
            updatedAt: photo.updatedAt
        };
    }


    /* =========================================================
    SELECT EVENT & SHOW ITS ALBUM LIST
    ========================================================= */

    async function selectEvent(bookingId, eventName) {
        bookingId = Number(bookingId);
        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            alert("Invalid booking selected.");
            return;
        }

        selectedBookingId = bookingId;
        selectedEventName = eventName || ("Event #" + bookingId);
        showingAllCatalogs = false;
        selectedCatalogId = null;
        selectedCatalogName = null;

        const uploadSelectedEventEl = document.getElementById("uploadSelectedEvent");
        if (uploadSelectedEventEl) uploadSelectedEventEl.innerText = selectedEventName;

        // Reset section view to show albums list overview (hide inner album photos view if open)
        document.getElementById("catalogPhotosSection").classList.add("d-none");
        document.getElementById("eventCatalogsSection").classList.remove("d-none");

        // 1. Transfer to Event Album tab
        openTab("event-catalogs");

        // Load this event's albums into the overview.
        await loadCatalogsForSelectedEvent();

        if (eventCatalogs.length > 0) {
            const album = eventCatalogs[0];
            await openCatalog(album.id, album.catalogName, album.description);
        } else {
            await openCreateCatalogModal(bookingId);
        }
    }

    /* =========================================================
       ALBUM MANAGEMENT (READ, CREATE, DELETE)
    ========================================================= */

    function populateUploadCatalogSelect() {
        const select = document.getElementById("uploadCatalogSelect");
        if (!select) return;

        select.innerHTML = '<option value="">Select an Album...</option>';
        if (!eventCatalogs || eventCatalogs.length === 0) return;

        eventCatalogs.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.catalogName;
            select.appendChild(opt);
        });
    }


    async function loadCatalogsForSelectedEvent() {
        if (!selectedBookingId) return;

        showingAllCatalogs = false;

        try {
            const response = await fetch(API_CATALOG_URL + "/booking/" + selectedBookingId, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            eventCatalogs = await response.json();
            renderCatalogs();
            populateUploadCatalogSelect();
        } catch (error) {
            console.error(error);
            eventCatalogs = [];
            renderCatalogs();
            populateUploadCatalogSelect();
        }
    }


    function renderCatalogs() {
        const container = document.getElementById("catalogsContainer");
        const headerCreateButton = document.getElementById("createCatalogHeaderButton");
        const hasCatalogs = Array.isArray(eventCatalogs) && eventCatalogs.length > 0;

        if (headerCreateButton) {
            headerCreateButton.classList.toggle("d-none", !hasCatalogs);
        }

        container.innerHTML = "";

        if (!hasCatalogs) {
            const emptyMessage = showingAllCatalogs
                ? "No albums have been created yet."
                : "This event does not have an album yet.";
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5 border rounded bg-light">
                        <i class="bi bi-folder2-open text-muted" style="font-size:45px;"></i>
                        <h5 class="mt-3 fw-bold">No Albums Created Yet</h5>
                        <p class="text-muted small">${emptyMessage}</p>
                        <button class="btn btn-primary mt-3" onclick="openCreateCatalogModal()">
                            <i class="bi bi-folder-plus me-1"></i> Create New Album
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        eventCatalogs.forEach(cat => {
            const card = document.createElement("div");
            card.className = "col-12 col-md-6 col-lg-4";
            card.innerHTML = `
                <div class="card border h-100 shadow-sm rounded-3">
                    <div class="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge badge-soft-primary">
                                    <i class="bi bi-images me-1"></i> ${cat.photoCount || 0} Photos
                                </span>
                            </div>
                            <h5 class="fw-bold text-dark mb-2">${htmlText(cat.catalogName)}</h5>
                            <p class="text-muted small mb-3">
                                ${htmlText(cat.description || 'No description added.')}
                            </p>
                        </div>
                        <div class="d-flex gap-2 pt-3 border-top">
                            <button class="btn btn-sm btn-primary flex-fill" data-photographer-action="open">
                                <i class="bi bi-folder2-open me-1"></i> Open Album
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" title="Edit Album" aria-label="Edit Album" data-photographer-action="edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" title="Delete Album" data-photographer-action="delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            card.querySelector('[data-photographer-action="open"]').addEventListener('click',
                () => openCatalog(cat.id, cat.catalogName, cat.description || ''));
            card.querySelector('[data-photographer-action="edit"]').addEventListener('click',
                () => openEditCatalogModal(cat.id));
            card.querySelector('[data-photographer-action="delete"]').addEventListener('click',
                () => openDeleteCatalogModal(cat.id, cat.catalogName));
            container.appendChild(card);
        });
    }


    function openEditCatalogModal(catalogId) {
        const catalog = eventCatalogs.find(cat => Number(cat.id) === Number(catalogId));
        if (!catalog) return;

        document.getElementById("editCatalogId").value = catalog.id;
        document.getElementById("editCatalogName").value = catalog.catalogName || "";
        document.getElementById("editCatalogDescription").value = catalog.description || "";
        document.getElementById("editCatalogError").classList.add("d-none");
        document.getElementById("editCatalogError").textContent = "";
        document.getElementById("saveEditCatalogButton").disabled = false;

        new bootstrap.Modal(document.getElementById("editCatalogModal")).show();
    }


    async function saveEditedCatalog() {
        const id = Number(document.getElementById("editCatalogId").value);
        const catalogName = document.getElementById("editCatalogName").value.trim();
        const description = document.getElementById("editCatalogDescription").value.trim();
        const errorBox = document.getElementById("editCatalogError");
        const saveButton = document.getElementById("saveEditCatalogButton");

        const showError = message => {
            errorBox.textContent = message;
            errorBox.classList.remove("d-none");
        };

        errorBox.classList.add("d-none");
        if (!catalogName) {
            showError("Album name is required.");
            return;
        }
        if (catalogName.length > 150) {
            showError("Album name must be 150 characters or fewer.");
            return;
        }

        saveButton.disabled = true;
        try {
            const response = await fetch(API_CATALOG_URL + "/" + id, {
                method: "PUT",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ catalogName, description })
            });
            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const updated = await response.json();
            bootstrap.Modal.getInstance(document.getElementById("editCatalogModal")).hide();
            if (Number(selectedCatalogId) === id) {
                selectedCatalogName = updated.catalogName;
                document.getElementById("activeCatalogHeader").textContent = updated.catalogName;
                document.getElementById("activeCatalogDescription").textContent =
                    updated.description || "Manage and view photographs in this album.";
            }
            if (showingAllCatalogs) {
                await loadAllCatalogs();
            } else {
                await loadCatalogsForSelectedEvent();
            }
        } catch (error) {
            console.error(error);
            showError("Failed to update album: " + error.message);
        } finally {
            saveButton.disabled = false;
        }
    }


    async function openCreateCatalogModal(lockedBookingId = null) {
        const lockSelection = lockedBookingId !== null && lockedBookingId !== undefined;
        const preselectedBookingId = lockSelection ? Number(lockedBookingId) : selectedBookingId;
        const dropdownSection = document.getElementById("createCatalogEventDropdownSection");
        const lockedSection = document.getElementById("createCatalogLockedEventSection");
        const bookingSelect = document.getElementById("createCatalogBookingSelect");
        const message = document.getElementById("createCatalogEventsMessage");
        const submitButton = document.getElementById("submitCreateCatalogButton");

        dropdownSection.classList.toggle("d-none", lockSelection);
        lockedSection.classList.toggle("d-none", !lockSelection);
        document.getElementById("createCatalogLockedEventName").value = lockSelection
            ? selectedEventName || "Event #" + preselectedBookingId
            : "";
        bookingSelect.innerHTML = '<option value="">Loading completed events...</option>';
        bookingSelect.disabled = true;
        submitButton.disabled = true;
        message.textContent = "";
        message.className = "form-text mt-2";
        document.getElementById("newCatalogName").value = "";
        document.getElementById("newCatalogDescription").value = "";

        await loadAllCatalogs();

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("createCatalogModal"));
        modal.show();

        await loadAvailableBookingsForCatalog(preselectedBookingId, lockSelection);
    }


    async function loadAvailableBookingsForCatalog(preselectedBookingId, lockSelection = false) {
        const bookingSelect = document.getElementById("createCatalogBookingSelect");
        const message = document.getElementById("createCatalogEventsMessage");

        try {
            const [bookingResponse, catalogResponse] = await Promise.all([
                fetch(API_BOOKING_URL, { headers: authHeaders() }),
                fetch(API_CATALOG_URL, { headers: authHeaders() })
            ]);

            if (!bookingResponse.ok) {
                throw new Error(await getErrorMessage(bookingResponse));
            }
            if (!catalogResponse.ok) {
                throw new Error(await getErrorMessage(catalogResponse));
            }

            const [bookings, catalogs] = await Promise.all([
                bookingResponse.json(),
                catalogResponse.json()
            ]);
            const bookingsWithAlbums = new Set(
                catalogs.map(catalog => Number(catalog.bookingId))
            );
            availableBookingsForCatalog = bookings.filter(
                booking => !bookingsWithAlbums.has(Number(booking.id))
            );

            bookingSelect.innerHTML = '<option value="">Select an event...</option>';
            availableBookingsForCatalog.forEach(booking => {
                const option = document.createElement("option");
                option.value = booking.id;
                option.textContent = `${booking.eventTitle} - ${formatBookingDate(booking.eventDate)}`;
                bookingSelect.appendChild(option);
            });

            const preselectedBookingIsAvailable = preselectedBookingId
                && availableBookingsForCatalog.some(
                    booking => Number(booking.id) === Number(preselectedBookingId)
                );
            if (preselectedBookingIsAvailable) {
                bookingSelect.value = String(preselectedBookingId);
            }

            bookingSelect.disabled = lockSelection || availableBookingsForCatalog.length === 0;
            if (availableBookingsForCatalog.length === 0) {
                message.textContent = "No completed events without an album are available.";
                message.className = "form-text text-muted mt-2";
            } else if (lockSelection && !preselectedBookingIsAvailable) {
                message.textContent = "This event already has an album or is no longer available.";
                message.className = "form-text text-danger mt-2";
            }

            updateCreateCatalogSelectionState();
        } catch (error) {
            console.error(error);
            bookingSelect.innerHTML = '<option value="">Events could not be loaded</option>';
            bookingSelect.disabled = true;
            message.textContent = error.message || "Unable to load available events.";
            message.className = "form-text text-danger mt-2";
        }
    }


    function updateCreateCatalogSelectionState() {
        const bookingSelect = document.getElementById("createCatalogBookingSelect");
        document.getElementById("submitCreateCatalogButton").disabled = !bookingSelect.value;
    }


    async function submitCreateCatalog() {
        const bookingId = Number(document.getElementById("createCatalogBookingSelect").value);
        const catalogName = document.getElementById("newCatalogName").value.trim();
        const description = document.getElementById("newCatalogDescription").value.trim();

        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            alert("Please select an event.");
            return;
        }

        if (!catalogName) {
            alert("Album Name is required.");
            return;
        }

        try {
            const response = await fetch(API_CATALOG_URL, {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    bookingId: bookingId,
                    catalogName: catalogName,
                    description: description
                })
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            await response.json();
            const selectedBooking = availableBookingsForCatalog.find(
                booking => Number(booking.id) === bookingId
            );
            selectedBookingId = bookingId;
            selectedEventName = selectedBooking ? selectedBooking.eventTitle : "Event #" + bookingId;

            // Hide modal
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("createCatalogModal"));
            if (modalInstance) modalInstance.hide();

            // Reload albums
            await loadAllCatalogs();

        } catch (error) {
            console.error(error);
            alert("Failed to create album: " + error.message);
        }
    }


    function openDeleteCatalogModal(catalogId, catalogName) {
        document.getElementById("deleteCatalogId").value = catalogId;
        document.getElementById("deleteCatalogNameDisplay").innerText = catalogName;

        const modal = new bootstrap.Modal(document.getElementById("deleteCatalogModal"));
        modal.show();
    }


    async function confirmDeleteCatalog() {
        const catalogId = Number(document.getElementById("deleteCatalogId").value);

        try {
            const response = await fetch(API_CATALOG_URL + "/" + catalogId, {
                method: "DELETE",
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            bootstrap.Modal.getInstance(document.getElementById("deleteCatalogModal")).hide();

            if (selectedCatalogId === catalogId) {
                await backToCatalogs();
            } else if (showingAllCatalogs) {
                await loadAllCatalogs();
            } else {
                await loadCatalogsForSelectedEvent();
            }

            alert("Album and associated photos deleted successfully.");
        } catch (error) {
            console.error(error);
            alert("Delete album failed: " + error.message);
        }
    }


    /* =========================================================
       IN-ALBUM PHOTO MANAGEMENT
    ========================================================= */

    async function openCatalog(catalogId, catalogName, description) {
        const catalog = eventCatalogs.find(item => Number(item.id) === Number(catalogId));
        if (catalog) {
            selectedBookingId = Number(catalog.bookingId);
        }

        selectedCatalogId = catalogId;
        selectedCatalogName = catalogName;

        document.getElementById("activeCatalogHeader").innerText = catalogName;
        document.getElementById("activeCatalogDescription").innerText = description || "Manage and view photographs in this album.";

        document.getElementById("eventCatalogsSection").classList.add("d-none");
        document.getElementById("catalogPhotosSection").classList.remove("d-none");

        populateUploadCatalogSelect();
        const uploadSelect = document.getElementById("uploadCatalogSelect");
        if (uploadSelect) uploadSelect.value = catalogId;

        await loadPhotosForSelectedCatalog();
    }


    async function backToCatalogs() {
        selectedCatalogId = null;
        selectedCatalogName = null;

        document.getElementById("catalogPhotosSection").classList.add("d-none");
        document.getElementById("eventCatalogsSection").classList.remove("d-none");

        await loadAllCatalogs();
    }


    async function loadPhotosForSelectedCatalog() {
        if (!selectedCatalogId) {
            photos = [];
            renderPhotos();
            return;
        }

        try {
            const response = await fetch(API_BASE_URL + "/catalog/" + selectedCatalogId, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const data = await response.json();
            photos = data.map(normalizePhoto);
            renderPhotos();
        } catch (error) {
            console.error(error);
            photos = [];
            renderPhotos();
        }
    }


    /* =========================================================
       NAVIGATION / TAB HELPERS
    ========================================================= */

    function openTab(tabId) {
        const tabLink = document.querySelector('.sidebar a[href="#' + tabId + '"]');
        if (tabLink) {
            bootstrap.Tab.getOrCreateInstance(tabLink).show();
        }
    }


    /* =========================================================
       FILE SELECTION & VALIDATION
    ========================================================= */

    function openFileSelector() {
        if (!selectedBookingId) {
            alert("Please select an event first.");
            openTab("select-event");
            return;
        }

        if (!selectedCatalogId) {
            alert("Please open an album before uploading photos.");
            return;
        }

        document.getElementById("photoInput").click();
    }

    const photoDropZone = document.getElementById("photoDropZone");
    const photoInput = document.getElementById("photoInput");
    let photoDragDepth = 0;

    photoDropZone.addEventListener("click", openFileSelector);
    photoDropZone.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFileSelector();
        }
    });

    photoDropZone.addEventListener("dragenter", event => {
        event.preventDefault();
        photoDragDepth++;
        photoDropZone.classList.add("drag-over");
    });

    photoDropZone.addEventListener("dragover", event => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        photoDropZone.classList.add("drag-over");
    });

    photoDropZone.addEventListener("dragleave", event => {
        event.preventDefault();
        photoDragDepth = Math.max(0, photoDragDepth - 1);
        if (photoDragDepth === 0) photoDropZone.classList.remove("drag-over");
    });

    photoDropZone.addEventListener("drop", event => {
        event.preventDefault();
        photoDragDepth = 0;
        photoDropZone.classList.remove("drag-over");

        // Use the same checks for dropped files and manually selected files.
        if (!selectedBookingId || !selectedCatalogId) {
            openFileSelector();
            return;
        }
        validatePhotos(event.dataTransfer ? event.dataTransfer.files : []);
    });

    photoInput.addEventListener("change", () => validatePhotos(photoInput.files));

    function validatePhotos(fileList) {
        const files = Array.from(fileList || []);
        const result = document.getElementById("validationResult");
        result.innerHTML = "";
        validatedFiles = [];

        if (files.length === 0) return;

        let rejectedCount = 0;

        files.forEach(file => {
            const allowedTypes = ["image/jpeg", "image/png"];
            const maximumSize = 10 * 1024 * 1024;

            const extension = file.name.split(".").pop().toLowerCase();
            const allowedExtensions = ["jpg", "jpeg", "png"];

            const typeValid = allowedTypes.includes(file.type) &&
                allowedExtensions.includes(extension) &&
                (extension === "png" ? file.type === "image/png" : file.type === "image/jpeg");
            const sizeValid = file.size > 0 && file.size <= maximumSize;
            const valid = typeValid && sizeValid;

            if (valid) {
                validatedFiles.push(file);
            } else {
                rejectedCount++;
            }

            const row = document.createElement("div");
            row.className = "border rounded p-3 mb-2 d-flex justify-content-between align-items-center bg-white";

            let reason = "";
            if (!typeValid) reason = "Invalid file type - only JPG, JPEG and PNG are allowed";
            else if (file.size === 0) reason = "Empty file";
            else if (!sizeValid) reason = "File exceeds 10 MB";

            const details = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent = file.name;
            details.appendChild(name);
            const size = document.createElement("div");
            size.className = "small text-muted";
            size.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
            details.appendChild(size);
            row.appendChild(details);

            const badge = document.createElement("span");
            badge.className = valid ? "badge badge-soft-success" : "badge badge-soft-danger";
            badge.textContent = valid ? "Valid" : reason;
            row.appendChild(badge);
            result.appendChild(row);
        });

        if (rejectedCount > 0) {
            const error = document.createElement("div");
            error.className = "alert alert-danger mb-3";
            error.setAttribute("role", "alert");
            error.textContent = `${rejectedCount} file(s) rejected. Only JPG, JPEG and PNG photos up to 10 MB each are allowed.`;
            result.prepend(error);
        }
    }

    function clearSelectedPhotos() {
        document.getElementById("photoInput").value = "";
        document.getElementById("validationResult").innerHTML = "";
        validatedFiles = [];
    }


    /* =========================================================
       UPLOAD PHOTOS DIRECTLY TO IN-ALBUM
    ========================================================= */

    async function uploadPhotos() {
        if (!selectedBookingId) {
            alert("Please select an event first.");
            return;
        }

        if (!selectedCatalogId) {
            alert("Please open an album before uploading photos.");
            return;
        }

        if (validatedFiles.length === 0) {
            alert("Please select valid photos to upload.");
            return;
        }

        const uploadButton = document.querySelector('#catalogUploadCollapse button[onclick="uploadPhotos()"]');
        if (uploadButton) uploadButton.disabled = true;

        let successCount = 0;

        try {
            for (const file of validatedFiles) {
                const formData = new FormData();
                formData.append("catalogId", selectedCatalogId);
                formData.append("file", file);
                formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
                formData.append("description", "");

                const response = await fetch(API_BASE_URL + "/upload", {
                    method: "POST",
                    headers: authHeaders(),
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(await getErrorMessage(response));
                }
                successCount++;
            }

            alert(successCount + " photo(s) uploaded successfully into this album.");
            clearSelectedPhotos();

            // Collapse upload area
            const uploadCollapse = document.getElementById("catalogUploadCollapse");
            if (uploadCollapse) {
                const bsCollapse = bootstrap.Collapse.getInstance(uploadCollapse);
                if (bsCollapse) bsCollapse.hide();
            }

            // Reload album photos & album counts
            await loadPhotosForSelectedCatalog();
            await loadCatalogsForSelectedEvent();

        } catch (error) {
            console.error(error);
            alert("Upload failed: " + error.message);
        } finally {
            if (uploadButton) uploadButton.disabled = false;
        }
    }


    /* =========================================================
       RENDER GALLERY & FILTERING
    ========================================================= */

    function renderPhotos() {
        const gallery = document.getElementById("photoGallery");
        const count = document.getElementById("photoCount");
        if (!gallery || !count) return;

        gallery.innerHTML = "";

        if (!selectedCatalogId) {
            gallery.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-folder-x text-muted" style="font-size:50px;"></i>
                        <h5 class="mt-3 fw-bold">No Album Selected</h5>
                        <p class="text-muted">Select an album to view its photographs.</p>
                    </div>
                </div>
            `;
            count.innerText = "0 Photos";
            return;
        }

        const searchTerm = document.getElementById("photoSearch").value.trim().toLowerCase();

        let filteredPhotos = [...photos];

        if (searchTerm !== "") {
            filteredPhotos = filteredPhotos.filter(photo =>
                photo.title.toLowerCase().includes(searchTerm)
                || photo.fileName.toLowerCase().includes(searchTerm)
            );
        }

        count.innerText = filteredPhotos.length + (filteredPhotos.length === 1 ? " Photo" : " Photos");

        if (filteredPhotos.length === 0) {
            gallery.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-images text-muted" style="font-size:50px;"></i>
                        <h5 class="mt-3 fw-bold">No Photos Found</h5>
                        <p class="text-muted">Upload photos to this album or change your filter criteria.</p>
                    </div>
                </div>
            `;
            return;
        }

        filteredPhotos.forEach(photo => {
            gallery.innerHTML += `
                <div class="col-sm-6 col-lg-4 col-xl-3">
                    <div class="photo-card h-100 d-flex flex-column justify-content-between">
                        <div>
                            <div class="photo-preview">
                                <img src="${htmlText(photo.imageUrl)}" alt="${htmlText(photo.title)}">
                            </div>
                            <div class="p-3">
                                <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                                    <h6 class="fw-bold mb-0">${htmlText(photo.title)}</h6>
                                </div>
                                <p class="text-muted small mb-2">${htmlText(photo.fileName)}</p>
                            </div>
                        </div>
                        <div class="p-3 pt-0">
                            <div class="d-flex gap-2 border-top pt-2">
                                <button class="btn btn-sm btn-light border flex-fill" title="View Photo" onclick="viewPhoto(${photo.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-light border flex-fill" title="Edit Details" onclick="editPhoto(${photo.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger flex-fill" title="Delete Photo" onclick="openDeleteModal(${photo.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }


    /* =========================================================
       PHOTO MODAL ACTIONS (VIEW, EDIT, DELETE)
    ========================================================= */

    function viewPhoto(photoId) {
        const photo = photos.find(p => p.id === photoId);
        if (!photo) return;

        document.getElementById("viewPhotoImage").src = photo.imageUrl;
        document.getElementById("viewPhotoTitle").innerText = photo.title;
        document.getElementById("viewPhotoFileName").innerText = photo.fileName;
        document.getElementById("viewPhotoType").innerText = photo.fileType;
        document.getElementById("viewPhotoSize").innerText = (photo.fileSize / 1024 / 1024).toFixed(2) + " MB";
        document.getElementById("viewPhotoDescription").innerText = photo.description || "No description";

        const modal = new bootstrap.Modal(document.getElementById("viewPhotoModal"));
        modal.show();
    }


    function editPhoto(photoId) {
        const photo = photos.find(p => p.id === photoId);
        if (!photo) return;

        document.getElementById("editPhotoId").value = photo.id;
        document.getElementById("editPhotoTitle").value = photo.title;
        document.getElementById("editPhotoDescription").value = photo.description;

        const modal = new bootstrap.Modal(document.getElementById("editPhotoModal"));
        modal.show();
    }


    async function updatePhotoDetails() {
        const photoId = Number(document.getElementById("editPhotoId").value);
        const title = document.getElementById("editPhotoTitle").value.trim();

        if (title === "") {
            alert("Photo title cannot be empty.");
            return;
        }

        const description = document.getElementById("editPhotoDescription").value.trim();

        try {
            const response = await fetch(API_BASE_URL + "/" + photoId, {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    description: description
                })
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            bootstrap.Modal.getInstance(document.getElementById("editPhotoModal")).hide();
            await loadPhotosForSelectedCatalog();
            alert("Photo details updated successfully.");

        } catch (error) {
            console.error(error);
            alert("Update failed: " + error.message);
        }
    }


    function openDeleteModal(photoId) {
        document.getElementById("deletePhotoId").value = photoId;
        const modal = new bootstrap.Modal(document.getElementById("deletePhotoModal"));
        modal.show();
    }


    async function confirmDeletePhoto() {
        const photoId = Number(document.getElementById("deletePhotoId").value);

        try {
            const response = await fetch(API_BASE_URL + "/" + photoId, {
                method: "DELETE",
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            bootstrap.Modal.getInstance(document.getElementById("deletePhotoModal")).hide();

            await loadPhotosForSelectedCatalog();
            await loadCatalogsForSelectedEvent();

            alert("Photo deleted successfully.");

        } catch (error) {
            console.error(error);
            alert("Delete failed: " + error.message);
        }
    }


    function resetFilters() {
        document.getElementById("photoSearch").value = "";
        renderPhotos();
    }
