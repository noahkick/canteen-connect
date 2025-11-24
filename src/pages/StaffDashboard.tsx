import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Settings } from "lucide-react";
import { format } from "date-fns";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchOrders();
    subscribeToOrders();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error || !data) {
      toast.error("You don't have staff access");
      navigate("/");
      return;
    }

    setIsStaff(true);
  };

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      toast.error("Failed to load orders");
      return;
    }

    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
        return { ...order, items };
      })
    );

    setOrders(ordersWithItems);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("staff-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "preparing" | "ready" | "completed") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    toast.success("Order status updated");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getNextStatus = (currentStatus: string): "pending" | "preparing" | "ready" | "completed" => {
    const statusFlow: Array<"pending" | "preparing" | "ready" | "completed"> = ["pending", "preparing", "ready", "completed"];
    const currentIndex = statusFlow.indexOf(currentStatus as any);
    return statusFlow[currentIndex + 1] || (currentStatus as any);
  };

  if (!isStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Staff Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/staff/menu")}>
                <Settings className="w-4 h-4 mr-2" />
                Menu Management
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>

        {orders.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">No orders yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "MMM dd, HH:mm")}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold">Customer:</span>{" "}
                      {order.student_name} ({order.student_phone})
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {item.item_name}
                          </p>
                          {item.instructions && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {item.instructions}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold">
                          ${(item.item_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status !== "completed" && (
                  <Button
                    onClick={() =>
                      handleStatusChange(order.id, getNextStatus(order.status))
                    }
                    className="w-full"
                  >
                    Mark as {getNextStatus(order.status)}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
