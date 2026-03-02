import { StateCreator } from 'zustand';
import { Item, ItemGenerationBatch, ItemOrigin, QuestionType, DifficultyLevel } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_ITEMS } from '../../utils/mockData';

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
    loadItems: () => Promise<void>;
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

    loadItems: async () => {
        const { data, error } = await supabase.from('items').select('*');
        if (error) {
            console.error("Error loading items:", error);
            return;
        }

        const dbItems = (data || []).map(item => ({
            id: item.id,
            tenantId: item.tenant_id,
            schoolId: item.school_id,
            ownerId: item.owner_id,
            knowledgeArea: item.knowledge_area,
            subject: item.subject,
            type: item.type,
            statement: item.statement,
            imageUrl: item.image_url,
            alternatives: item.alternatives || [],
            correctAnswerJustification: item.correct_justification,
            difficulty: item.difficulty,
            score: item.score,
            origin: item.origin,
            tags: item.tags || [],
            bnccCode: item.bncc_code,
            usageCount: item.usage_count || 0,
            isAccessible: item.is_accessible,
            accessibilityInstructions: item.accessibility_instructions,
            multimedia: item.multimedia || [],
            simulationConfig: item.simulation_config,
            generationBatchId: item.generation_batch_id,
            lifecycleStatus: item.lifecycle_status,
            currentVersionId: item.current_version_id,
            aiModelId: item.ai_model_id,
            aiPromptVersion: item.ai_prompt_version,
            aiGenerationSettings: item.ai_generation_settings,
            reviewerId: item.reviewer_id,
            reviewedAt: item.reviewed_at,
            isPublic: item.is_public,
            downloadsCount: item.downloads_count || 0,
            ratingAvg: item.rating_avg || 0,
            authorName: item.author_name,
            createdAt: item.created_at,
            triParams: item.tri_params
        })) as Item[];

        // Always ensure the 3D Mock Models are injected into the list for demonstration purposes
        const mock3DItems = INITIAL_ITEMS.filter(i => i.id.startsWith('3d-mock-'));

        set({ items: [...dbItems, ...mock3DItems] });
    },

    forceFetchBatchItems: async (batchId) => {
        const { data } = await supabase.from('items').select('*').eq('generation_batch_id', batchId);
        return data as Item[];
    },

    deleteGenerationBatch: async (batchId) => set((state) => ({
        itemGenerationBatches: state.itemGenerationBatches.filter(b => b.id !== batchId)
    })),
});
