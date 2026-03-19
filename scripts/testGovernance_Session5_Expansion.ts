import { governanceService } from '../services/governanceService';

async function runSession5Expansion() {
    console.log("--- 🚀 AUTHORITY PILOT - SESSÃO 5 (EXPANSÃO LIMITADA) ---");
    
    governanceService.setAuthorityPilot(true);
    
    // Configuração de Múltiplos Municípios
    const expansionClubs = [
        { id: 'alvorada_admin', org: 'alvorada_organization', school: 'school_alvorada_1' },
        { id: 'viamao_admin', org: 'viamao_organization', school: 'school_viamao_2' },
        { id: 'gravatai_admin', org: 'gravatai_organization', school: 'school_gravatai_3' }
    ];

    for (const pilot of expansionClubs) {
        console.log(`\nIniciando Piloto para: ${pilot.id} em ${pilot.org}`);
        
        const context = {
            roleId: pilot.id,
            activeOrganizationId: pilot.org,
            activeMembershipId: `mem_${pilot.id}`,
            activeScopeType: 'ORG' as const,
            organizationType: 'municipal_secretariat' as const,
        };

        // Teste de Acesso Municipal
        const resOrg = await governanceService.can('ANALYTICS', 'VIEW', { ...context, targetOrganizationId: pilot.org }, false, 'Session_5_Expansion');
        console.log(`[ORG ACCESS] ${pilot.org}: ${resOrg ? '✅ ALLOW' : '⛔ DENY'}`);

        // Teste de Drill-down para escola própria
        const resSchool = await governanceService.can('ANALYTICS', 'VIEW', { ...context, targetOrganizationId: pilot.org, targetSchoolId: pilot.school }, false, 'Session_5_Expansion');
        console.log(`[SCHOOL DRILL-DOWN] ${pilot.school}: ${resSchool ? '✅ ALLOW' : '⛔ DENY'}`);

        // Teste de Bloqueio Cruzado (Tentativa Alvorada -> POA)
        const resCross = await governanceService.can('ANALYTICS', 'VIEW', { ...context, targetOrganizationId: 'poa_organization' }, false, 'Session_5_Expansion');
        console.log(`[CROSS-ORG BLOCK] alvorada -> poa: ${resCross ? '⛔ DENY' : '✅ BLOCKED'}`);
        
        console.log("-" .repeat(50));
    }

    const status = governanceService.getAuthorityPilotStatus();
    console.log(`\n--- Sumário da Sessão 5 (Expansão) ---`);
    console.log(`Municípios Ativos: ${expansionClubs.length}`);
    console.log(`Fallbacks: ${status.fallbackCount}`);
    console.log(`--- FIM DA SESSÃO 5 ---\n`);
}

runSession5Expansion().catch(console.error);
