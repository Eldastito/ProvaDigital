import { supabase } from '../services/supabaseClient';
import { Item, DifficultyLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface MarketplaceFilter {
    searchQuery: string;
    discipline: string;
    difficulty: DifficultyLevel | 'ALL';
    page: number;
    pageSize: number;
}

export interface MarketplaceItem extends Item {
    authorName: string;
    downloadsCount: number;
    ratingAvg: number;
    price: number;
}

export const marketplaceService = {
    /**
     * Busca itens públicos no marketplace
     */
    async searchItems(filter: MarketplaceFilter) {
        let query = supabase
            .from('items')
            .select('*')
            .eq('is_public', true)
            .order('downloads_count', { ascending: false }) // Mais populares primeiro
            .range(filter.page * filter.pageSize, (filter.page + 1) * filter.pageSize - 1);

        if (filter.searchQuery) {
            query = query.or(`statement.ilike.%${filter.searchQuery}%,author_name.ilike.%${filter.searchQuery}%`);
        }

        if (filter.discipline !== 'ALL') {
            query = query.eq('subject', filter.discipline);
        }

        if (filter.difficulty !== 'ALL') {
            query = query.eq('difficulty', filter.difficulty);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            items: (data || []) as MarketplaceItem[],
            count: count || 0
        };
    },

    /**
     * Publica um item no marketplace
     */
    async publishItem(itemId: string, authorName: string) {
        const { error } = await supabase
            .from('items')
            .update({
                is_public: true,
                author_name: authorName,
                is_public_at: new Date().toISOString()
            })
            .eq('id', itemId);

        if (error) throw error;
        return true;
    },

    /**
     * Despublica um item
     */
    async unpublishItem(itemId: string) {
        const { error } = await supabase
            .from('items')
            .update({ is_public: false })
            .eq('id', itemId);

        if (error) throw error;
        return true;
    },

    /**
     * Importa (Clona) um item para o banco do usuário
     */
    async importItem(originalItem: MarketplaceItem, targetTenantId: string, targetOwnerId: string) {
        // 1. Clonar Objeto
        const newItem = {
            ...originalItem,
            id: uuidv4(), // Novo ID
            tenantId: targetTenantId, // Novo Tenant
            ownerId: targetOwnerId, // Novo Dono
            is_public: false, // Clone nasce privado
            origin: 'MARKETPLACE_IMPORT',
            original_item_id: originalItem.id, // Rastreabilidade
            downloads_count: 0,
            rating_avg: 0,
            created_at: new Date().toISOString()
        };

        // Remover campos que não devem ser copiados diretamente se existirem no objeto original e não no banco
        // Mas como estamos usando o objeto Item completo, o supabase vai ignorar campos extras se não existirem na coluna
        // Ajuste fino: remover 'id' do objeto antes de inserir se fosse auto-increment, mas é UUID manual

        const { data, error } = await supabase
            .from('items')
            .insert([newItem])
            .select()
            .single();

        if (error) throw error;

        // 2. Registrar Download/Interação
        await supabase.from('marketplace_interactions').insert({
            item_id: originalItem.id,
            user_id: targetOwnerId,
            type: 'DOWNLOAD'
        });

        // 3. Incrementar contador no original (RPC ou Update direto)
        try {
            await supabase.rpc('increment_downloads', { item_id: originalItem.id });
        } catch (err) {
            // Fallback se RPC não existir ou falhar
            const newCount = (originalItem.downloadsCount || 0) + 1;
            await supabase.from('items').update({ downloads_count: newCount }).eq('id', originalItem.id);
        }

        return data;
    }
};
