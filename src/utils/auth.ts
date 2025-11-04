const AUTH_TOKEN_KEY = 'lincecrm_token';

const isBrowser = () => typeof window !== 'undefined';

export const authStore = {
    get: () => {
        if (!isBrowser()) return null;
        try {
            return localStorage.getItem(AUTH_TOKEN_KEY);
        } catch {
            return null;
        }
    },
    set: (token: string) => {
        if (!isBrowser()) return;
        try {
            localStorage.setItem(AUTH_TOKEN_KEY, token);
        } catch {
            // ignore storage errors (quota, disabled storage)
        }
    },
    clear: () => {
        if (!isBrowser()) return;
        try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
        } catch {
            // ignore
        }
    },
};

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = authStore.get();
    const headers = new Headers(init.headers ?? {});

    if (token && !headers.has('codrr_token')) {
        headers.set('codrr_token', token);
    }

    const response = await fetch(input, {
        ...init,
        headers,
        credentials: init.credentials ?? 'omit',
    });

    if (response.status === 401) {
        authStore.clear();
    }

    return response;
}
