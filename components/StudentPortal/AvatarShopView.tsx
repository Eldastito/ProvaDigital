import React, { useState, useMemo } from 'react';
import { ArrowLeft, Coins, ShoppingBag, Lock, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GamificationService } from '../../services/gamificationService';
import { ShopItem, ShopItemCategory } from '../../types';

interface AvatarShopViewProps {
    onBack: () => void;
}

export const AvatarShopView = ({ onBack }: AvatarShopViewProps) => {
    const { currentUser, userProfiles, updateUserProfile } = useAppStore();

    // Find extended profile
    const userProfile = userProfiles.find(p => p.userId === currentUser?.id);

    const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>('HAT');
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
    const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const shopItems = useMemo(() => GamificationService.getShopItems(), []);
    const filteredItems = shopItems.filter(i => i.category === selectedCategory);

    const categories: { id: ShopItemCategory, label: string, icon: string }[] = [
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

            updateUserProfile({
                ...userProfile,
                owlCoins: newBalance,
                inventory: newInventory
            });

            setPurchaseMessage({ type: 'success', text: 'Compra realizada com sucesso!' });
            setTimeout(() => setPurchaseMessage(null), 3000);
        }
    };

    const handleEquip = (item: ShopItem) => {
        if (!userProfile) return;

        // Logic to equip would go here (update equippedItems in profile)
        // For now just a visual feedback
        alert(`Você equipou: ${item.name}`);
    };

    if (!userProfile) return <div className="p-8 text-center text-slate-500">Perfil não encontrado.</div>;

    const { level } = GamificationService.calculateLevel(userProfile.xp || 0);

    return (
        <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300">
            {/* SHOP HEADER */}
            <div className="bg-white p-6 shadow-md z-10 sticky top-0">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={onBack}
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
