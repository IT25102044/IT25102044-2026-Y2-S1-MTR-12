// Role-based Authentication & Dashboard Redirection

function getDashboardForRole(role) {
    if (!role) {
        return 'customer-dashboard.html';
    }

    // Normalize role string (e.g. "Operation Manager" -> "OPERATION_MANAGER", "CRO" -> "CRO")
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
        case 'CLIENT_RELATION_OFFICER':
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
        case 'LEAD_PHOTOGRAPHER':
        case 'SENIOR_PHOTOGRAPHER':
        case 'SENIOREVENTPHOTOGRAPHER':
            return 'photographer.html';

        case 'EQUIPMENT_MANAGER':
        case 'EQUIPMENT':
        case 'INVENTORY_MANAGER':
            return 'equipment-dashboard.html';

        default:
            console.warn(`Unknown user role: "${role}", defaulting to customer dashboard.`);
            return 'customer-dashboard.html';
    }
}

async function signIn() {
    const emailInput = document.getElementById('signInEmail');
    const passwordInput = document.getElementById('signInPassword');

    if (!emailInput || !passwordInput) {
        console.error("Sign in form inputs not found.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    const signInDto = {
        email: email,
        password: password
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(signInDto)
        });

        const data = await response.json();

        if (response.ok && data.status && data.data) {
            const user = data.data;
            const userRole = user.role || '';
            const targetDashboard = getDashboardForRole(userRole);

            // Clear any lingering session redirect
            sessionStorage.removeItem('postLoginRedirect');

            console.log(`Authenticated as ${userRole}. Redirecting to: ${targetDashboard}`);
            window.location.href = targetDashboard;

        } else {
            alert(data.message || "Sign In Failed! Invalid email or password.");
        }
    } catch (error) {
        console.error("Error during sign in:", error);
        alert("An error occurred while connecting to the server.");
    }
}
