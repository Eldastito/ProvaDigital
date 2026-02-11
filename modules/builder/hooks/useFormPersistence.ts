import { useEffect } from 'react';

const STORAGE_PREFIX = 'item-editor-';

/**
 * Hook para persistir automaticamente um valor no localStorage
 */
export const useFormPersistence = (key: string, value: any, enabled = true) => {
    useEffect(() => {
        if (enabled && value !== undefined && value !== null) {
            try {
                localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
            } catch (error) {
                console.warn(`Failed to persist ${key}:`, error);
            }
        }
    }, [key, value, enabled]);
};

/**
 * Recupera um valor persistido do localStorage
 */
export const getPersistedValue = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
    } catch (error) {
        console.warn(`Failed to load ${key}:`, error);
        return defaultValue;
    }
};

/**
 * Limpa todos os valores persistidos do formulário
 */
export const clearPersistedForm = () => {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.warn('Failed to clear persisted form:', error);
    }
};

/**
 * Limpa um valor específico do localStorage
 */
export const clearPersistedValue = (key: string) => {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
        console.warn(`Failed to clear ${key}:`, error);
    }
};
