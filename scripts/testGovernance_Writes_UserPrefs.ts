
import { governanceService } from '../services/governanceService';
import { pilotStorageService } from '../services/pilotStorageService';
import { User, UserRole } from '../types';

async function runUserPrefsTest() {
    console.log('\n[F5.2] TESTE DE ESCRITA EM USERPREFERENCES - INÍCIO\n');

    const testUser: User = {
        id: 'user_poa_1',
        tenantId: 'poa_organization',
        role: UserRole.TENANT_ADMIN
    };

    const context = governanceService.resolveLegacyContext(testUser);

    // 1. Setup: Ativar Pilot e Flags
    governanceService.setAuthorityPilot(true);
    // @ts-ignore - Acesso a propriedade privada para teste
    governanceService.authorityPilotConfig.authority_pilot_writes_user_prefs_controlled_enabled = true;

    console.log('--- CENÁRIO 1: UPSERT NA WHITELIST (pilot_ui_hint_enabled) ---');
    const canUpsertWhite = governanceService.can('UserPreferences', 'UPSERT', context, false);
    if (canUpsertWhite) {
        await pilotStorageService.upsertUserPreference({
            tenant_id: context.activeOrganizationId,
            user_id: testUser.id,
            key: 'pilot_ui_hint_enabled',
            value: true
        });
        console.log('✅ Sucesso: UPSERT autorizado e persistido na whitelist.');
    }

    console.log('\n--- CENÁRIO 2: VIOLAÇÃO DE WHITELIST (theme) ---');
    const canUpsertTheme = governanceService.can('UserPreferences', 'UPSERT', context, false);
    // O Core autoriza o recurso, mas o Storage deve barrar a chave
    if (canUpsertTheme) {
        try {
            await pilotStorageService.upsertUserPreference({
                tenant_id: context.activeOrganizationId,
                user_id: testUser.id,
                key: 'theme',
                value: 'dark'
            });
            console.error('❌ Falha: Storage deveria ter bloqueado chave fora da whitelist.');
        } catch (e: any) {
            console.log(`✅ Sucesso: Storage bloqueou chave protegida. (${e.message})`);
        }
    }

    console.log('\n--- CENÁRIO 3: SANEAMENTO DE SEMÂNTICA (Cross-Tenant Block) ---');
    const crossContext = { ...context, targetOrganizationId: 'canoas_organization' };
    const canCross = governanceService.can('UserPreferences', 'UPSERT', crossContext, false);
    
    const status = governanceService.getAuthorityPilotStatus();
    console.log(`Cross-tenant Block Count: ${status.telemetry.cross_tenant_mutation_block_count}`);
    console.log(`Mutation Delegation Count: ${status.telemetry.mutation_delegation_count}`);

    if (!canCross && status.telemetry.cross_tenant_mutation_block_count === 1 && status.telemetry.mutation_delegation_count === 0) {
        console.log('✅ Sucesso: Saneamento confirmado. Bloqueio não contou como delegação.');
    } else {
        console.error('❌ Falha: Erro na semântica da telemetria.');
    }

    console.log('\n--- CENÁRIO 4: ROLLBACK ---');
    const before = pilotStorageService.getUserPreferences(context.activeOrganizationId, testUser.id).length;
    pilotStorageService.purgeBatch('any'); // No Step 2 purge expurga whitelist
    const after = pilotStorageService.getUserPreferences(context.activeOrganizationId, testUser.id).length;
    
    if (before === 1 && after === 0) {
        console.log('✅ Sucesso: Rollback de UserPreferences concluído.');
    } else {
        console.error('❌ Falha: Erro no rollback.');
    }

    console.log('\n--- TELEMETRIA FINAL ---');
    console.log(JSON.stringify(governanceService.getAuthorityPilotStatus().telemetry, null, 2));

    console.log('\n[F5.2] TESTE DE ESCRITA EM USERPREFERENCES - FIM\n');
}

runUserPrefsTest().catch(console.error);
