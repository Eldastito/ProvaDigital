import React, { useState, useMemo } from 'react';
import { ArrowLeft, Coins, ShoppingBag, Lock, Check, AlertCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { GamificationService } from '../../services/gamificationService';
import { ShopItem, ShopItemCategory } from '../../types';

export const AvatarShopView = () => {
    const navigate = useNavigate();
    const { currentUser, userProfiles, updateUserProfile } = useAppStore();

    // Find extended profile OR use default to prevent blocking
    const userProfile = userProfiles.find(p => p.userId === currentUser?.id) || {
        userId: currentUser?.id || '',
        owlCoins: 0,
        xp: 0,
        badges: [],
        inventory: [],
        equippedItems: {},
        academicAchievements: [],
        assessments: [], // Add missing required properties
        bio: '',
        avatarUrl: ''
    } as any; // Cast as any or match the type exact structure if strict

    // REMOVED BLOCKING LOADING CHECK
    // if (!userProfile) { ... }

    const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>('HAT');
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
    const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const shopItems = useMemo(() => GamificationService.getShopItems(), []);
    const filteredItems = shopItems.filter(i => i.category === selectedCategory);

    const categories: { id: ShopItemCategory, label: string, icon: string }[] = [
        { id: 'BODY', label: 'Avatares', icon: '👤' },
        { id: 'HAT', label: 'Chapéus', icon: '🎩' },
        { id: 'OUTFIT', label: 'Roupas', icon: '👕' },
        { id: 'ACCESSORY', label: 'Acessórios', icon: '👓' }
    ];

    const handleBuy = (item: ShopItem) => {
        if (!userProfile) return;

        const check = GamificationService.canBuyItem(userProfile, item.id);

        if (!check.success) {
            setPurchaseMessage({ type: 'error', text: check.message || 'Erro ao comprar.' });
            setTimeout(() => setPurchaseMessage(null), 3000);
            return;
        }

        if (confirm(`Comprar ${item.name} por ${item.price} moedas?`)) {
            // Execute Purchase
            const newInventory = [...(userProfile.inventory || []), item.id];
            const newBalance = userProfile.owlCoins - item.price;

            // Auto-equip if it's a Body
            let newEquipped = { ...userProfile.equippedItems };
            if (item.category === 'BODY') newEquipped.body = item.id;

            updateUserProfile({
                ...userProfile,
                owlCoins: newBalance,
                inventory: newInventory,
                equippedItems: newEquipped
            });

            setPurchaseMessage({ type: 'success', text: 'Compra realizada com sucesso!' });
            setTimeout(() => setPurchaseMessage(null), 3000);
        }
    };

    const handleEquip = (item: ShopItem) => {
        if (!userProfile) return;

        const newEquipped = { ...userProfile.equippedItems };
        if (item.category === 'BODY') newEquipped.body = item.id;
        else if (item.category === 'HAT') newEquipped.hat = item.id;
        else if (item.category === 'OUTFIT') newEquipped.outfit = item.id;
        else if (item.category === 'ACCESSORY') newEquipped.accessory = item.id;

        updateUserProfile({
            ...userProfile,
            equippedItems: newEquipped
        });

        setPurchaseMessage({ type: 'success', text: `${item.name} equipado!` });
        setTimeout(() => setPurchaseMessage(null), 2000);
    };

    const { level } = GamificationService.calculateLevel(userProfile.xp || 0);

    // Resolve Equipped Item Images for Preview
    const getEquippedImage = (cat: ShopItemCategory) => {
        const itemId = userProfile.equippedItems?.[cat.toLowerCase() as keyof typeof userProfile.equippedItems];
        if (!itemId) return null;
        return shopItems.find(i => i.id === itemId)?.imageUrl;
    };

    // Default Avatar
    const currentBody = getEquippedImage('BODY') || '🧑';

    return (
        <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300">
            {/* SHOP HEADER */}
            <div className="bg-white p-6 shadow-md z-10 sticky top-0">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold transition-colors"
                        >
                            <ArrowLeft size={20} /> Voltar
                        </button>

                        <div className="flex items-center gap-4 bg-amber-100 px-4 py-2 rounded-full border border-amber-200">
                            <Coins className="text-amber-600" size={24} />
                            <span className="font-black text-amber-800 text-lg">{userProfile.owlCoins}</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <ShoppingBag className="text-brand-primary" size={32} />
                                Avatar Shop
                            </h1>
                            <p className="text-slate-500 mt-1">Gaste suas moedas e personalize seu visual!</p>
                        </div>

                        {/* LIVE AVATAR PREVIEW CARD (VERTICAL STACK) */}
                        <div className="bg-slate-900 rounded-3xl p-6 flex flex-col items-center gap-1 shadow-2xl border-4 border-white transform translate-y-4 md:translate-y-0 relative z-20 w-48 group cursor-help">
                            {/* TOOLTIP: Explained Purpose */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-black/90 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-center pointer-events-none">
                                Seu personagem nos Rankings e Games!
                            </div>

                            <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                Seu Visual <AlertCircle size={10} />
                            </div>

                            {/* RULE CLARIFICATION: Coins vs Ranking */}
                            <div className="absolute top-2 right-full mr-4 w-60 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden md:block">
                                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-1">
                                    <Trophy size={12} className="text-yellow-500" /> Regra do Jogo
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Pode gastar à vontade! Usar suas moedas <strong>não diminui</strong> sua posição no Ranking nem seu Nível.
                                </p>
                                <div className="absolute top-6 -right-1.5 w-3 h-3 bg-white border-t border-r border-slate-100 transform rotate-45"></div>
                            </div>

                            <div className="relative flex flex-col items-center h-32 w-full">
                                {/* 1. HAT (Top) - High Z-Index to cover hair */}
                                <div className="absolute -top-6 z-40 text-[45px] drop-shadow-lg filter hover:scale-110 transition-transform origin-bottom">
                                    {getEquippedImage('HAT') || <span className="opacity-0">🎩</span>}
                                </div>

                                {/* 2. BODY/HEAD (Middle) */}
                                <div className="z-30 text-[60px] drop-shadow-xl relative bg-[#f0f0f0] rounded-full leading-none p-1 border-2 border-white/10">
                                    {currentBody}

                                    {/* 2.1 ACCESSORY (On Face) - Absolute to Head */}
                                    {getEquippedImage('ACCESSORY') && (
                                        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[35px] z-50 w-full text-center">
                                            {getEquippedImage('ACCESSORY')}
                                        </div>
                                    )}
                                </div>

                                {/* 3. OUTFIT (Torso) - Under Head, slightly shifted up */}
                                <div className="absolute top-12 z-20 text-[65px] drop-shadow-md -mt-2 grayscale-[0.1]">
                                    {getEquippedImage('OUTFIT') || <div className="w-10 h-10 opacity-20 bg-white/20 rounded-full mt-4" />}
                                </div>
                            </div>
                        </div>

                        {/* CATEGORY TABS */}
                        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="text-lg">{cat.icon}</span> {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ERROR/SUCCESS TOAST */}
            {purchaseMessage && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 ${purchaseMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {purchaseMessage.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {purchaseMessage.text}
                </div>
            )}

            {/* ITEMS GRID */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => {
                        const isOwned = userProfile.inventory?.includes(item.id);
                        const canBuy = userProfile.owlCoins >= item.price;
                        const levelOk = !item.minLevel || level >= item.minLevel;
                        const isLocked = !levelOk;

                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${isOwned
                                    ? 'border-emerald-200 shadow-sm'
                                    : isLocked
                                        ? 'border-slate-100 opacity-70 grayscale-[0.5]'
                                        : 'border-slate-100 hover:border-brand-primary hover:shadow-xl'
                                    }`}
                            >
                                {/* ITEM PREVIEW */}
                                <div className="h-48 bg-slate-50 flex items-center justify-center text-[80px] group-hover:scale-110 transition-transform duration-500">
                                    {item.imageUrl}
                                </div>

                                {/* BADGES */}
                                {isOwned && (
                                    <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                        <Check size={12} /> SEU
                                    </div>
                                )}
                                {item.minLevel && (
                                    <div className={`absolute top-3 left-3 font-bold text-xs px-2 py-1 rounded-md flex items-center gap-1 ${levelOk ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-600'
                                        }`}>
                                        {isLocked && <Lock size={12} />} Niv. {item.minLevel}
                                    </div>
                                )}

                                {/* CONTENT */}
                                <div className="p-5">
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h3>
                                    <p className="text-slate-400 text-xs mb-4 min-h-[32px]">{item.description}</p>

                                    {isOwned ? (
                                        <button
                                            onClick={() => handleEquip(item)}
                                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                                        >
                                            Equipar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={isLocked || !canBuy}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isLocked
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : canBuy
                                                    ? 'bg-slate-900 text-white hover:bg-brand-primary hover:shadow-lg hover:-translate-y-1'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isLocked ? 'Bloqueado' : item.price === 0 ? 'Grátis' : (
                                                <>
                                                    <Coins size={16} className={canBuy ? 'text-amber-400' : 'text-slate-400'} />
                                                    {item.price}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
