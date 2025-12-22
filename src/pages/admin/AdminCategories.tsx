import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoryForm from '@/components/admin/CategoryForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  song_count: number;
  created_at: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can delete categories', variant: 'destructive' });
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Category deleted successfully' });
      fetchCategories();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage music genres and categories</p>
          </div>
          {isAdmin && (
            <Button variant="gradient" className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No categories found</p>
              {isAdmin && (
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" />
                  Add your first category
                </Button>
              )}
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {category.icon_url ? (
                      <img src={category.icon_url} alt={category.name} className="w-6 h-6" />
                    ) : (
                      <FolderOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.song_count} songs</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit(category)}>
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </AdminLayout>
  );
};

export default AdminCategories;
