import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  footer_text: string;
  logo_url: string | null;
}

const defaultSettings: SiteSettings = {
  site_name: "OlasPlay",
  site_tagline: "Download Free MP3 Music",
  footer_text: "© 2024 OlasPlay. All rights reserved.",
  logo_url: null,
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_name", "site_tagline", "footer_text", "logo_url"]);

      if (error) {
        console.error("Failed to fetch site settings:", error);
        return defaultSettings;
      }

      const settings: SiteSettings = { ...defaultSettings };
      data.forEach((item) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || defaultSettings[item.key as keyof SiteSettings];
        }
      });

      return settings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
