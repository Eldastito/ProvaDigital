import React, { useState, useMemo } from 'react';
import { ArrowLeft, Coins, Lock, Shirt, Crown, User, HelpCircle, Check, Glasses, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { GamificationService } from '../../services/gamificationService';
import { ShopItem, ShopItemCategory } from '../../types';

export const AvatarShopView = () => {
    const navigate = useNavigate();
    const { currentUser, userProfiles, updateUserProfile } = useAppStore();

    // 1. Get User Profile
    const userProfile = userProfiles.find(p => p.userId === currentUser?.id) || {
        userId: currentUser?.id || '',
        owlCoins: 0,
        xp: 0,
        badges: [],
        inventory: [],
        equippedItems: {},
        academicAchievements: [],
        assessments: [],
        bio: '',
        avatarUrl: ''
    } as any;

    const [selectedCategory, setSelectedCategory] = useState<'BODY' | 'HAT' | 'OUTFIT' | 'ACCESSORY'>('BODY');
    const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 2. Load Items
    const shopItems = useMemo(() => GamificationService.getShopItems(), []);

    // Group items logic
    const filteredItems = useMemo(() => {
        // Map UI category to ShopItemCategory if distinct
        return shopItems.filter(i => {
            if (selectedCategory === 'BODY') return i.category === 'BODY';
            if (selectedCategory === 'HAT') return i.category === 'HAT';
            if (selectedCategory === 'OUTFIT') return i.category === 'OUTFIT';
            // ACCESSORY catches glasses, badges, and generic accessories
            return i.category === 'ACCESSORY';
        });
    }, [shopItems, selectedCategory]);

    // 3. Helper: Get Equipped Image
    const getEquippedImage = (cat: ShopItemCategory) => {
        const itemId = userProfile.equippedItems?.[cat.toLowerCase() as keyof typeof userProfile.equippedItems];
        if (!itemId) return null;
        return shopItems.find(i => i.id === itemId)?.imageUrl;
    };

    // Default Body
    const currentBody = getEquippedImage('BODY') || '🧍';

    // 4. Level Calculation
    const { level } = GamificationService.calculateLevel(userProfile.xp || 0);

    // 5. Actions
    const showMessage = (type: 'success' | 'error', text: string) => {
        setPurchaseMessage({ type, text });
        setTimeout(() => setPurchaseMessage(null), 3000);
    };

    const handleBuy = (item: ShopItem) => {
        const check = GamificationService.canBuyItem(userProfile, item.id);
        if (!check.success) return showMessage('error', check.message || 'Erro.');

        if (confirm(`Comprar ${item.name} por ${item.price}?`)) {
            const newInventory = [...(userProfile.inventory || []), item.id];
            const newBalance = userProfile.owlCoins - item.price;

            // Auto-equip if body
            let newEquipped = { ...userProfile.equippedItems };
            if (item.category === 'BODY') newEquipped.body = item.id;

            // Auto-equip logic for others too?
            // if (item.category === 'HAT') newEquipped.hat = item.id;

            updateUserProfile({
                ...userProfile,
                owlCoins: newBalance,
                inventory: newInventory,
                equippedItems: newEquipped
            });
            showMessage('success', 'Compra realizada!');
        }
    };

    const handleEquip = (item: ShopItem) => {
        const newEquipped = { ...userProfile.equippedItems };
        const key = item.category.toLowerCase() as keyof typeof newEquipped;
        // @ts-ignore
        newEquipped[key] = item.id;
        updateUserProfile({ ...userProfile, equippedItems: newEquipped });
        showMessage('success', 'Equipado!');
    };

    const categories = [
        { id: 'BODY', label: 'Avatares', icon: <User size={18} /> },
        { id: 'HAT', label: 'Chapéus', icon: <Crown size={18} /> },
        { id: 'OUTFIT', label: 'Roupas', icon: <Shirt size={18} /> },
        { id: 'ACCESSORY', label: 'Acessórios', icon: <Glasses size={18} /> },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>
                <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full font-bold shadow-sm border border-amber-100">
                    <Coins size={18} fill="currentColor" />
                    <span>{userProfile.owlCoins}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full p-8 flex flex-col gap-10">

                {/* HERO AREA: AVATAR CARD & TABS */}
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">

                    {/* LEFT: INFO "Regra do Jogo" Tooltip MOCK */}
                    <div className="hidden md:flex bg-white p-4 rounded-xl shadow-sm border border-slate-100 max-w-xs relative items-start gap-3">
                        <div className="text-brand-primary mt-1">
                            <HelpCircle size={24} className="text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-700 text-sm">Regra do Jogo</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                Pode gastar à vontade! Usar suar moedas não diminui sua posição no Ranking nem seu Nível.
                            </p>
                        </div>
                        {/* Arrow pointing right */}
                        <div className="absolute top-6 -right-2 w-4 h-4 bg-white border-t border-r border-slate-100 rotate-45"></div>
                    </div>

                    {/* CENTER: AVATAR CARD */}
                    <div className="bg-slate-900 rounded-[2.5rem] w-64 h-80 relative flex flex-col items-center justify-center shadow-2xl shrink-0 overflow-hidden group">
                        <div className="absolute top-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            Seu Visual
                        </div>

                        {/* AVATAR COMPOSITE */}
                        <div className="relative transform scale-[1.8] group-hover:scale-[1.9] transition-transform duration-500 cursor-pointer">
                            {/* BODY */}
                            <div className="text-[100px] leading-none drop-shadow-xl filter contrast-125">
                                {currentBody}
                            </div>

                            {/* LAYERS */}
                            {getEquippedImage('HAT') && (
                                <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 text-[50px] drop-shadow-lg z-20">
                                    {getEquippedImage('HAT')}
                                </div>
                            )}
                            {getEquippedImage('ACCESSORY') && (
                                <div className="absolute top-[35px] left-1/2 -translate-x-1/2 text-[40px] z-30 opacity-90">
                                    {getEquippedImage('ACCESSORY')}
                                </div>
                            )}
                            {/* Outfit emoji is currently missing from logic but slot exists */}
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-transparent to-transparent opacity-50 pointers-events-none"></div>
                    </div>

                    {/* RIGHT: TABS */}
                    <div className="flex-1 flex justify-center md:justify-start w-full">
                        <div className="bg-slate-100 p-1.5 rounded-xl inline-flex gap-1 overflow-x-auto">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    // @ts-ignore
                                    className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${selectedCategory === cat.id
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {cat.icon}
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* GRID ITEMS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredItems.map(item => {
                        const isOwned = userProfile.inventory?.includes(item.id);
                        const canBuy = userProfile.owlCoins >= item.price;
                        const isLocked = item.minLevel && level < item.minLevel;

                        return (
                            <div key={item.id} className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 hover:shadow-xl transition-shadow border border-slate-100 group relative overflow-hidden">

                                {/* Level Badge */}
                                <div className="absolute top-4 left-4 bg-red-50 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 flex items-center gap-1">
                                    <Lock size={8} /> Niv. {item.minLevel || 1}
                                </div>

                                {/* Image */}
                                <div className="h-32 flex items-center justify-center text-[80px] group-hover:scale-110 transition-transform duration-300">
                                    {item.imageUrl}
                                </div>

                                {/* Text */}
                                <div className="text-center">
                                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </div>

                                {/* Button */}
                                <div className="mt-auto w-full pt-2">
                                    {isOwned ? (
                                        <button
                                            onClick={() => handleEquip(item)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} /> Equipar
                                        </button>
                                    ) : (
                                        <button
                                            disabled={!canBuy || isLocked}
                                            onClick={() => handleBuy(item)}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${isLocked
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : canBuy
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isLocked ? 'Bloqueado' : item.price === 0 ? 'Grátis' : (
                                                <>
                                                    <Coins size={16} /> {item.price}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

            </div>

            {/* TOAST */}
            {purchaseMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl animate-in fade-in zoom-in duration-300 z-50">
                    {purchaseMessage.text}
                </div>
            )}
        </div>
    );
};
