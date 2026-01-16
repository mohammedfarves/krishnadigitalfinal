import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminCollapsibleSidebar } from "@/components/admin/AdminCollapsibleSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const Admin = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/admin/login');
        }
    }, [loading, user, navigate]);
    if (loading)
        return (<div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading admin...</div>
    </div>);
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/admin/overview'))
            return "Dashboard Overview";
        if (path.includes('/admin/analytics'))
            return "Customer Analytics";
        if (path.includes('/admin/products'))
            return "Product Management";
        if (path.includes('/admin/orders'))
            return "Order Management";
        if (path.includes('/admin/birthdays'))
            return "Birthday Center";
        if (path.includes('/admin/settings'))
            return "Settings";
        if (path.includes('/admin/brands'))
            return "Add Brand";
        if (path.includes('/admin/categories'))
            return "Add Category";
        return "Dashboard";
    };
    const getActiveSection = () => {
        const path = location.pathname;
        if (path.includes('/admin/overview'))
            return 'overview';
        if (path.includes('/admin/analytics'))
            return 'analytics';
        if (path.includes('/admin/products'))
            return 'products';
        if (path.includes('/admin/orders'))
            return 'orders';
        if (path.includes('/admin/birthdays'))
            return 'birthdays';
        if (path.includes('/admin/settings'))
            return 'settings';
        if (path.includes('/admin/brands'))
            return 'brands';
        if (path.includes('/admin/categories'))
            return 'categories';
        return 'overview';
    };
    return (<div className="min-h-screen bg-muted/30">
      {/* Collapsible Sidebar */}
      <AdminCollapsibleSidebar activeSection={getActiveSection()} showFooter={false}/>
      
      {/* Main content area with left padding for sidebar */}
      <div className="ml-12 transition-all duration-200">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background border-b px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search..." className="pl-9 w-64 bg-muted/50"/>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"/>
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              A
            </div>
          </div>
        </header>

        {/* Page content - This is where nested routes will render */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>);
};
export default Admin;
