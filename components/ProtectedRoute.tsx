import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useGovernance } from '../hooks/useGovernance';
import { Resource, Action } from '../types';

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
    const { can: canLegacy } = usePermissions();
    const { can: canShadow } = useGovernance('ProtectedRoute');

    const legacyDecision = canLegacy(action, resource);
    
    // Shadow Audit: Observa sem interferir
    canShadow(resource, action);

    if (!legacyDecision) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
};
