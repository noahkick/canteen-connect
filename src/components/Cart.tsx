import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, X } from "lucide-react";
import { useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  instructions: string;
}

interface CartProps {
  items: CartItem[];
  onUpdateInstructions: (id: string, instructions: string) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (name: string, phone: string) => void;
}

export const Cart = ({ items, onUpdateInstructions, onRemove, onPlaceOrder }: CartProps) => {
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = () => {
    if (!studentName.trim() || !studentPhone.trim()) {
      return;
    }
    onPlaceOrder(studentName, studentPhone);
  };

  return (
    <Card className="sticky top-4">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Your Cart</h2>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
        ) : (
          <>
            <ScrollArea className="h-[300px] mb-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(item.id)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Special instructions (optional)"
                      value={item.instructions}
                      onChange={(e) => onUpdateInstructions(item.id, e.target.value)}
                      className="mt-2 text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter your phone number"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={!studentName.trim() || !studentPhone.trim()}
              className="w-full"
              size="lg"
            >
              Place Order
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
