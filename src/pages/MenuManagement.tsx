import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MenuManagement = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image_url: "",
    available: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    checkAuth();
    fetchMenuItems();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!data) {
      toast.error("You don't have staff access");
      navigate("/");
    }
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category");

    if (error) {
      toast.error("Failed to load menu items");
      return;
    }

    setMenuItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = formData.image_url;

    // Upload image if a new file was selected
    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          toast.error("Failed to upload image");
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;

        // Delete old image if updating
        if (editingItem?.image_url) {
          const oldPath = editingItem.image_url.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('menu-images').remove([oldPath]);
          }
        }
      } catch (error) {
        toast.error("Failed to upload image");
        return;
      }
    }

    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: imageUrl || null,
      available: formData.available,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Failed to update item");
        return;
      }

      toast.success("Item updated successfully");
    } else {
      const { error } = await supabase.from("menu_items").insert(itemData);

      if (error) {
        toast.error("Failed to add item");
        return;
      }

      toast.success("Item added successfully");
    }

    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      image_url: "",
      available: true,
    });
    setImageFile(null);
    setImagePreview("");
    fetchMenuItems();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url || "",
      available: item.available,
    });
    setImageFile(null);
    setImagePreview(item.image_url || "");
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const item = menuItems.find((i) => i.id === id);
    
    // Delete image from storage if it exists
    if (item?.image_url) {
      const path = item.image_url.split('/').pop();
      if (path) {
        await supabase.storage.from('menu-images').remove([path]);
      }
    }

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete item");
      return;
    }

    toast.success("Item deleted successfully");
    fetchMenuItems();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/staff")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      name: "",
                      price: "",
                      category: "",
                      image_url: "",
                      available: true,
                    });
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image (optional)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) =>
                        setFormData({ ...formData, available: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="aspect-video bg-muted rounded mb-3 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.category}</p>
              <p className="text-lg font-semibold text-primary mt-1">
                ${item.price.toFixed(2)}
              </p>
              <p className="text-sm mt-1">
                Status:{" "}
                <span
                  className={
                    item.available ? "text-secondary" : "text-muted-foreground"
                  }
                >
                  {item.available ? "Available" : "Unavailable"}
                </span>
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
