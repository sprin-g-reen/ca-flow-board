import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';

/**
 * Component that applies branding colors from settings to CSS custom properties
 * This allows the entire app to use the configured accent/primary colors
 * Works for ALL users (owner, admin, employee) by fetching firm settings
 */
export const ThemeApplier = () => {
  // Only fetch theme when user is authenticated
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Fetch company settings for theme - works for all user roles
  const { data: settings } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      try {
        const response = await api.get('/settings/company') as any;
        return response?.data || response;
      } catch (error) {
        console.log('⚠️ Could not fetch theme settings, using defaults');
        return null;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
    enabled: isAuthenticated, // Only fetch when user is logged in
  });

  useEffect(() => {
    // Extract branding from settings
    const branding = settings?.branding;
    const primaryColor = branding?.primaryColor;
    const secondaryColor = branding?.secondaryColor;

    console.log('🎨 ThemeApplier - applying branding:', { branding, primaryColor, secondaryColor });

    if (primaryColor) {
      // Convert hex color to HSL for CSS custom property
      const hsl = hexToHSL(primaryColor);
      if (hsl) {
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--accent', hsl);
        console.log('🎨 Applied primary color:', primaryColor, '→', hsl);
      }
    }

    if (secondaryColor) {
      const hsl = hexToHSL(secondaryColor);
      if (hsl) {
        document.documentElement.style.setProperty('--secondary', hsl);
        console.log('🎨 Applied secondary color:', secondaryColor, '→', hsl);
      }
    }
  }, [settings]); // Re-run when settings change

  return null; // This component doesn't render anything
};

/**
 * Convert hex color to HSL format for CSS custom properties
 * @param hex - Hex color string (e.g., "#3b82f6")
 * @returns HSL string (e.g., "217 91% 60%") or null if invalid
 */
function hexToHSL(hex: string): string | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}
