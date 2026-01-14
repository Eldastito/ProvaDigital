import React, { useState, useMemo } from 'react';
import { ArrowLeft, Coins, Lock, Check, Plus, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
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

    const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>('BODY');
    const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 2. Load Items
    const shopItems = useMemo(() => GamificationService.getShopItems(), []);
    const filteredItems = shopItems.filter(i => i.category === selectedCategory);

    // 3. Helper: Get Equipped Image
    const getEquippedImage = (cat: ShopItemCategory) => {
        const itemId = userProfile.equippedItems?.[cat.toLowerCase() as keyof typeof userProfile.equippedItems];
        if (!itemId) return null;
        return shopItems.find(i => i.id === itemId)?.imageUrl;
    };
    const currentBody = getEquippedImage('BODY') || '🧑';

    // 4. Level Calculation (for Unlocked Progress)
    const { level, progress, nextLevelXp } = GamificationService.calculateLevel(userProfile.xp || 0);

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

            // Auto-equip
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
        // @ts-ignore - Dynamic key assignment
        newEquipped[key] = item.id;

        updateUserProfile({ ...userProfile, equippedItems: newEquipped });
        showMessage('success', 'Equipado!');
    };

    const categories: { id: ShopItemCategory, label: string }[] = [
        { id: 'BODY', label: 'Avatar' },
        { id: 'HAT', label: 'Acessórios' }, // Merged conceptually in UI
        { id: 'ACCESSORY', label: 'Óculos' },
        { id: 'OUTFIT', label: 'Roupas' },
    ];

    return (
        <div className="h-full bg-slate-50 overflow-hidden flex flex-col items-center relative animate-in fade-in duration-500">
            {/* MAXIMUM WIDTH CONTAINER (Mobile Look) */}
            <div className="w-full max-w-md h-full flex flex-col bg-white shadow-2xl relative">

                {/* === HEADER === */}
                <div className="pt-6 pb-2 px-6 flex justify-between items-center bg-gradient-to-b from-purple-50 to-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <h1 className="text-xl font-bold text-slate-800">Loja de Avatares</h1>

                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm">
                        <Coins size={16} fill="currentColor" />
                        <span>{userProfile.owlCoins}</span>
                    </div>
                </div>

                {/* === HERO: AVATAR PREVIEW === */}
                <div className="relative h-[280px] w-full bg-gradient-to-b from-white to-purple-50 flex flex-col items-center justify-center overflow-hidden shrink-0">
                    {/* Background Decorative Blobs */}
                    <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>

                    {/* AVATAR COMPOSITE */}
                    <div className="relative z-10 transform scale-150 transition-all duration-500 hover:scale-155 cursor-pointer">
                        <div className="relative flex flex-col items-center h-40 w-32">
                            {/* HAT */}
                            <div className="absolute -top-8 z-40 text-[50px] drop-shadow-lg animate-bounce-slow">
                                {getEquippedImage('HAT')}
                            </div>

                            {/* HEAD/BODY */}
                            <div className="z-30 text-[70px] drop-shadow-xl relative leading-none">
                                {currentBody}
                                {/* GLASSES/ACCESSORY */}
                                {getEquippedImage('ACCESSORY') && (
                                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40px] z-50 w-full text-center">
                                        {getEquippedImage('ACCESSORY')}
                                    </div>
                                )}
                            </div>

                            {/* OUTFIT */}
                            <div className="absolute top-14 z-20 text-[75px] drop-shadow-md">
                                {getEquippedImage('OUTFIT')}
                            </div>
                        </div>
                    </div>

                    {/* NAVIGATION ARROWS (Visual Only for now) */}
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ChevronLeft size={16} className="text-slate-400" />
                    </div>
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ChevronRight size={16} className="text-slate-400" />
                    </div>

                    {/* LEVEL / UNLOCKED PROGRESS */}
                    <div className="absolute bottom-4 w-full px-8">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                            <span>Nível {level}</span>
                            <span>Próximo: {level + 1}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-center text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                            Desbloqueado
                        </div>
                    </div>
                </div>

                {/* === CONTENT: SHOP ITEMS === */}
                <div className="flex-1 bg-white rounded-t-[30px] -mt-6 relative z-20 flex flex-col overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">

                    {/* CATEGORY TABS (Scrollable) */}
                    <div className="pt-6 pb-2 px-6">
                        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat.id
                                            ? 'bg-slate-900 text-white shadow-slate-500/20 transform scale-105'
                                            : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ITEMS GRID */}
                    <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => {
                                const isOwned = userProfile.inventory?.includes(item.id);
                                const canBuy = userProfile.owlCoins >= item.price;
                                const isLocked = item.minLevel && level < item.minLevel;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => isOwned ? handleEquip(item) : !isLocked && canBuy ? handleBuy(item) : null}
                                        className={`group relative flex flex-col items-center bg-white rounded-3xl p-4 border transition-all duration-300 cursor-pointer ${isOwned ? 'border-purple-200 shadow-purple-100 ring-1 ring-purple-100' :
                                                isLocked ? 'border-slate-100 opacity-60 grayscale' :
                                                    'border-slate-100 hover:border-green-200 hover:shadow-lg hover:-translate-y-1'
                                            }`}
                                    >
                                        {/* LOCK ICON */}
                                        {isLocked && (
                                            <div className="absolute top-2 right-2 text-slate-300">
                                                <Lock size={12} />
                                            </div>
                                        )}

                                        {/* ITEM IMAGE */}
                                        <div className="text-[40px] mb-2 transform group-hover:scale-110 transition-transform">
                                            {item.imageUrl}
                                        </div>

                                        {/* NAME & PRICE */}
                                        <div className="text-center w-full">
                                            <div className="font-bold text-slate-700 text-xs truncate mb-1">{item.name}</div>

                                            {isOwned ? (
                                                <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                                    <Check size={8} /> SEU
                                                </div>
                                            ) : (
                                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${canBuy ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                                                    }`}>
                                                    <Coins size={8} fill="currentColor" />
                                                    {item.price === 0 ? 'FREE' : item.price}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* === FLOATING "PLUS" BUTTON (Bottom Bar Mock) === */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <button className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all">
                        <Plus size={28} />
                    </button>
                    {/* Bottom Nav Mock (Optional, purely aesthetic based on ref) */}
                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-16 bg-white/90 backdrop-blur-md rounded-full -z-10 shadow-xl border border-white/50 flex justify-between px-6 items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                    </div>
                </div>

                {/* TOAST MESSAGE */}
                {purchaseMessage && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-5 z-50 whitespace-nowrap">
                        {purchaseMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
};
