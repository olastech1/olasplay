import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Upload, Key, Globe, Save, Loader2, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch site settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      
      if (error) throw error;
      
      // Convert array to object for easier access
      const settingsMap: Record<string, string> = {};
      data.forEach((setting) => {
        settingsMap[setting.key] = setting.value || "";
      });
      return settingsMap;
    },
  });

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Initialize form data when settings load
  const currentData = { ...settings, ...formData };

  // Update setting mutation
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  // Save all settings
  const handleSaveSettings = async (keys: string[]) => {
    try {
      for (const key of keys) {
        if (formData[key] !== undefined && formData[key] !== settings?.[key]) {
          await updateSetting.mutateAsync({ key, value: formData[key] });
        }
      }
      toast({ title: "Settings saved successfully" });
      setFormData({});
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `site/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      await updateSetting.mutateAsync({ key: "logo_url", value: publicUrl });
      
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      toast({
        title: "Failed to upload logo",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Site Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your site configuration, branding, and API keys
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure your site name, tagline, and other general settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={currentData.site_name || ""}
                      onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                      placeholder="OlasPlay"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_tagline">Site Tagline</Label>
                    <Input
                      id="site_tagline"
                      value={currentData.site_tagline || ""}
                      onChange={(e) => setFormData({ ...formData, site_tagline: e.target.value })}
                      placeholder="Download Free MP3 Music"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Footer Text</Label>
                    <Textarea
                      id="footer_text"
                      value={currentData.footer_text || ""}
                      onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                      placeholder="© 2024 OlasPlay. All rights reserved."
                      rows={2}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings(["site_name", "site_tagline", "footer_text"])}
                  disabled={updateSetting.isPending}
                >
                  {updateSetting.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  SEO Settings
                </CardTitle>
                <CardDescription>
                  Configure search engine optimization settings for better visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_url">Site URL</Label>
                    <Input
                      id="site_url"
                      value={currentData.site_url || ""}
                      onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                      placeholder="https://olasplay.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      Used for canonical URLs and sitemap generation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Default Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={currentData.meta_description || ""}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="Download free MP3 music..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Max 160 characters recommended
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_keywords">Default Keywords</Label>
                    <Input
                      id="meta_keywords"
                      value={currentData.meta_keywords || ""}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      placeholder="mp3 download, free music, songs..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Input
                      id="google_analytics_id"
                      value={currentData.google_analytics_id || ""}
                      onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_verification">Google Site Verification</Label>
                    <Input
                      id="google_verification"
                      value={currentData.google_verification || ""}
                      onChange={(e) => setFormData({ ...formData, google_verification: e.target.value })}
                      placeholder="Verification code"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings(["site_url", "meta_description", "meta_keywords", "google_analytics_id", "google_verification"])}
                  disabled={updateSetting.isPending}
                >
                  {updateSetting.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save SEO Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Branding
                </CardTitle>
                <CardDescription>
                  Upload your logo and configure visual branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Site Logo</Label>
                  
                  {currentData.logo_url && (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <img
                        src={currentData.logo_url}
                        alt="Current logo"
                        className="h-16 w-auto object-contain"
                      />
                      <span className="text-sm text-muted-foreground">Current logo</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="max-w-xs"
                    />
                    {uploading && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommended: PNG or SVG, minimum 200x200 pixels
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Settings */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for external services. These are stored securely and used for song fetching and AI descriptions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rapidapi_key">RapidAPI Key</Label>
                    <Input
                      id="rapidapi_key"
                      type="password"
                      value={currentData.rapidapi_key || ""}
                      onChange={(e) => setFormData({ ...formData, rapidapi_key: e.target.value })}
                      placeholder="Enter your RapidAPI key"
                    />
                    <p className="text-sm text-muted-foreground">
                      Used for fetching song data from external sources
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lovable_api_key">Lovable AI Key</Label>
                    <Input
                      id="lovable_api_key"
                      type="password"
                      value={currentData.lovable_api_key || ""}
                      onChange={(e) => setFormData({ ...formData, lovable_api_key: e.target.value })}
                      placeholder="Enter your Lovable AI key"
                    />
                    <p className="text-sm text-muted-foreground">
                      Used for generating AI song descriptions
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings(["rapidapi_key", "lovable_api_key"])}
                  disabled={updateSetting.isPending}
                >
                  {updateSetting.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save API Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
