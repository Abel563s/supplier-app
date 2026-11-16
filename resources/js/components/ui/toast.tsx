'use client';

import * as React from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastItem {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
}

interface ToastState {
    toasts: ToastItem[];
}

const TOAST_REMOVE_DELAY = 4000;

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

const listeners: Array<(state: ToastState) => void> = [];
let state: ToastState = { toasts: [] };

function dispatch(action: { type: 'ADD'; toast: ToastItem } | { type: 'REMOVE'; id: string } | { type: 'DISMISS'; id: string }) {
    if (action.type === 'ADD') {
        state = { toasts: [action.toast, ...state.toasts].slice(0, 3) };
    } else if (action.type === 'REMOVE') {
        state = { toasts: state.toasts.filter((t) => t.id !== action.id) };
    } else if (action.type === 'DISMISS') {
        state = { toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, open: false } : t)) };
    }
    listeners.forEach((listener) => listener(state));
}

export function toast({ title, description, variant = 'default' }: { title: string; description?: string; variant?: ToastVariant }) {
    const id = genId();

    dispatch({ type: 'ADD', toast: { id, title, description, variant } });

    const timeoutId = setTimeout(() => {
        dispatch({ type: 'REMOVE', id });
    }, TOAST_REMOVE_DELAY);

    return {
        id,
        dismiss: () => {
            clearTimeout(timeoutId);
            dispatch({ type: 'REMOVE', id });
        },
    };
}

export function useToast() {
    const [localState, setLocalState] = React.useState<ToastState>(state);

    React.useEffect(() => {
        listeners.push(setLocalState);
        return () => {
            const idx = listeners.indexOf(setLocalState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    return {
        toasts: localState.toasts,
        toast,
        dismiss: (id: string) => dispatch({ type: 'DISMISS', id }),
    };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [localState, setLocalState] = React.useState<ToastState>(state);

    React.useEffect(() => {
        listeners.push(setLocalState);
        return () => {
            const idx = listeners.indexOf(setLocalState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    return (
        <>
            <div className="top-0 z-[100] flex max-h-[48dvh] w-full flex-col-reverse p-4 sm:p-6 md:p-8 lg:p-10 pointer-events-none">
                {localState.toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto flex flex-col gap-1">
                        <div className={`relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-3 shadow-lg transition-all ${
                            t.variant === 'success'
                                ? 'border-emerald-200 bg-emerald-50'
                                : t.variant === 'destructive'
                                    ? 'border-rose-200 bg-rose-50'
                                    : 'border-gray-200 bg-white'
                        }`}>
                            <div className="grid gap-1">
                                {(t.variant === 'success' || t.variant === 'destructive') && (
                                    <div className="flex items-center gap-2">
                                        <span className={`h-4 w-4 rounded-full shrink-0 ${t.variant === 'success' ? 'bg-emerald-500 text-emerald-900' : 'bg-rose-500 text-rose-900'}`} />
                                    </div>
                                )}
                                <div className="grid gap-1">
                                    {t.title && <h3 className="text-sm font-semibold">{t.title}</h3>}
                                    {t.description && <p className="text-sm text-gray-500">{t.description}</p>}
                                </div>
                            </div>
                            <button
                                className="flex shrink-0 items-center rounded-md p-1 text-gray-500 outline-none focus:ring-2 focus-ring-gray-200 transition-colors hover:bg-gray-100"
                                onClick={() => dispatch({ type: 'DISMISS', id: t.id })}
                                aria-label="Dismiss"
                            >
                                <span className="sr-only">Close toast</span>
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {children}
        </>
    );
}
