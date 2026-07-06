import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

import { AlertService } from '@app/_services';
import { Role } from '@app/_models';

const accountsKey = 'angular-15-signup-verification-boilerplate-accounts';
let accounts: any[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');

// Seed default admin in mock database if not already present
if (!accounts.some(x => x.email === 'admin@example.com')) {
    accounts.push({
        id: 1,
        title: 'Mr',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: Role.Admin,
        isVerified: true,
        acceptTerms: true,
        dateCreated: new Date().toISOString(),
        refreshTokens: []
    });
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
} else {
    // Ensure credentials match admin123
    const admin = accounts.find(x => x.email === 'admin@example.com');
    if (admin) {
        admin.password = 'admin123';
        admin.role = Role.Admin;
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
    }
}

const departmentsKey = 'angular-auth-departments';
let departments: any[] = JSON.parse(localStorage.getItem(departmentsKey) || JSON.stringify([
    { id: 1, name: 'Engineering', description: 'Software engineering and IT operations' },
    { id: 2, name: 'Human Resources', description: 'Employee benefits, onboarding and recruitment' },
    { id: 3, name: 'Marketing', description: 'Brand management and digital advertising campaigns' }
]));
localStorage.setItem(departmentsKey, JSON.stringify(departments));

const employeesKey = 'angular-auth-employees';
let employees: any[] = JSON.parse(localStorage.getItem(employeesKey) || JSON.stringify([
    { empId: 'EMP001', email: 'admin@example.com', firstName: 'System', lastName: 'Admin', position: 'IT Director', department: 'Engineering', hireDate: '2020-01-15' }
]));
localStorage.setItem(employeesKey, JSON.stringify(employees));

const requestsKey = 'angular-auth-requests';
let requests: any[] = JSON.parse(localStorage.getItem(requestsKey) || JSON.stringify([
    { id: 1718000000001, type: 'Hardware Procurement', items: { device: 'MacBook Pro M3', RAM: '32GB' }, status: 'Approved', date: '2026-07-01', employeeEmail: 'admin@example.com' },
    { id: 1718000000002, type: 'Software Access', items: { software: 'Adobe Creative Cloud' }, status: 'Pending', date: '2026-07-05', employeeEmail: 'admin@example.com' }
]));
localStorage.setItem(requestsKey, JSON.stringify(requests));

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;
        const alertService = this.alertService;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/refresh-token') && method === 'POST':
                    return refreshToken();
                case url.endsWith('/accounts/revoke-token') && method === 'POST':
                    return revokeToken();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                case url.endsWith('/accounts/forgot-password') && method === 'POST':
                    return forgotPassword();
                case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
                    return validateResetToken();
                case url.endsWith('/accounts/reset-password') && method === 'POST':
                    return resetPassword();
                case url.endsWith('/accounts') && method === 'GET':
                    return getAccounts();
                case url.match(/\/accounts\/\d+$/) && method === 'GET':
                    return getAccountById();
                case url.endsWith('/accounts') && method === 'POST':
                    return createAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'PUT':
                    return updateAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
                    return deleteAccount();

                // departments mock routes
                case url.endsWith('/departments') && method === 'GET':
                    return getDepartments();
                case url.endsWith('/departments') && method === 'POST':
                    return createDepartment();
                case url.match(/\/departments\/\d+$/) && method === 'PUT':
                    return updateDepartment();
                case url.match(/\/departments\/\d+$/) && method === 'DELETE':
                    return deleteDepartment();

                // employees mock routes
                case url.endsWith('/employees') && method === 'GET':
                    return getEmployees();
                case url.endsWith('/employees') && method === 'POST':
                    return createEmployee();
                case url.match(/\/employees\/[a-zA-Z0-9_-]+$/) && method === 'PUT':
                    return updateEmployee();
                case url.match(/\/employees\/[a-zA-Z0-9_-]+$/) && method === 'DELETE':
                    return deleteEmployee();

                // requests mock routes
                case url.endsWith('/requests') && method === 'GET':
                    return getRequests();
                case url.endsWith('/requests') && method === 'POST':
                    return createRequest();
                case url.match(/\/requests\/\d+\/status$/) && method === 'PUT':
                    return updateRequestStatus();
                case url.match(/\/requests\/\d+$/) && method === 'DELETE':
                    return deleteRequest();

                // stats mock route
                case url.endsWith('/stats') && method === 'GET':
                    return getStats();

                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions

        function authenticate() {
            const { email, password } = body;
            const account = accounts.find(x => x.email === email && x.password === password && x.isVerified);

            if (!account) return error('Email or password is incorrect');

            // add refresh token to account
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function refreshToken() {
            const refreshToken = getRefreshToken();
            if (!refreshToken) return unauthorized();

            const account = accounts.find(x => x.refreshTokens.includes(refreshToken));
            if (!account) return unauthorized();

            // replace old refresh token with a new one and save
            account.refreshTokens = account.refreshTokens.filter((x: any) => x !== refreshToken);
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function revokeToken() {
            if (!isAuthenticated()) return unauthorized();

            const refreshToken = getRefreshToken();
            const account = accounts.find(x => x.refreshTokens.includes(refreshToken));

            // revoke token and save
            account.refreshTokens = account.refreshTokens.filter((x: any) => x !== refreshToken);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function register() {
            const account = body;

            if (accounts.find(x => x.email === account.email)) {
                setTimeout(() => {
                    alertService.info(
                        `<h4>Email Already Registered</h4>
                        <p>Your email ${account.email} is already registered.</p>
                        <p>If you don't know your password please visit the <a href="/account/forgot-password">forgot password</a> page.</p>
                        <strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.`,
                        { autoClose: false }
                    );
                }, 1000);

                return ok();
            }

            // assign account id and a few other properties then save
            account.id = newAccountId();
            if (account.id === 1) {
                // first registered account is an admin
                account.role = Role.Admin;
            } else {
                account.role = Role.User;
            }
            account.dateCreated = new Date().toISOString();
            account.verificationToken = new Date().getTime().toString();
            account.isVerified = false;
            account.refreshTokens = [];
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            // display verification email in alert
            setTimeout(() => {
                const verifyUrl = `${location.origin}/account/verify-email?token=${account.verificationToken}`;
                alertService.info(
                    `<h4>Verification Email</h4>
                    <p>Thanks for registering!</p>
                    <p>Please click the below link to verify your email address:</p>
                    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                    <strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.`,
                    { autoClose: false }
                );
            }, 1000);

            return ok();
        }

        function verifyEmail() {
            const { token } = body;
            const account = accounts.find(x => x.verificationToken === token);

            if (!account) return error('Verification failed');

            account.isVerified = true;
            account.verificationToken = null;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function forgotPassword() {
            const { email } = body;
            const account = accounts.find(x => x.email === email);

            // always return ok() response to prevent email enumeration
            if (account) {
                // create reset token that expires after 24 hours
                account.resetToken = new Date().getTime().toString();
                account.resetTokenExpires = new Date(Date.now() + 24*60*60*1000).toISOString();
                localStorage.setItem(accountsKey, JSON.stringify(accounts));

                // display password reset email in alert
                setTimeout(() => {
                    const resetUrl = `${location.origin}/account/reset-password?token=${account.resetToken}`;
                    alertService.info(
                        `<h4>Reset Password Email</h4>
                        <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.`,
                        { autoClose: false }
                    );
                }, 1000);
            }

            return ok();
        }

        function validateResetToken() {
            const { token } = body;
            const account = accounts.find(x => 
                !!x.resetToken && x.resetToken === token && 
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error('Invalid token');

            return ok();
        }

        function resetPassword() {
            const { token, password } = body;
            const account = accounts.find(x => 
                !!x.resetToken && x.resetToken === token && 
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error('Invalid token');

            // update password and remove reset token
            account.password = password;
            account.isVerified = true;
            delete account.resetToken;
            delete account.resetTokenExpires;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function getAccounts() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            return ok(accounts.map(x => basicDetails(x)));
        }

        function getAccountById() {
            if (!isAuthenticated()) return unauthorized();
            
            let account = accounts.find(x => x.id === idFromUrl());
            
            // user accounts can get own profile and admin accounts can get all profiles
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            return ok(basicDetails(account));
        }

        function createAccount() {
            if (!isAuthorized(Role.Admin)) return unauthorized();

            const account = body;
            if (accounts.find(x => x.email === account.email)) {
                return error(`Email ${account.email} is already registered`);
            }

            account.id = newAccountId();
            account.dateCreated = new Date().toISOString();
            account.isVerified = true;
            account.refreshTokens = [];
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function updateAccount() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());
            
            // user accounts can update own profile and admin accounts can update all profiles
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            // only update password if included
            if (!params().password) {
                delete params().password;
            }

            // don't save confirm password
            delete params().confirmPassword;

            // update and save account
            Object.assign(account, params());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok(basicDetails(account));
        }

        function deleteAccount() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());

            // user accounts can delete own account and admin accounts can delete any account
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            // delete account then save
            accounts = accounts.filter(x => x.id !== idFromUrl());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        // Departments handlers
        function getDepartments() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            return ok(departments);
        }

        function createDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const dept = body;
            dept.id = departments.length ? Math.max(...departments.map(x => x.id)) + 1 : 1;
            departments.push(dept);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok(dept);
        }

        function updateDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const id = idFromUrl();
            const dept = departments.find(x => x.id === id);
            if (!dept) return error('Department not found');
            Object.assign(dept, body);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok(dept);
        }

        function deleteDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const id = idFromUrl();
            departments = departments.filter(x => x.id !== id);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok({ message: 'Department deleted' });
        }

        // Employees handlers
        function getEmployees() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            return ok(employees);
        }

        function createEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const emp = body;
            const existingEmp = employees.find(x => x.email === emp.email || x.empId === emp.empId);
            if (existingEmp) return error('Employee email or ID already registered');
            employees.push(emp);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            return ok(emp);
        }

        function updateEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const parts = url.split('/');
            const empId = parts[parts.length - 1];
            const emp = employees.find(x => x.empId === empId);
            if (!emp) return error('Employee not found');
            Object.assign(emp, body);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            return ok(emp);
        }

        function deleteEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const parts = url.split('/');
            const empId = parts[parts.length - 1];
            employees = employees.filter(x => x.empId !== empId);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            return ok({ message: 'Employee deleted' });
        }

        // Service Requests handlers
        function getRequests() {
            if (!isAuthenticated()) return unauthorized();
            const account = currentAccount();
            if (account.role === Role.Admin) {
                return ok(requests);
            } else {
                return ok(requests.filter(r => r.employeeEmail === account.email));
            }
        }

        function createRequest() {
            if (!isAuthenticated()) return unauthorized();
            const account = currentAccount();
            const reqItem = body;
            reqItem.id = Date.now();
            reqItem.status = reqItem.status || 'Pending';
            reqItem.date = reqItem.date || new Date().toISOString().split('T')[0];
            reqItem.employeeEmail = account.email;
            requests.push(reqItem);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            return ok(reqItem);
        }

        function updateRequestStatus() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            const parts = url.split('/');
            const id = parseInt(parts[parts.length - 2]);
            const reqItem = requests.find(x => x.id === id);
            if (!reqItem) return error('Request not found');
            reqItem.status = body.status;
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            return ok(reqItem);
        }

        function deleteRequest() {
            if (!isAuthenticated()) return unauthorized();
            const id = idFromUrl();
            const reqItem = requests.find(x => x.id === id);
            if (!reqItem) return error('Request not found');
            const account = currentAccount();
            if (account.role !== Role.Admin && reqItem.employeeEmail !== account.email) {
                return unauthorized();
            }
            requests = requests.filter(x => x.id !== id);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            return ok({ message: 'Request deleted' });
        }

        // Stats handler
        function getStats() {
            if (!isAuthenticated()) return unauthorized();
            const account = currentAccount();
            if (account.role === Role.Admin) {
                return ok({
                    accountsCount: accounts.length,
                    deptsCount: departments.length,
                    empsCount: employees.length,
                    pendingReqsCount: requests.filter(r => r.status === 'Pending').length
                });
            } else {
                const userRequests = requests.filter(r => r.employeeEmail === account.email);
                return ok({
                    totalRequests: userRequests.length,
                    pendingCount: userRequests.filter(r => r.status === 'Pending').length,
                    approvedCount: userRequests.filter(r => r.status === 'Approved').length
                });
            }
        }

        // helper functions

        function ok(body?: any) {
            return of(new HttpResponse({ status: 200, body }))
                .pipe(delay(500)); // delay observable to simulate server api call
        }

        function error(message: string) {
            return throwError(() => ({ error: { message } }))
                .pipe(materialize(), delay(500), dematerialize()); // call materialize and dematerialize to delay error
        }

        function unauthorized() {
            return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }))
                .pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(account: any) {
            const { id, title, firstName, lastName, email, role, dateCreated, isVerified } = account;
            return { id, title, firstName, lastName, email, role, dateCreated, isVerified };
        }

        function isAuthenticated() {
            return !!currentAccount();
        }

        function isAuthorized(role: Role) {
            const account = currentAccount();
            if (!account) return false;
            return account.role === role;
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }

        function params() {
            return body;
        }

        function newAccountId() {
            return accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
        }

        function currentAccount() {
            // check if jwt token is in auth header
            const authHeader = headers.get('Authorization');
            if (!authHeader?.startsWith('Bearer fake-jwt-token')) return null;

            // check if token is expired
            const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
            const tokenExpired = Date.now() > (jwtToken.exp * 1000);
            if (tokenExpired) return null;

            const account = accounts.find(x => x.id === jwtToken.id);
            return account;
        }

        function generateJwtToken(account: any) {
            // create token that expires in 15 minutes
            const tokenPayload = {
                exp: Math.round(new Date(Date.now() + 15*60*1000).getTime() / 1000),
                id: account.id
            };
            return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
        }

        function generateRefreshToken() {
            const token = new Date().getTime().toString();
            
            // add token cookie that expires in 7 days
            const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString();
            document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/;`;
            
            return token;
        }

        function getRefreshToken() {
            const match = document.cookie.split(';').find(x => x.includes('fakeRefreshToken'));
            if (!match) return null;
            return match.split('=')[1] || null;
        }
    }
}

export const fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
