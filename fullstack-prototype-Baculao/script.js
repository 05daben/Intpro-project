// Constants and Data Store
const STORAGE_KEY = 'ipt_demo_v1';
window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};

let currentUser = null;
let editingAccountEmail = null;
let editingEmployeeId = null;

// Page Route Mapping
const routes = {
  '#/': '#home-page',
  '#/register': '#register-page',
  '#/verify-email': '#verify-email-page',
  '#/login': '#login-page',
  '#/profile': '#profile-page',
  '#/accounts': '#accounts-page',
  '#/departments': '#departments-page',
  '#/employees': '#employees-page',
  '#/requests': '#requests-page'
};

// --- DATA PERSISTENCE LAYER ---
function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      window.db = JSON.parse(data);
      // Ensure all root structures exist
      if (!window.db.accounts) window.db.accounts = [];
      if (!window.db.departments) window.db.departments = [];
      if (!window.db.employees) window.db.employees = [];
      if (!window.db.requests) window.db.requests = [];
    } else {
      seedData();
    }
  } catch (e) {
    console.error('Storage corrupted, reseeding...', e);
    seedData();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function seedData() {
  window.db = {
    accounts: [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'Admin',
        verified: true
      }
    ],
    departments: [
      { name: 'Engineering', description: 'Software team' },
      { name: 'HR', description: 'Human Resources' }
    ],
    employees: [],
    requests: []
  };
  saveToStorage();
}

// --- AUTH STATE MANAGEMENT ---
function setAuthState(isAuth, user) {
  if (isAuth && user) {
    currentUser = user;
    localStorage.setItem('auth_token', user.email);
    
    document.body.classList.remove('not-authenticated');
    document.body.classList.add('authenticated');
    
    document.getElementById('nav-username').textContent = `${user.firstName} ${user.lastName}`;
    
    if (user.role === 'Admin') {
      document.body.classList.add('is-admin');
    } else {
      document.body.classList.remove('is-admin');
    }
  } else {
    currentUser = null;
    localStorage.removeItem('auth_token');
    
    document.body.classList.remove('authenticated', 'is-admin');
    document.body.classList.add('not-authenticated');
    
    document.getElementById('nav-username').textContent = 'Account';
  }
}

function logout() {
  setAuthState(false, null);
  showToast('Logged out successfully.', 'info');
  navigateTo('#/');
}

// --- CLIENT SIDE ROUTING ---
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';
  
  // Hide success verification alert when moving away from login page
  if (hash !== '#/login') {
    document.getElementById('login-verified-alert').classList.add('d-none');
  }

  // Route Protection & Admin Guards
  const protectedRoutes = ['#/profile', '#/accounts', '#/departments', '#/employees', '#/requests'];
  const adminRoutes = ['#/accounts', '#/departments', '#/employees'];
  
  if (protectedRoutes.includes(hash) && !currentUser) {
    showToast('Authentication required. Redirecting to login.', 'warning');
    navigateTo('#/login');
    return;
  }
  
  if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'Admin')) {
    showToast('Access denied. Administrator privileges required.', 'danger');
    navigateTo('#/profile');
    return;
  }

  // Find target section selector
  const targetId = routes[hash] || '#home-page';
  
  // Hide all sections
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target section
  const activePage = document.querySelector(targetId);
  if (activePage) {
    activePage.classList.add('active');
  }

  // Trigger page-specific rendering
  if (hash === '#/verify-email') {
    renderVerifyEmailPage();
  } else if (hash === '#/profile') {
    renderProfile();
  } else if (hash === '#/accounts') {
    renderAccountsList();
  } else if (hash === '#/departments') {
    renderDepartmentsList();
  } else if (hash === '#/employees') {
    renderEmployeesList();
  } else if (hash === '#/requests') {
    renderRequestsList();
  }
}

// --- UI HELPER FUNCTIONS ---
function showToast(message, type = 'info') {
  const toastEl = document.getElementById('app-toast');
  const toastBody = document.getElementById('toast-body');
  
  toastBody.textContent = message;
  
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  if (type === 'success') toastEl.classList.add('bg-success');
  else if (type === 'danger') toastEl.classList.add('bg-danger');
  else if (type === 'warning') toastEl.classList.add('bg-warning');
  else toastEl.classList.add('bg-info');
  
  const bootstrapToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bootstrapToast.show();
}

function handleFormValidation(formId, callback) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
    } else {
      form.classList.remove('was-validated');
      callback();
    }
  });
}

// --- PAGE RENDERERS & EVENT HANDLERS ---

// Home Page "Get Started"
document.getElementById('home-get-started-btn').addEventListener('click', function(e) {
  if (currentUser) {
    e.preventDefault();
    navigateTo('#/profile');
  }
});

// Register Account Form Submission
handleFormValidation('register-form', () => {
  const firstName = document.getElementById('reg-first-name').value.trim();
  const lastName = document.getElementById('reg-last-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  // Check if account already exists
  const existing = window.db.accounts.find(acc => acc.email === email);
  if (existing) {
    showToast('This email is already registered.', 'danger');
    return;
  }

  // Register account
  const newAccount = { firstName, lastName, email, password, role: 'User', verified: false };
  window.db.accounts.push(newAccount);
  saveToStorage();
  
  localStorage.setItem('unverified_email', email);
  showToast('Account registered! Verification required.', 'success');
  
  // Clear form
  document.getElementById('register-form').reset();
  
  navigateTo('#/verify-email');
});

// Verify Email Section logic
function renderVerifyEmailPage() {
  const unverified = localStorage.getItem('unverified_email') || 'your account email';
  document.getElementById('verify-email-display').textContent = unverified;
}

document.getElementById('simulate-verify-btn').addEventListener('click', () => {
  const unverifiedEmail = localStorage.getItem('unverified_email');
  if (!unverifiedEmail) {
    showToast('No pending verification email found.', 'warning');
    navigateTo('#/register');
    return;
  }

  const account = window.db.accounts.find(acc => acc.email === unverifiedEmail);
  if (account) {
    account.verified = true;
    saveToStorage();
    localStorage.removeItem('unverified_email');
    
    // Notify login page to display success banner
    document.getElementById('login-verified-alert').classList.remove('d-none');
    showToast('Email verified successfully! You can now log in.', 'success');
    navigateTo('#/login');
  } else {
    showToast('Account not found in temporary DB.', 'danger');
  }
});

// Login Form Submission
handleFormValidation('login-form', () => {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const account = window.db.accounts.find(acc => acc.email === email && acc.password === password);
  
  if (account) {
    if (!account.verified) {
      showToast('Please verify your email address before logging in.', 'warning');
      localStorage.setItem('unverified_email', email);
      navigateTo('#/verify-email');
      return;
    }
    
    setAuthState(true, account);
    showToast(`Welcome back, ${account.firstName}!`, 'success');
    document.getElementById('login-form').reset();
    navigateTo('#/profile');
  } else {
    showToast('Invalid email or password.', 'danger');
  }
});

// Logout Event Listener
document.getElementById('logout-btn').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

// Profile Screen rendering
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profile-first-name').textContent = currentUser.firstName;
  document.getElementById('profile-last-name').textContent = currentUser.lastName;
  document.getElementById('profile-email').textContent = currentUser.email;
  
  const roleBadge = document.getElementById('profile-role');
  roleBadge.textContent = currentUser.role;
  if (currentUser.role === 'Admin') {
    roleBadge.className = 'badge bg-danger text-white';
  } else {
    roleBadge.className = 'badge bg-primary text-white';
  }
}

document.getElementById('edit-profile-btn').addEventListener('click', () => {
  alert('Edit Profile clicked (not implemented in prototype)');
});


// --- ADMIN MODULES ---

// 1. ACCOUNTS CRUD MODULE
function renderAccountsList() {
  const tableBody = document.getElementById('accounts-table-body');
  tableBody.innerHTML = '';
  
  window.db.accounts.forEach(acc => {
    const tr = document.createElement('tr');
    
    const verifiedBadge = acc.verified 
      ? `<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Verified</span>`
      : `<span class="text-secondary"><i class="bi bi-dash-circle me-1"></i>—</span>`;
      
    const roleClass = acc.role === 'Admin' ? 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20' : 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20';
    
    tr.innerHTML = `
      <td class="fw-semibold">${acc.firstName} ${acc.lastName}</td>
      <td class="text-secondary">${acc.email}</td>
      <td><span class="${roleClass}" style="font-size: 0.8rem;">${acc.role}</span></td>
      <td>${verifiedBadge}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount('${acc.email}')"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="resetAccountPassword('${acc.email}')"><i class="bi bi-key"></i> Reset PW</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.email}')"><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

window.editAccount = function(email) {
  const account = window.db.accounts.find(acc => acc.email === email);
  if (!account) return;
  
  editingAccountEmail = email;
  document.getElementById('account-form-title').textContent = 'Edit Account';
  document.getElementById('acc-first-name').value = account.firstName;
  document.getElementById('acc-last-name').value = account.lastName;
  document.getElementById('acc-email').value = account.email;
  document.getElementById('acc-role').value = account.role;
  document.getElementById('acc-verified').checked = account.verified;
  
  // Hide password fields during general profile edits
  document.getElementById('acc-password-container').classList.add('d-none');
  document.getElementById('acc-password').removeAttribute('required');
  
  const formCard = document.getElementById('account-form-card');
  formCard.classList.remove('d-none');
  formCard.scrollIntoView({ behavior: 'smooth' });
};

window.resetAccountPassword = function(email) {
  const newPassword = prompt(`Reset Password: Enter new password for ${email} (minimum 6 characters):`);
  if (newPassword === null) return; // User cancelled
  
  if (newPassword.trim().length < 6) {
    showToast('Password reset failed. Password must be at least 6 characters.', 'danger');
    return;
  }
  
  const account = window.db.accounts.find(acc => acc.email === email);
  if (account) {
    account.password = newPassword;
    saveToStorage();
    showToast(`Password successfully reset for ${email}.`, 'success');
  }
};

window.deleteAccount = function(email) {
  if (currentUser && currentUser.email === email) {
    showToast('Self-deletion is blocked. You cannot delete your logged-in administrator account.', 'danger');
    return;
  }
  
  if (confirm(`Are you sure you want to permanently delete the account for ${email}?`)) {
    window.db.accounts = window.db.accounts.filter(acc => acc.email !== email);
    // Also clean up any employee records linked to this account
    window.db.employees = window.db.employees.filter(emp => emp.email !== email);
    saveToStorage();
    renderAccountsList();
    showToast(`Account ${email} deleted successfully.`, 'success');
  }
};

document.getElementById('add-account-btn').addEventListener('click', () => {
  editingAccountEmail = null;
  document.getElementById('account-form-title').textContent = 'Add Account';
  document.getElementById('account-form').reset();
  
  // Show password field
  document.getElementById('acc-password-container').classList.remove('d-none');
  document.getElementById('acc-password').setAttribute('required', 'required');
  
  document.getElementById('account-form-card').classList.remove('d-none');
});

document.getElementById('close-account-form').addEventListener('click', hideAccountForm);
document.getElementById('cancel-account-btn').addEventListener('click', hideAccountForm);

function hideAccountForm() {
  document.getElementById('account-form-card').classList.add('d-none');
  document.getElementById('account-form').reset();
  document.getElementById('account-form').classList.remove('was-validated');
}

handleFormValidation('account-form', () => {
  const firstName = document.getElementById('acc-first-name').value.trim();
  const lastName = document.getElementById('acc-last-name').value.trim();
  const email = document.getElementById('acc-email').value.trim().toLowerCase();
  const role = document.getElementById('acc-role').value;
  const verified = document.getElementById('acc-verified').checked;

  if (editingAccountEmail) {
    // Edit existing account
    const accountIndex = window.db.accounts.findIndex(acc => acc.email === editingAccountEmail);
    if (accountIndex === -1) return;
    
    // Check email uniqueness if email changed
    if (editingAccountEmail !== email) {
      const emailConflict = window.db.accounts.find(acc => acc.email === email);
      if (emailConflict) {
        showToast('This email address is already assigned to another account.', 'danger');
        return;
      }
      // Update linked employee record if any
      const employee = window.db.employees.find(emp => emp.email === editingAccountEmail);
      if (employee) employee.email = email;
    }
    
    window.db.accounts[accountIndex].firstName = firstName;
    window.db.accounts[accountIndex].lastName = lastName;
    window.db.accounts[accountIndex].email = email;
    window.db.accounts[accountIndex].role = role;
    window.db.accounts[accountIndex].verified = verified;
    
    // If editing logged in user, refresh their session credentials immediately
    if (currentUser.email === editingAccountEmail) {
      currentUser = window.db.accounts[accountIndex];
      setAuthState(true, currentUser);
    }
    
    showToast('Account details updated successfully.', 'success');
  } else {
    // Add new account
    const conflict = window.db.accounts.find(acc => acc.email === email);
    if (conflict) {
      showToast('This email address is already registered.', 'danger');
      return;
    }
    
    const password = document.getElementById('acc-password').value;
    const newAcc = { firstName, lastName, email, password, role, verified };
    window.db.accounts.push(newAcc);
    showToast('New account created successfully.', 'success');
  }
  
  saveToStorage();
  renderAccountsList();
  hideAccountForm();
});


// 2. DEPARTMENTS MODULE
function renderDepartmentsList() {
  const tableBody = document.getElementById('departments-table-body');
  tableBody.innerHTML = '';
  
  window.db.departments.forEach(dept => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-semibold">${dept.name}</td>
      <td class="text-secondary">${dept.description}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="alert('Edit Department action is not implemented in prototype')"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="alert('Delete Department action is not implemented in prototype')"><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

document.getElementById('add-department-btn').addEventListener('click', () => {
  alert('Not implemented');
});


// 3. EMPLOYEES CRUD MODULE
function renderEmployeesList() {
  const tableBody = document.getElementById('employees-table-body');
  tableBody.innerHTML = '';
  
  window.db.employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-primary">${emp.id}</td>
      <td class="text-secondary">${emp.email}</td>
      <td class="fw-semibold">${emp.position}</td>
      <td><span class="badge bg-secondary">${emp.department}</span></td>
      <td class="text-secondary">${emp.hireDate}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee('${emp.id}')"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')"><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  
  // Re-populate options for dropdowns in background
  populateEmployeeDepartments();
}

function populateEmployeeDepartments() {
  const select = document.getElementById('emp-dept');
  if (!select) return;
  select.innerHTML = '';
  window.db.departments.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept.name;
    opt.textContent = dept.name;
    select.appendChild(opt);
  });
}

window.editEmployee = function(id) {
  const emp = window.db.employees.find(e => e.id === id);
  if (!emp) return;
  
  editingEmployeeId = id;
  document.getElementById('employee-form-title').textContent = 'Edit Employee';
  document.getElementById('emp-id').value = emp.id;
  // Employee ID is generally read-only during edit in standard CRUDs, but let's keep it editable or freeze it.
  document.getElementById('emp-id').setAttribute('readonly', 'readonly');
  
  document.getElementById('emp-email').value = emp.email;
  document.getElementById('emp-position').value = emp.position;
  document.getElementById('emp-dept').value = emp.department;
  document.getElementById('emp-hire-date').value = emp.hireDate;
  
  document.getElementById('employee-form-card').classList.remove('d-none');
  document.getElementById('employee-form-card').scrollIntoView({ behavior: 'smooth' });
};

window.deleteEmployee = function(id) {
  if (confirm(`Are you sure you want to remove the employee record for ID: ${id}?`)) {
    window.db.employees = window.db.employees.filter(e => e.id !== id);
    saveToStorage();
    renderEmployeesList();
    showToast(`Employee record ${id} removed successfully.`, 'success');
  }
};

document.getElementById('add-employee-btn').addEventListener('click', () => {
  editingEmployeeId = null;
  document.getElementById('employee-form-title').textContent = 'Add Employee';
  document.getElementById('employee-form').reset();
  document.getElementById('emp-id').removeAttribute('readonly');
  
  populateEmployeeDepartments();
  document.getElementById('employee-form-card').classList.remove('d-none');
});

document.getElementById('close-employee-form').addEventListener('click', hideEmployeeForm);
document.getElementById('cancel-employee-btn').addEventListener('click', hideEmployeeForm);

function hideEmployeeForm() {
  document.getElementById('employee-form-card').classList.add('d-none');
  document.getElementById('employee-form').reset();
  document.getElementById('employee-form').classList.remove('was-validated');
  document.getElementById('emp-email').classList.remove('is-invalid');
}

handleFormValidation('employee-form', () => {
  const empId = document.getElementById('emp-id').value.trim();
  const email = document.getElementById('emp-email').value.trim().toLowerCase();
  const position = document.getElementById('emp-position').value.trim();
  const department = document.getElementById('emp-dept').value;
  const hireDate = document.getElementById('emp-hire-date').value;

  // Form Custom Validation: User Email must match existing registered account
  const matchedAccount = window.db.accounts.find(acc => acc.email === email);
  if (!matchedAccount) {
    document.getElementById('emp-email').classList.add('is-invalid');
    showToast('Linked user account email must exist in Registered Accounts.', 'danger');
    return;
  }
  document.getElementById('emp-email').classList.remove('is-invalid');

  if (editingEmployeeId) {
    // Edit Mode
    const index = window.db.employees.findIndex(e => e.id === editingEmployeeId);
    if (index === -1) return;
    
    window.db.employees[index].email = email;
    window.db.employees[index].position = position;
    window.db.employees[index].department = department;
    window.db.employees[index].hireDate = hireDate;
    
    showToast('Employee record updated successfully.', 'success');
  } else {
    // Add Mode
    // Check ID unique
    const duplicateId = window.db.employees.find(e => e.id === empId);
    if (duplicateId) {
      showToast('An employee record already exists with this ID.', 'danger');
      return;
    }
    
    // Check Email unique among employee directory
    const duplicateEmail = window.db.employees.find(e => e.email === email);
    if (duplicateEmail) {
      showToast('An employee record is already associated with this user email.', 'danger');
      return;
    }
    
    const newEmp = { id: empId, email, position, department, hireDate };
    window.db.employees.push(newEmp);
    showToast('Employee record created successfully.', 'success');
  }
  
  saveToStorage();
  renderEmployeesList();
  hideEmployeeForm();
});


// --- USER REQUESTS MODULE (DYNAMIC ROW FORM AND BADGE RENDERING) ---
let requestModalInstance = null;

function renderRequestsList() {
  const tableBody = document.getElementById('requests-table-body');
  tableBody.innerHTML = '';
  
  const desc = document.getElementById('requests-page-desc');
  const actionHeaders = document.querySelectorAll('.admin-request-action-header');
  
  let list = [];
  
  if (currentUser.role === 'Admin') {
    // Admin sees all requests
    list = window.db.requests;
    desc.innerHTML = '<span class="badge bg-danger me-2">Admin View</span>Managing service requests submitted by all organization members.';
    actionHeaders.forEach(el => el.classList.remove('d-none'));
  } else {
    // Regular user sees only their requests
    list = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    desc.textContent = 'Submit and track requests for equipment, leave, or resources.';
    actionHeaders.forEach(el => el.classList.add('d-none'));
  }
  
  if (list.length === 0) {
    const tr = document.createElement('tr');
    const colsCount = currentUser.role === 'Admin' ? 6 : 5;
    tr.innerHTML = `<td colspan="${colsCount}" class="text-center text-secondary py-4">No service requests matches found.</td>`;
    tableBody.appendChild(tr);
    return;
  }
  
  list.forEach((req, idx) => {
    const tr = document.createElement('tr');
    
    let statusClass = 'badge-pending';
    let statusIcon = 'bi-clock-history';
    if (req.status === 'Approved') {
      statusClass = 'badge-approved';
      statusIcon = 'bi-check-circle-fill';
    } else if (req.status === 'Rejected') {
      statusClass = 'badge-rejected';
      statusIcon = 'bi-x-circle-fill';
    }
    
    const badge = `<span class="${statusClass}"><i class="bi ${statusIcon} me-1"></i>${req.status}</span>`;
    
    const itemsHtml = `<ul class="list-unstyled mb-0" style="padding-left: 0;">
      ${req.items.map(item => `<li><i class="bi bi-dot text-primary me-1"></i><span>${item.name}</span> <span class="badge bg-secondary bg-opacity-50 text-secondary ms-1">Qty: ${item.qty}</span></li>`).join('')}
    </ul>`;
    
    let actionsHtml = '';
    if (currentUser.role === 'Admin') {
      if (req.status === 'Pending') {
        // Find index in global requests list
        const globalIdx = window.db.requests.findIndex(r => r.date === req.date && r.employeeEmail === req.employeeEmail && r.type === req.type);
        actionsHtml = `
          <td class="text-end">
            <button class="btn btn-sm btn-success me-1 px-3" onclick="updateRequestStatus(${globalIdx}, 'Approved')"><i class="bi bi-check2"></i> Approve</button>
            <button class="btn btn-sm btn-danger px-3" onclick="updateRequestStatus(${globalIdx}, 'Rejected')"><i class="bi bi-x-lg"></i> Reject</button>
          </td>`;
      } else {
        actionsHtml = `<td class="text-end text-secondary">—</td>`;
      }
    }
    
    tr.innerHTML = `
      <td class="text-secondary">${req.date}</td>
      <td class="fw-semibold">${req.employeeEmail}</td>
      <td><span class="badge bg-dark border border-secondary text-light px-2.5 py-1.5" style="letter-spacing: 0.5px;">${req.type}</span></td>
      <td>${itemsHtml}</td>
      <td>${badge}</td>
      ${actionsHtml}
    `;
    
    tableBody.appendChild(tr);
  });
}

window.updateRequestStatus = function(index, newStatus) {
  if (index >= 0 && index < window.db.requests.length) {
    window.db.requests[index].status = newStatus;
    saveToStorage();
    renderRequestsList();
    showToast(`Request from ${window.db.requests[index].employeeEmail} is ${newStatus}.`, 'success');
  }
};

// Dynamic item management inside New Request form
function addItemRow(name = '', qty = 1) {
  const container = document.getElementById('request-items-container');
  const div = document.createElement('div');
  div.className = 'row g-2 mb-2 dynamic-row request-item-row';
  div.innerHTML = `
    <div class="col-8">
      <input type="text" class="form-control item-name" required placeholder="Item description (e.g. MacBook Pro)" value="${name}">
      <div class="invalid-feedback">Required.</div>
    </div>
    <div class="col-3">
      <input type="number" class="form-control item-qty" required min="1" value="${qty}">
    </div>
    <div class="col-1 d-flex align-items-center justify-content-center">
      <button type="button" class="btn btn-sm btn-outline-danger w-100 py-2 border-0 remove-item-row-btn" style="border-radius: 0.375rem;"><i class="bi bi-x-lg"></i></button>
    </div>
  `;
  container.appendChild(div);
  
  // Attach remove action
  div.querySelector('.remove-item-row-btn').addEventListener('click', () => {
    const rows = document.querySelectorAll('.request-item-row');
    if (rows.length > 1) {
      div.remove();
    } else {
      showToast('Requests must contain at least one item.', 'warning');
    }
  });
}

document.getElementById('add-item-row-btn').addEventListener('click', () => addItemRow());

// Intercept new request modal launch to reset form rows
const reqModalEl = document.getElementById('newRequestModal');
reqModalEl.addEventListener('show.bs.modal', () => {
  document.getElementById('new-request-form').reset();
  document.getElementById('new-request-form').classList.remove('was-validated');
  document.getElementById('request-items-container').innerHTML = '';
  document.getElementById('req-items-validation').style.display = 'none';
  // Add first empty item row
  addItemRow('', 1);
});

// New Request Form Submit Logic
document.getElementById('new-request-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = this;
  const itemsContainer = document.getElementById('request-items-container');
  const rows = itemsContainer.querySelectorAll('.request-item-row');
  const items = [];
  let itemsValid = true;

  rows.forEach(row => {
    const nameInput = row.querySelector('.item-name');
    const qtyInput = row.querySelector('.item-qty');
    const name = nameInput.value.trim();
    const qty = parseInt(qtyInput.value, 10);
    
    if (!name) {
      nameInput.classList.add('is-invalid');
      itemsValid = false;
    } else {
      nameInput.classList.remove('is-invalid');
    }
    
    if (isNaN(qty) || qty < 1) {
      qtyInput.classList.add('is-invalid');
      itemsValid = false;
    } else {
      qtyInput.classList.remove('is-invalid');
    }
    
    if (name && qty >= 1) {
      items.push({ name, qty });
    }
  });

  if (!form.checkValidity() || !itemsValid || items.length === 0) {
    e.stopPropagation();
    form.classList.add('was-validated');
    if (items.length === 0) {
      const validationText = document.getElementById('req-items-validation');
      validationText.textContent = 'Please fill out at least one item row.';
      validationText.style.display = 'block';
    }
    return;
  }

  // Valid and items compiled
  const type = document.getElementById('req-type').value;
  const newRequest = {
    type: type,
    items: items,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    employeeEmail: currentUser.email
  };

  window.db.requests.push(newRequest);
  saveToStorage();
  
  // Refresh and Close Modal
  renderRequestsList();
  
  // Hide modal using bootstrap instance API
  const modal = bootstrap.Modal.getInstance(reqModalEl);
  modal.hide();
  
  showToast('New service request submitted successfully.', 'success');
});


// --- INITIALIZATION ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  
  // Auto-login session recovery check
  const activeSessionEmail = localStorage.getItem('auth_token');
  if (activeSessionEmail) {
    const matchedUser = window.db.accounts.find(acc => acc.email === activeSessionEmail);
    if (matchedUser) {
      setAuthState(true, matchedUser);
    } else {
      setAuthState(false, null);
    }
  } else {
    setAuthState(false, null);
  }
  
  // Set default route to home if nothing specified
  if (!window.location.hash) {
    navigateTo('#/');
  }
  
  // Trigger initial routing
  handleRouting();
  
  // Set listener
  window.addEventListener('hashchange', handleRouting);
});
