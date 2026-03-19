import { governanceService } from '../services/governanceService';

async function checkFlags() {
    const status = governanceService.getAuthorityPilotStatus();
    console.log(`Pilot Framework: ${status.enabled ? 'ACTIVE' : 'INACTIVE'} (Scoped)`);
    console.log(`Allowed Organizations: ${JSON.stringify(status.allowedOrganizations)}`);
}

checkFlags().catch(console.error);
