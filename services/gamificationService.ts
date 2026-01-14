import { ShopItem, UserProfileExtended } from '../types';

// CONFIGURAÇÃO DE NÍVEIS
const BASE_XP = 100;
const XP_FACTOR = 1.5; // Factor exponencial de dificuldade

// LISTA DE ITENS DA LOJA (MOCK)
// LISTA DE ITENS DA LOJA (MOCK V2 - INCLUSIVE & FULL BODY)
export const SHOP_ITEMS: ShopItem[] = [
    // === BASES (FULL BODY / GENDER / ETHNICITY / SPECIAL NEEDS) ===
    // Boys
    { id: 'body_boy_light', name: 'Menino (Claro)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏻‍♂️', minLevel: 1 },
    { id: 'body_boy_medium', name: 'Menino (Moreno)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏽‍♂️', minLevel: 1 },
    { id: 'body_boy_dark', name: 'Menino (Negro)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏿‍♂️', minLevel: 1 },
    // Girls
    { id: 'body_girl_light', name: 'Menina (Clara)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏻‍♀️', minLevel: 1 },
    { id: 'body_girl_medium', name: 'Menina (Morena)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏽‍♀️', minLevel: 1 },
    { id: 'body_girl_dark', name: 'Menina (Negra)', description: 'Avatar corpo inteiro.', price: 0, category: 'BODY', imageUrl: '🧍🏿‍♀️', minLevel: 1 },

    // === INCLUSIVITY BASES (Wheelchairs/Mobility) ===
    { id: 'body_boy_wheelchair', name: 'Menino (Cadeira Manual)', description: 'Mobilidade e estilo.', price: 0, category: 'BODY', imageUrl: '🧑🏻‍🦽', minLevel: 1 },
    { id: 'body_girl_wheelchair', name: 'Menina (Cadeira Manual)', description: 'Mobilidade e estilo.', price: 0, category: 'BODY', imageUrl: '👩🏽‍🦽', minLevel: 1 },
    { id: 'body_boy_motor', name: 'Menino (Cadeira Motor)', description: 'Alta tecnologia.', price: 0, category: 'BODY', imageUrl: '🧑🏿‍🦼', minLevel: 1 },
    { id: 'body_girl_motor', name: 'Menina (Cadeira Motor)', description: 'Alta tecnologia.', price: 0, category: 'BODY', imageUrl: '👩🏻‍🦼', minLevel: 1 },

    // === SENSORY & ACCESSORIES ===
    { id: 'acc_glasses', name: 'Óculos de Grau', description: 'Visão perfeita.', price: 0, category: 'ACCESSORY', imageUrl: '👓', minLevel: 1 },
    { id: 'acc_hearing_aid', name: 'Aparelho Auditivo', description: 'Super audição.', price: 0, category: 'ACCESSORY', imageUrl: '🦻', minLevel: 1 },
    { id: 'acc_blind_cane', name: 'Bengala Tátil', description: 'Percepção total.', price: 0, category: 'ACCESSORY', imageUrl: '🦯', minLevel: 1 },
    { id: 'acc_guide_dog', name: 'Cão Guia', description: 'O melhor amigo.', price: 0, category: 'ACCESSORY', imageUrl: '🐕‍🦺', minLevel: 1 },

    // === HATS & PROPS ===
    { id: 'hat_grad', name: 'Capelo', description: 'Formatura.', price: 100, category: 'HAT', imageUrl: '🎓', minLevel: 1 },
    { id: 'hat_crown', name: 'Coroa', description: 'Realeza do saber.', price: 500, category: 'HAT', imageUrl: '👑', minLevel: 5 },
    { id: 'hat_headphones', name: 'Headphones', description: 'Foco total.', price: 150, category: 'HAT', imageUrl: '🎧', minLevel: 2 },

    // === BADGES (New Category Concept) ===
    { id: 'badge_math', name: 'Mestre da Matemática', description: 'Conquistou as equações.', price: 1000, category: 'ACCESSORY', imageUrl: '➗', minLevel: 10 },
    { id: 'badge_science', name: 'Gênio da Ciência', description: 'Descobriu novos mundos.', price: 1000, category: 'ACCESSORY', imageUrl: '🧬', minLevel: 10 }
];

// LISTA DE JOGOS EXTERNOS (ARCADE)
export const ARCADE_GAMES = [
    {
        id: 'game_math_blaster',
        title: 'Math Blaster',
        description: 'Destrua asteróides resolvendo equações!',
        thumbnailUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&q=80',
        gameUrl: 'https://exemplo.com/jogos/math-blaster',
        category: 'MATH',
        minLevel: 1
    },
    {
        id: 'game_memory_kings',
        title: 'Reis da Memória',
        description: 'Encontre os pares históricos.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&q=80',
        gameUrl: 'https://exemplo.com/jogos/memoria',
        category: 'MEMORY',
        minLevel: 1
    },
    {
        id: 'game_logic_tower',
        title: 'Torre Lógica',
        description: 'Construa a torre mais alta usando lógica.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
        gameUrl: 'https://exemplo.com/jogos/torre',
        category: 'LOGIC',
        minLevel: 2
    }
];

export const GamificationService = {
    // Calcula nível baseado no XP total
    calculateLevel: (xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } => {
        let level = 1;
        let xpForNext = BASE_XP;
        let remainingXp = xp;

        while (remainingXp >= xpForNext) {
            remainingXp -= xpForNext;
            level++;
            xpForNext = Math.floor(xpForNext * XP_FACTOR);
        }

        return {
            level,
            currentLevelXp: remainingXp,
            nextLevelXp: xpForNext,
            progress: (remainingXp / xpForNext) * 100
        };
    },

    getShopItems: (): ShopItem[] => {
        return SHOP_ITEMS;
    },

    getArcadeGames: () => {
        return ARCADE_GAMES;
    },

    canBuyItem: (userProfile: UserProfileExtended, itemId: string): { success: boolean; message?: string } => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item não encontrado.' };

        // Verifica se já tem
        if (userProfile.inventory?.includes(itemId)) {
            return { success: false, message: 'Você já possui este item.' };
        }

        // Verifica Nível
        const { level } = GamificationService.calculateLevel(userProfile.xp || 0);
        if (item.minLevel && level < item.minLevel) {
            return { success: false, message: `Nível ${item.minLevel} necessário.` };
        }

        // Verifica Saldo
        if (userProfile.owlCoins < item.price) {
            return { success: false, message: 'Saldo insuficiente.' };
        }

        return { success: true };
    }
};
