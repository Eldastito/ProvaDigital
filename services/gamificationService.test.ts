import { describe, it, expect } from 'vitest';
import { GamificationService } from '../services/gamificationService';

describe('GamificationService', () => {
    describe('calculateLevel', () => {
        it('deve retornar nível 1 para 0 XP', () => {
            const result = GamificationService.calculateLevel(0);

            expect(result.level).toBe(1);
            expect(result.currentLevelXp).toBe(0);
            expect(result.nextLevelXp).toBe(100);
            expect(result.progress).toBe(0);
        });

        it('deve retornar nível 2 para 100 XP', () => {
            const result = GamificationService.calculateLevel(100);

            expect(result.level).toBe(2);
            expect(result.currentLevelXp).toBe(0);
            expect(result.nextLevelXp).toBe(150); // 100 * 1.5
        });

        it('deve retornar nível 5 para 5000 XP', () => {
            const result = GamificationService.calculateLevel(5000);

            expect(result.level).toBeGreaterThanOrEqual(5);
        });

        it('deve calcular progresso corretamente', () => {
            const result = GamificationService.calculateLevel(50); // 50 XP no nível 1

            expect(result.level).toBe(1);
            expect(result.currentLevelXp).toBe(50);
            expect(result.progress).toBe(50); // 50% do caminho para nível 2
        });
    });

    describe('canBuyItem', () => {
        it('deve permitir compra se usuário tem moedas suficientes', () => {
            const userProfile = {
                userId: '1',
                owlCoins: 200,
                xp: 500,
                badges: [],
                assessments: [],
                inventory: []
            };

            const result = GamificationService.canBuyItem(userProfile, 'hat_viking');

            expect(result.success).toBe(true);
        });

        it('deve bloquear compra se usuário não tem moedas suficientes', () => {
            const userProfile = {
                userId: '1',
                owlCoins: 50, // Precisa de 150 para hat_viking
                xp: 500,
                badges: [],
                assessments: [],
                inventory: []
            };

            const result = GamificationService.canBuyItem(userProfile, 'hat_viking');

            expect(result.success).toBe(false);
            expect(result.message).toContain('Saldo insuficiente');
        });

        it('deve bloquear compra se item já foi comprado', () => {
            const userProfile = {
                userId: '1',
                owlCoins: 500,
                xp: 500,
                badges: [],
                assessments: [],
                inventory: ['hat_viking'] // Já possui
            };

            const result = GamificationService.canBuyItem(userProfile, 'hat_viking');

            expect(result.success).toBe(false);
            expect(result.message).toContain('já possui');
        });

        it('deve bloquear compra se nível insuficiente', () => {
            const userProfile = {
                userId: '1',
                owlCoins: 1000,
                xp: 50, // Nível 1, mas hat_crown precisa nível 5
                badges: [],
                assessments: [],
                inventory: []
            };

            const result = GamificationService.canBuyItem(userProfile, 'hat_crown');

            expect(result.success).toBe(false);
            expect(result.message).toContain('Nível');
        });
    });

    describe('getShopItems', () => {
        it('deve retornar lista de itens da loja', () => {
            const items = GamificationService.getShopItems();

            expect(items).toBeDefined();
            expect(items.length).toBeGreaterThan(0);
            expect(items[0]).toHaveProperty('id');
            expect(items[0]).toHaveProperty('name');
            expect(items[0]).toHaveProperty('price');
            expect(items[0]).toHaveProperty('category');
        });

        it('deve incluir itens de acessibilidade gratuitos', () => {
            const items = GamificationService.getShopItems();

            const accessibilityItems = items.filter(item =>
                item.id.includes('wheelchair') ||
                item.id.includes('guide_dog') ||
                item.id.includes('hearing_aid')
            );

            expect(accessibilityItems.length).toBeGreaterThan(0);

            accessibilityItems.forEach(item => {
                expect(item.price).toBe(0);
            });
        });
    });
});
