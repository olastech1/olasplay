-- Create site_settings table for storing site-wide configuration
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (for logo, site name, etc.)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'OlasPlay'),
  ('site_tagline', 'Download Free MP3 Music'),
  ('footer_text', '© 2024 OlasPlay. All rights reserved.'),
  ('logo_url', NULL),
  ('rapidapi_key', NULL),
  ('lovable_api_key', NULL);

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies for uploads bucket
CREATE POLICY "Anyone can view uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Admins can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'uploads' AND has_role(auth.uid(), 'admin'::app_role));