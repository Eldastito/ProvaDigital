import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
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
    const { can } = usePermissions();

    if (!can(action, resource)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
};
