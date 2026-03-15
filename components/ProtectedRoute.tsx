import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { usePermissions } from '../hooks/usePermissions';
import { useGovernance } from '../hooks/useGovernance';
import { Resource, Action, UserRole } from '../types';

interface ProtectedRouteProps {
    resource: Resource;
    action?: Action;
    fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    resource,
    action = 'VIEW',
    fallbackPath = '/dashboard'
}) => {
    const { currentUser, selectedChildId } = useAppStore();
    const { can: canLegacy } = usePermissions();
    const { can: canShadow } = useGovernance('ProtectedRoute');

    // Hotfix: Contexto dinâmico para Pais
    const contextId = (currentUser?.role === UserRole.PAIS && resource === 'STUDENT_DATA') 
        ? selectedChildId || undefined 
        : undefined;

    const legacyDecision = canLegacy(action, resource, contextId);
    
    // Shadow Audit: Observa sem interferir
    canShadow(resource, action, { targetSchoolId: contextId }); // Simplificado p/ shadow

    if (!legacyDecision) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
};
