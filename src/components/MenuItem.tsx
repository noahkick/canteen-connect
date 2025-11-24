import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    category: string;
    image_url?: string;
    available: boolean;
  };
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const MenuItem = ({ item, quantity, onAdd, onRemove }: MenuItemProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video bg-muted relative overflow-hidden">
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
        {!item.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-lg font-semibold">Unavailable</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.category}</p>
          </div>
          <span className="font-bold text-lg text-primary">
            ${item.price.toFixed(2)}
          </span>
        </div>
        
        {item.available && (
          <div className="flex items-center gap-2 mt-4">
            {quantity === 0 ? (
              <Button onClick={onAdd} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRemove}
                  className="flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="flex-1 text-center font-semibold">{quantity}</span>
                <Button
                  size="icon"
                  onClick={onAdd}
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
