// ============================================
// Authentication Service
// ============================================

import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuditService } from './audit.service';
import {
    AuthState,
    LoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    ConfirmPasswordReset,
} from '@core/models/auth.model';
import { UserProfile, UserRole } from '@models/common.model';

type AuthCacheEntry = {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
};

const AUTH_CACHE_KEY = 'registry.auth.cache';

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Service for handling user authentication and authorization
 * Manages login, logout, password reset, and session persistence
 */
@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly supabaseService = inject(SupabaseService);
    private readonly audit = inject(AuditService);
    private readonly router = inject(Router);

    // Reactive state management using signals
    private authState = signal<AuthState>({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
    });

    // Public signals for component consumption
    isAuthenticated$ = this.authState.asReadonly();
    readonly ready = signal(false);

    private authSubscription?: { unsubscribe: () => void };
    private initializationPromise: Promise<void>;

    constructor() {
        this.initializationPromise = this.initializeAuth();
        this.listenToAuthChanges();
    }

    /**
     * Initialize authentication on app startup
     * Check for existing session in browser storage
     */
    private async initializeAuth(): Promise<void> {
        try {
            const cachedAuth = this.readCachedAuth();
            if (cachedAuth) {
                this.updateAuthState({
                    isAuthenticated: true,
                    user: cachedAuth.user,
                    accessToken: cachedAuth.accessToken,
                    refreshToken: cachedAuth.refreshToken,
                    loading: false,
                    error: null,
                });
            }

            const auth = this.supabaseService.getAuth();
            const { data } = await auth.getSession();

            if (data?.session) {
                this.syncSessionState(data.session.user, data.session.access_token, data.session.refresh_token);
            } else if (cachedAuth) {
                this.clearCachedAuth();
                this.updateAuthState({
                    isAuthenticated: false,
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    loading: false,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.logout();
        } finally {
            this.ready.set(true);
        }
    }

    /**
     * Keep local auth state in sync with Supabase auth events
     */
    private listenToAuthChanges(): void {
        const auth = this.supabaseService.getAuth();
        const { data } = auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                this.syncSessionState(session.user, session.access_token, session.refresh_token);
                return;
            }

            this.clearCachedAuth();
            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                loading: false,
            });
        });

        this.authSubscription = data.subscription;
    }

    /**
     * Login with email and password
     */
    async login(credentials: LoginRequest): Promise<{ success: boolean; error: string | null }> {
        this.updateAuthState({ loading: true, error: null });

        try {
            const auth = this.supabaseService.getAuth();

            const { data, error } = await auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) {
                this.updateAuthState({
                    loading: false,
                    error: error.message,
                    isAuthenticated: false,
                });
                return { success: false, error: error.message };
            }

            if (data?.session && data?.user) {
                this.syncSessionState(data.user, data.session.access_token, data.session.refresh_token);
                await this.audit.log({
                    action: 'login',
                    entityType: 'auth',
                    entityId: data.user.id,
                    userId: data.user.id,
                    newValues: { email: data.user.email ?? null },
                });

                return { success: true, error: null };
            }

            return { success: false, error: 'Unknown error occurred' };
        } catch (error: unknown) {
            const errorMessage = getErrorMessage(error, 'Login failed');
            this.updateAuthState({ loading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Wait until the first auth restoration completes.
     */
    async whenReady(): Promise<void> {
        await this.initializationPromise;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            const user = this.getCurrentUser();
            await this.audit.log({
                action: 'logout',
                entityType: 'auth',
                entityId: user?.id ?? null,
                userId: user?.id ?? null,
                oldValues: user ? { email: user.email, role: user.role } : null,
            });

            const auth = this.supabaseService.getAuth();
            await auth.signOut();

            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                error: null,
            });

            this.router.navigate(['/auth/login']);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Request password reset
     */
    async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; error: string | null }> {
        try {
            const auth = this.supabaseService.getAuth();

            const { error } = await auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (error: unknown) {
            return { success: false, error: getErrorMessage(error, 'Reset password failed') };
        }
    }

    /**
     * Confirm password reset with new password
     */
    async confirmPasswordReset(
        data: ConfirmPasswordReset
    ): Promise<{ success: boolean; error: string | null }> {
        try {
            const auth = this.supabaseService.getAuth();

            const { error } = await auth.updateUser({
                password: data.newPassword,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (error: unknown) {
            return { success: false, error: getErrorMessage(error, 'Password reset failed') };
        }
    }

    /**
     * Get current user profile
     */
    getCurrentUser(): UserProfile | null {
        return this.authState().user;
    }

    /**
     * Get current auth state
     */
    getAuthState(): AuthState {
        return this.authState();
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: UserRole): boolean {
        const user = this.authState().user;
        return user?.role === role;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.authState().isAuthenticated;
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return this.authState().accessToken;
    }

    /**
     * Map Supabase user to our UserProfile interface
     */
    private mapSupabaseUserToProfile(supabaseUser: User): UserProfile {
        const metadata = supabaseUser.user_metadata;
        const now = new Date().toISOString();

        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            fullName: String(metadata?.['fullName'] || supabaseUser.email || 'User'),
            phone: metadata?.['phone'] ? String(metadata['phone']) : undefined,
            role: (metadata?.['role'] as UserRole | undefined) || UserRole.DATA_ENTRY,
            department: metadata?.['department'] ? String(metadata['department']) : undefined,
            isActive: true,
            createdAt: new Date(supabaseUser.created_at || now),
            updatedAt: new Date(supabaseUser.updated_at || now),
        };
    }

    private syncSessionState(user: User, accessToken: string, refreshToken: string): void {
        const profile = this.mapSupabaseUserToProfile(user);

        this.updateAuthState({
            isAuthenticated: true,
            user: profile,
            accessToken,
            refreshToken,
            loading: false,
            error: null,
        });

        this.saveCachedAuth({
            user: profile,
            accessToken,
            refreshToken,
        });
    }

    private readCachedAuth(): AuthCacheEntry | null {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const rawValue = window.localStorage.getItem(AUTH_CACHE_KEY);
            if (!rawValue) {
                return null;
            }

            const parsedValue = JSON.parse(rawValue) as Partial<AuthCacheEntry>;
            if (!parsedValue.user || !parsedValue.accessToken || !parsedValue.refreshToken) {
                return null;
            }

            return parsedValue as AuthCacheEntry;
        } catch {
            return null;
        }
    }

    private saveCachedAuth(entry: AuthCacheEntry): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(entry));
        } catch {
            // Ignore storage failures and keep the in-memory session intact.
        }
    }

    private clearCachedAuth(): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.removeItem(AUTH_CACHE_KEY);
        } catch {
            // Ignore storage failures.
        }
    }

    /**
     * Update auth state
     */
    private updateAuthState(updates: Partial<AuthState>): void {
        const currentState = this.authState();
        this.authState.set({
            ...currentState,
            ...updates,
        });
    }
}
