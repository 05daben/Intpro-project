import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Account } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.accountSubject = new BehaviorSubject<Account | null>(JSON.parse(localStorage.getItem('account') || 'null'));
        this.account = this.accountSubject.asObservable();
    }

    public get accountValue(): Account | null {
        return this.accountSubject.value;
    }

    login(email: string, password: string) {
        return this.http.post<Account>(`${environment.apiUrl}/accounts/authenticate`, { email, password })
            .pipe(map(account => {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                localStorage.setItem('account', JSON.stringify(account));
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    logout() {
        // revoke token, stop refresh timer, remove user from local storage and redirect to login
        this.http.post(`${environment.apiUrl}/accounts/revoke-token`, {}).subscribe();
        this.stopRefreshTokenTimer();
        localStorage.removeItem('account');
        this.accountSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    refreshToken() {
        return this.http.post<Account>(`${environment.apiUrl}/accounts/refresh-token`, {})
            .pipe(map(account => {
                localStorage.setItem('account', JSON.stringify(account));
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    register(account: Account) {
        return this.http.post(`${environment.apiUrl}/accounts/register`, account);
    }

    verifyEmail(token: string) {
        return this.http.post(`${environment.apiUrl}/accounts/verify-email`, { token });
    }

    forgotPassword(email: string) {
        return this.http.post(`${environment.apiUrl}/accounts/forgot-password`, { email });
    }

    validateResetToken(token: string) {
        return this.http.post(`${environment.apiUrl}/accounts/validate-reset-token`, { token });
    }

    resetPassword(token: string, password: string) {
        return this.http.post(`${environment.apiUrl}/accounts/reset-password`, { token, password });
    }

    getAll() {
        return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
    }

    getById(id: string) {
        return this.http.get<Account>(`${environment.apiUrl}/accounts/${id}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/accounts`, params);
    }

    update(id: string, params: any) {
        return this.http.put<Account>(`${environment.apiUrl}/accounts/${id}`, params)
            .pipe(map(account => {
                // update local storage if the active logged in user was updated
                if (id === this.accountValue?.id) {
                    // publish updated user to subscribers
                    const updatedAccount = { ...this.accountValue, ...account };
                    localStorage.setItem('account', JSON.stringify(updatedAccount));
                    this.accountSubject.next(updatedAccount);
                }
                return account;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/accounts/${id}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own account
                if (id === this.accountValue?.id) {
                    this.logout();
                }
                return x;
            }));
    }

    // helper methods

    private refreshTokenTimeout?: any;

    private startRefreshTokenTimer() {
        // parse json object from base64 encoded jwt token
        const jwtBase64 = this.accountValue?.jwtToken?.split('.')[1];
        if (!jwtBase64) return;
        const jwtToken = JSON.parse(atob(jwtBase64));

        // set a timeout to refresh the token a minute before it expires
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        this.stopRefreshTokenTimer();
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }
}
