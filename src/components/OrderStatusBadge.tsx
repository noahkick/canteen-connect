import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle, Package } from "lucide-react";

interface OrderStatusBadgeProps {
  status: "pending" | "preparing" | "ready" | "completed";
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-status-pending text-white",
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    className: "bg-status-preparing text-white",
  },
  ready: {
    label: "Ready for Pickup",
    icon: Package,
    className: "bg-status-ready text-white",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-status-completed text-white",
  },
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};
