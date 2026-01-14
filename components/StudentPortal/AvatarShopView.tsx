import React, { useState, useMemo } from 'react';
import { ArrowLeft, Coins, Lock, Check, Plus, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BODY' | 'ACCESSORY' | 'BADGES'>('BODY');
    const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 2. Load Items
    const shopItems = useMemo(() => GamificationService.getShopItems(), []);

    // Group items logic
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'ALL') return shopItems;
        if (selectedCategory === 'BODY') return shopItems.filter(i => i.category === 'BODY');
        if (selectedCategory === 'ACCESSORY') return shopItems.filter(i => ['ACCESSORY', 'HAT', 'OUTFIT'].includes(i.category));
        return shopItems.filter(i => i.category === 'ACCESSORY' && i.id.startsWith('badge'));
    }, [shopItems, selectedCategory]);

    // 3. Helper: Get Equipped Image
    const getEquippedImage = (cat: ShopItemCategory) => {
        const itemId = userProfile.equippedItems?.[cat.toLowerCase() as keyof typeof userProfile.equippedItems];
        if (!itemId) return null;
        return shopItems.find(i => i.id === itemId)?.imageUrl;
    };

    // Default Body logic - if nothing equipped, show generic
    const currentBody = getEquippedImage('BODY') || '🧍';

    // 4. Level Calculation
    const { level, progress } = GamificationService.calculateLevel(userProfile.xp || 0);

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
        { id: 'BODY', label: 'Avatar', icon: '👤' },
        { id: 'ACCESSORY', label: 'Acessórios', icon: '👓' },
        { id: 'BADGES', label: 'Badges', icon: '🎖️' }, // Placeholder category logic
    ] as const;

    return (
        <div className="h-full bg-indigo-50/50 flex flex-col items-center justify-center font-sans">
            {/* PHONE CONTAINER */}
            <div className="w-full h-full max-w-[430px] bg-white shadow-2xl relative flex flex-col overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-slate-900">

                {/* STATUS BAR MOCK (Optional aesthetic) */}
                <div className="h-6 w-full bg-white flex justify-between items-center px-6 text-[10px] font-bold text-slate-800">
                    <span>9:41</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-2.5 bg-slate-800 rounded-[1px]"></div>
                        <div className="w-0.5 h-1.5 bg-slate-800 rounded-[1px]"></div>
                    </div>
                </div>

                {/* HEADER */}
                <div className="pt-2 pb-6 px-6 flex justify-between items-center bg-gradient-to-b from-purple-50 to-white/0 relative z-10">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-600 hover:scale-105 transition">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-black text-slate-800">Loja de Avatares</h1>
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur border border-purple-100 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-slate-600">
                        <Coins size={14} className="text-amber-500" fill="currentColor" />
                        {userProfile.owlCoins}
                    </div>
                </div>

                {/* HERO AREA (AVATAR) */}
                <div className="relative h-[420px] -mt-10 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-200/40 via-purple-50/20 to-transparent">

                    {/* AVATAR COMPOSITE */}
                    <div className="relative z-10 p-10 transform scale-125 hover:scale-130 transition-transform duration-500 cursor-pointer">
                        {/* The 'Body' is the base */}
                        <div className="text-[140px] leading-none drop-shadow-2xl filter contrast-125">
                            {currentBody}
                        </div>

                        {/* Accessories Overlay (Absolute positioning on top of body) */}
                        {getEquippedImage('HAT') && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 text-[80px] drop-shadow-lg z-20">
                                {getEquippedImage('HAT')}
                            </div>
                        )}
                        {getEquippedImage('ACCESSORY') && (
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[50px] z-30 opacity-90">
                                {getEquippedImage('ACCESSORY')}
                            </div>
                        )}
                        {/* Outfit overlay might be tricky with emojis, assuming Body IS the outfit for now or compositing */}
                    </div>

                    {/* Navigation Arrows */}
                    <button className="absolute left-6 top-1/2 w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:bg-white transition">
                        <ChevronLeft size={20} />
                    </button>
                    <button className="absolute right-6 top-1/2 w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:bg-white transition">
                        <ChevronRight size={20} />
                    </button>

                    {/* Progress Bar (Desbloqueado) */}
                    <div className="absolute bottom-4 w-full px-8">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-bold text-slate-400">Nível {level}</span>
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                {Math.round(progress)}% Completo
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full w-3/4"></div> {/* Mock width for visual, use real progress */}
                        </div>
                    </div>
                </div>

                {/* BOTTOM SHEET (Shop Items) */}
                <div className="flex-1 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col relative z-20 overflow-hidden">

                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>

                    {/* Categories */}
                    <div className="px-6 mb-4 overflow-x-auto no-scrollbar pb-2">
                        <div className="flex gap-4">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex flex-col items-center gap-1 min-w-[4.5rem] p-2 rounded-2xl transition-all ${selectedCategory === cat.id
                                            ? 'bg-purple-50 ring-2 ring-purple-100 transform scale-105'
                                            : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                                        {cat.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
                        <div className="grid grid-cols-3 gap-4">
                            {filteredItems.map(item => {
                                const isOwned = userProfile.inventory?.includes(item.id);
                                const canBuy = userProfile.owlCoins >= item.price;
                                const isLocked = item.minLevel && level < item.minLevel;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => isOwned ? handleEquip(item) : !isLocked && canBuy ? handleBuy(item) : null}
                                        className={`aspect-square bg-slate-50 rounded-2xl p-2 relative flex flex-col items-center justify-between border cursor-pointer hover:scale-105 transition-all
                                            ${isOwned ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100'}
                                        `}
                                    >
                                        {/* Lock Icon */}
                                        {isLocked && (
                                            <div className="absolute top-2 right-2 text-slate-300">
                                                <Lock size={10} />
                                            </div>
                                        )}

                                        <div className="flex-1 flex items-center justify-center text-[32px]">
                                            {item.imageUrl}
                                        </div>

                                        <div className="w-full text-center">
                                            {isOwned ? (
                                                <div className="w-full bg-purple-100 text-purple-700 text-[9px] font-bold py-1 rounded-lg">
                                                    USAR
                                                </div>
                                            ) : (
                                                <div className={`w-full text-[9px] font-bold py-1 rounded-lg flex items-center justify-center gap-1 ${canBuy ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'
                                                    }`}>
                                                    <Coins size={8} fill="currentColor" /> {item.price}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* FAB (Floating Action Button) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 shadow-2xl shadow-emerald-500/40 rounded-full">
                        <button className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-400 transition transform hover:scale-110 active:scale-95">
                            <Plus size={32} />
                        </button>
                    </div>

                    {/* Bottom Nav Mock */}
                    <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-white via-white to-transparent pointer-events-none"></div>
                </div>

                {/* TOAST */}
                {purchaseMessage && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white text-xs font-bold px-6 py-3 rounded-full shadow-xl animate-in fade-in zoom-in duration-300 z-50">
                        {purchaseMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
};
