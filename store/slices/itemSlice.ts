import { StateCreator } from 'zustand';
import { Item, ItemGenerationBatch, ItemOrigin, QuestionType, DifficultyLevel } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface ItemSlice {
    items: Item[];
    itemGenerationBatches: ItemGenerationBatch[];
    activeBatchId: string | null;

    addItem: (item: Item) => void;
    addItems: (items: Item[]) => Promise<void>;
    updateItem: (item: Item) => Promise<void>;
    updateItemWithVersion: (itemId: string, updates: Partial<Item>, changeReason: string) => Promise<void>;
    removeItems: (ids: string[]) => Promise<void>;
    bulkAddTag: (ids: string[], tag: string) => Promise<void>;
    addGenerationBatch: (batch: ItemGenerationBatch) => Promise<void>;
    approveAllItemsInBatch: (batchId: string) => Promise<number>;
    approveOneItem: (itemId: string) => Promise<void>;
    discardOneItem: (itemId: string) => Promise<void>;
    setActiveBatchId: (id: string | null) => void;
    loadGenerationBatches: () => Promise<void>;
    forceFetchBatchItems: (batchId: string) => Promise<Item[] | void>;
    deleteGenerationBatch: (batchId: string) => Promise<void>;
}

export const createItemSlice: StateCreator<AppStore, [], [], ItemSlice> = (set, get) => ({
    items: [],
    itemGenerationBatches: [],
    activeBatchId: null,

    addItem: (item) => set((state) => ({ items: [...state.items, item] })),

    addItems: async (newItems) => {
        set((state) => ({ items: [...state.items, ...newItems] }));
        // Supabase persistence would go here
    },

    updateItem: async (item) => set((state) => ({
        items: state.items.map(i => i.id === item.id ? item : i)
    })),

    updateItemWithVersion: async (itemId, updates, changeReason) => {
        // Logic from useAppStore
        try {
            const { data: versionData, error } = await supabase.from('item_versions').insert({
                item_id: itemId,
                content: updates,
                change_reason: changeReason,
                created_at: new Date().toISOString()
            }).select().single();

            if (error) throw error;

            set((state) => ({
                items: state.items.map(i => i.id === itemId ? { ...i, ...updates, currentVersionId: versionData.id } : i)
            }));
        } catch (e) {
            console.error("Error versioning item:", e);
        }
    },

    removeItems: async (ids) => {
        const previousItems = get().items;
        set((state) => ({ items: state.items.filter(i => !ids.includes(i.id)) }));
        try {
            const { error } = await supabase.from('items').delete().in('id', ids);
            if (error) {
                set({ items: previousItems });
                throw error;
            }
        } catch (e) {
            console.error('Failed to remove items:', e);
        }
    },

    bulkAddTag: async (ids, tag) => {
        const previousItems = get().items;
        const updatedItems = previousItems.map(i => ids.includes(i.id)
            ? { ...i, tags: Array.from(new Set([...(i.tags || []), tag])) }
            : i);
        set({ items: updatedItems });
        // Individual Supabase updates...
    },

    addGenerationBatch: async (batch) => set((state) => ({
        itemGenerationBatches: [...state.itemGenerationBatches, batch]
    })),

    approveAllItemsInBatch: async (batchId) => {
        const batchItems = get().items.filter(i => i.generationBatchId === batchId);
        set((state) => ({
            items: state.items.map(i => i.generationBatchId === batchId ? { ...i, lifecycleStatus: 'APPROVED' as any } : i)
        }));
        return batchItems.length;
    },

    approveOneItem: async (itemId) => set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...i, lifecycleStatus: 'APPROVED' as any } : i)
    })),

    discardOneItem: async (itemId) => set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...i, lifecycleStatus: 'REJECTED' as any } : i)
    })),

    setActiveBatchId: (id) => set({ activeBatchId: id }),

    loadGenerationBatches: async () => {
        const { data } = await supabase.from('item_generation_batches').select('*');
        if (data) set({ itemGenerationBatches: data as any });
    },

    forceFetchBatchItems: async (batchId) => {
        const { data } = await supabase.from('items').select('*').eq('generation_batch_id', batchId);
        return data as Item[];
    },

    deleteGenerationBatch: async (batchId) => set((state) => ({
        itemGenerationBatches: state.itemGenerationBatches.filter(b => b.id !== batchId)
    })),
});
