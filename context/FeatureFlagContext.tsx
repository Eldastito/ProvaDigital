
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../store/useAppStore';

type FeatureKey = 'AI_TUTOR' | 'GAMIFICATION_ARCADE' | 'GAMIFICATION_STORE' | 'TABLET_KIOSK';

interface FeatureFlagContextType {
    flags: Record<string, boolean>;
    isEnabled: (key: FeatureKey) => boolean;
    isLoading: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
    flags: {},
    isEnabled: () => false,
    isLoading: true
});

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAppStore();
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFlags = async () => {
            if (!currentUser?.tenantId) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch enabled features for this tenant
                const { data, error } = await supabase
                    .from('tenant_features')
                    .select('feature_key, is_enabled')
                    .eq('tenant_id', currentUser.tenantId);

                if (error) {
                    console.error('Error loading feature flags:', error);
                    return;
                }

                if (data) {
                    const flagMap: Record<string, boolean> = {};
                    data.forEach(f => {
                        flagMap[f.feature_key] = f.is_enabled;
                    });
                    setFlags(flagMap);

                    // DEBUG
                    console.log(`🏁 Feature Flags for ${currentUser.tenantId}:`, flagMap);
                }
            } catch (err) {
                console.error('Failed to load feature flags', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadFlags();
    }, [currentUser?.tenantId]);

    const isEnabled = (key: FeatureKey) => {
        // Default safe: if undefined, treat as FALSE (disabled)
        return !!flags[key];
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, isEnabled, isLoading }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

export const useFeatureFlag = () => useContext(FeatureFlagContext);
