import { ShopItem, UserProfileExtended } from '../types';

// CONFIGURAÇÃO DE NÍVEIS
const BASE_XP = 100;
const XP_FACTOR = 1.5; // Factor exponencial de dificuldade

// LISTA DE ITENS DA LOJA (MOCK)
export const SHOP_ITEMS: ShopItem[] = [
    // BASES (AVATARS)
    { id: 'base_boy_1', name: 'Menino (Claro)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👦🏻', minLevel: 1 },
    { id: 'base_boy_2', name: 'Menino (Moreno)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👦🏽', minLevel: 1 },
    { id: 'base_boy_3', name: 'Menino (Negro)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👦🏿', minLevel: 1 },
    { id: 'base_girl_1', name: 'Menina (Clara)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👧🏻', minLevel: 1 },
    { id: 'base_girl_2', name: 'Menina (Morena)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👧🏽', minLevel: 1 },
    { id: 'base_girl_3', name: 'Menina (Negra)', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '👧🏿', minLevel: 1 },
    { id: 'base_neutral_1', name: 'Neutro', description: 'Avatar base.', price: 0, category: 'BODY', imageUrl: '🧑', minLevel: 1 },

    // HATS
    { id: 'hat_grad', name: 'Capelo de Formatura', description: 'Um clássico acadêmico.', price: 0, category: 'HAT', imageUrl: '🎓', minLevel: 1 },
    { id: 'hat_viking', name: 'Elmo Viking', description: 'Para guerreiros do conhecimento.', price: 150, category: 'HAT', imageUrl: '🪖', minLevel: 2 },
    { id: 'hat_crown', name: 'Coroa Real', description: 'Digno de um rei da matemática.', price: 500, category: 'HAT', imageUrl: '👑', minLevel: 5 },
    { id: 'hat_wizard', name: 'Chapéu de Mago', description: 'Magia pura nos estudos.', price: 300, category: 'HAT', imageUrl: '🎩', minLevel: 3 },
    { id: 'hat_cowboy', name: 'Chapéu de Cowboy', description: 'Rápido no gatilho das respostas.', price: 200, category: 'HAT', imageUrl: '🤠', minLevel: 2 },
    { id: 'hat_bow', name: 'Laço Colorido', description: 'Um toque de estilo.', price: 50, category: 'HAT', imageUrl: '🎀', minLevel: 1 },
    { id: 'hat_cap', name: 'Boné Descolado', description: 'Proteção contra o sol e erros.', price: 50, category: 'HAT', imageUrl: '🧢', minLevel: 1 },
    { id: 'hat_hijab', name: 'Hijab', description: 'Elegância e identidade.', price: 0, category: 'HAT', imageUrl: '🧕', minLevel: 1 },

    // OUTFITS
    { id: 'outfit_hero', name: 'Capa de Herói', description: 'Voe alto nas notas.', price: 250, category: 'OUTFIT', imageUrl: '🦸', minLevel: 3 },
    { id: 'outfit_lab', name: 'Jaleco de Cientista', description: 'Experimentos precisos.', price: 100, category: 'OUTFIT', imageUrl: '🥼', minLevel: 1 },
    { id: 'outfit_suit', name: 'Terno Executivo', description: 'Negócios sérios.', price: 400, category: 'OUTFIT', imageUrl: '🤵', minLevel: 4 },
    { id: 'outfit_ninja', name: 'Traje Ninja', description: 'Silencioso e eficaz.', price: 350, category: 'OUTFIT', imageUrl: '🥷', minLevel: 3 },
    { id: 'outfit_dress', name: 'Vestido de Gala', description: 'Para ocasiões especiais.', price: 200, category: 'OUTFIT', imageUrl: '👗', minLevel: 2 },
    { id: 'outfit_casual', name: 'Look Casual', description: 'Conforto para estudar.', price: 50, category: 'OUTFIT', imageUrl: '👕', minLevel: 1 },

    // ACCESSORIES & PCD (INCLUSIVITY)
    { id: 'acc_glasses', name: 'Óculos Intelectuais', description: 'Aumenta o QI (mentira).', price: 50, category: 'ACCESSORY', imageUrl: '👓', minLevel: 1 },
    { id: 'acc_medal', name: 'Medalha de Honra', description: 'Mérito escolar.', price: 200, category: 'ACCESSORY', imageUrl: '🏅', minLevel: 2 },
    { id: 'acc_book', name: 'Livro Antigo', description: 'Sabedoria ancestral.', price: 120, category: 'ACCESSORY', imageUrl: '📖', minLevel: 1 },
    { id: 'acc_sword', name: 'Espada Lendária', description: 'Corte as dúvidas.', price: 1000, category: 'ACCESSORY', imageUrl: '⚔️', minLevel: 10 },

    // PCD / ACCESSIBILITY ITEMS (Free & Unlocked)
    { id: 'acc_wheelchair', name: 'Cadeira de Rodas', description: 'Mobilidade com estilo.', price: 0, category: 'ACCESSORY', imageUrl: '🦽', minLevel: 1 },
    { id: 'acc_wheelchair_motor', name: 'Cadeira Motorizada', description: 'Potência máxima.', price: 0, category: 'ACCESSORY', imageUrl: '🦼', minLevel: 1 },
    { id: 'acc_guide_dog', name: 'Cão Guia', description: 'Melhor amigo e guia.', price: 0, category: 'ACCESSORY', imageUrl: '🐕‍🦺', minLevel: 1 },
    { id: 'acc_cane', name: 'Bengala Tátil', description: 'Percepção aguçada.', price: 0, category: 'ACCESSORY', imageUrl: '🦯', minLevel: 1 },
    { id: 'acc_hearing_aid', name: 'Aparelho Auditivo', description: 'Super audição ativada.', price: 0, category: 'ACCESSORY', imageUrl: '🦻', minLevel: 1 },
    { id: 'acc_bionic_arm', name: 'Braço Biônico', description: 'Tecnologia avançada.', price: 0, category: 'ACCESSORY', imageUrl: '🦾', minLevel: 1 },
    { id: 'acc_bionic_leg', name: 'Perna Biônica', description: 'Passos do futuro.', price: 0, category: 'ACCESSORY', imageUrl: '🦿', minLevel: 1 },
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
