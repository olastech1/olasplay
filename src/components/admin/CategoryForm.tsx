import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id?: string;
  name: string;
  slug: string;
  icon_url: string | null;
}

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryForm = ({ category, onClose, onSuccess }: CategoryFormProps) => {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [iconUrl, setIconUrl] = useState(category?.icon_url || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!category?.id;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    if (!isEditing && name) {
      setSlug(generateSlug(name));
    }
  }, [name, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast({ title: 'Error', description: 'Name and slug are required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const data = {
      name: name.trim(),
      slug: slug.trim(),
      icon_url: iconUrl.trim() || null,
    };

    let error;

    if (isEditing) {
      const result = await supabase.from('categories').update(data).eq('id', category.id);
      error = result.error;
    } else {
      const result = await supabase.from('categories').insert(data);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message.includes('duplicate') ? 'A category with this slug already exists' : error.message, 
        variant: 'destructive' 
      });
    } else {
      toast({ title: 'Success', description: `Category ${isEditing ? 'updated' : 'created'} successfully` });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Category' : 'Add Category'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Afrobeats"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., afrobeats"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Icon URL</label>
            <input
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
