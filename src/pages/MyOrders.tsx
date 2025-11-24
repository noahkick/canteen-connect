import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const MyOrders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
    subscribeToOrderUpdates();
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError) {
      toast.error("Failed to load order");
      return;
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    if (itemsError) {
      toast.error("Failed to load order items");
      return;
    }

    setOrders([{ ...order, items }]);
  };

  const subscribeToOrderUpdates = () => {
    const channel = supabase
      .channel("order-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            )
          );

          if (payload.new.status === "ready") {
            toast.success("Your order is ready for pickup!", {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <p className="text-center text-muted-foreground">Loading order...</p>
        </Card>
      </div>
    );
  }

  const order = orders[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-bold">Order Tracking</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Order #{order.id.slice(0, 8)}</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="border-t pt-4 mb-4">
            <h3 className="font-semibold mb-2">Customer Details</h3>
            <p className="text-sm">Name: {order.student_name}</p>
            <p className="text-sm">Phone: {order.student_phone}</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    {item.instructions && (
                      <p className="text-sm text-muted-foreground italic">
                        Note: {item.instructions}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ${item.item_price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold">
                    ${(item.item_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                $
                {order.items
                  ?.reduce(
                    (sum: number, item: any) =>
                      sum + item.item_price * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </span>
            </div>
          </div>

          {order.status === "ready" && (
            <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
              <p className="text-center font-semibold text-secondary">
                Your order is ready! Please pick it up at the canteen counter.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MyOrders;
