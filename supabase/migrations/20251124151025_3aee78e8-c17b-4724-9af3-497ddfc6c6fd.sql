-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'completed');

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Menu items are viewable by everyone
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items
  FOR SELECT
  USING (true);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders are viewable by everyone (students can see their own, staff can see all)
CREATE POLICY "Anyone can view orders"
  ON public.orders
  FOR SELECT
  USING (true);

-- Anyone can create orders
CREATE POLICY "Anyone can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  instructions TEXT,
  item_name TEXT NOT NULL,
  item_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items are viewable by everyone
CREATE POLICY "Anyone can view order items"
  ON public.order_items
  FOR SELECT
  USING (true);

-- Anyone can create order items
CREATE POLICY "Anyone can create order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Create user_roles table for staff authentication
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_staff.user_id
      AND role IN ('staff', 'admin')
  )
$$;

-- Only staff can update menu items
CREATE POLICY "Staff can insert menu items"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update menu items"
  ON public.menu_items
  FOR UPDATE
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete menu items"
  ON public.menu_items
  FOR DELETE
  USING (is_staff(auth.uid()));

-- Only staff can update orders
CREATE POLICY "Staff can update orders"
  ON public.orders
  FOR UPDATE
  USING (is_staff(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for order_items table
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Enable realtime for menu_items table
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Insert some sample menu items
INSERT INTO public.menu_items (name, price, category, available) VALUES
  ('Chicken Burger', 5.99, 'Burgers', true),
  ('Veggie Wrap', 4.99, 'Wraps', true),
  ('Caesar Salad', 6.49, 'Salads', true),
  ('Margherita Pizza', 8.99, 'Pizza', true),
  ('French Fries', 2.99, 'Sides', true),
  ('Chocolate Shake', 3.99, 'Beverages', true),
  ('Grilled Chicken Sandwich', 6.99, 'Sandwiches', true),
  ('Pasta Carbonara', 7.99, 'Pasta', true);