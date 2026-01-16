"use client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, LogOut, Settings, UserCircle, Package, ShoppingCart, Cake, BarChart3, ChevronsUpDown, UserCog, Blocks, Store, Tag, } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Create axios instance for auth API
const createApiClient = () => {
    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
        },
    });
    // Add auth token interceptor
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return api;
};
// Auth API functions
const authApi = {
    logout: async () => {
        const api = createApiClient();
        try {
            const response = await api.post("/auth/logout");
            return response.data;
        }
        catch (error) {
            // Even if API call fails, return success for local cleanup
            return {
                success: true,
                message: "Logged out successfully",
                data: null,
            };
        }
    },
    getMe: async () => {
        const api = createApiClient();
        const response = await api.get("/auth/me");
        return response.data;
    },
};
// Get user from localStorage
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            return JSON.parse(userStr);
        }
    }
    catch (error) {
        console.error("Error parsing user from localStorage:", error);
    }
    return null;
};
// Mock AuthContext functions (in case they're not available)
const useMockAuth = () => {
    const logout = async () => {
        try {
            await authApi.logout();
        }
        catch (error) {
            console.warn('Logout API call failed, proceeding with local cleanup');
        }
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('authChanged'));
    };
    return {
        logout,
        user: getCurrentUser(),
    };
};
const sidebarVariants = {
    open: {
        width: "15rem",
    },
    closed: {
        width: "3.05rem",
    },
};
const contentVariants = {
    open: { display: "block", opacity: 1 },
    closed: { display: "block", opacity: 1 },
};
const transitionProps = {
    type: "tween",
    ease: "easeOut",
    duration: 0.2,
    staggerChildren: 0.1,
};
const staggerVariants = {
    open: {
        transition: { staggerChildren: 0.03, delayChildren: 0.02 },
    },
};
export function AdminCollapsibleSidebar({ activeSection, showFooter = true }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    // Try to use actual AuthContext if available, otherwise use mock
    let authContext;
    try {
        // This would be your actual AuthContext import
        // const { logout: contextLogout, user: contextUser } = useAuth();
        // authContext = { logout: contextLogout, user: contextUser };
        // For now, using mock
        authContext = useMockAuth();
    }
    catch (error) {
        // If useAuth is not available, use mock
        authContext = useMockAuth();
    }
    const { logout, user } = authContext;
    const menuItems = [
        { id: "overview", title: "Dashboard", icon: LayoutDashboard, badge: null, path: "/admin/overview" },
        { id: "analytics", title: "Customer Analytics", icon: BarChart3, badge: null, path: "/admin/analytics" },
        { id: "products", title: "Products", icon: Package, badge: null, path: "/admin/products" },
        { id: "orders", title: "Orders", icon: ShoppingCart, badge: null, path: "/admin/orders" },
        { id: "birthdays", title: "Birthdays", icon: Cake, badge: null, path: "/admin/birthdays" },
    ];
    const managementItems = [
        { id: "brands", title: "Brands", icon: Tag, path: "/admin/brands" },
        { id: "categories", title: "Categories", icon: Blocks, path: "/admin/categories" },
        { id: "settings", title: "Settings", icon: Settings, path: "/admin/settings" },
    ];
    const handleLogout = async () => {
        try {
            // Check if logout function exists in auth context
            if (logout) {
                await logout();
            }
            else {
                // Fallback: Direct API call and token removal
                try {
                    await authApi.logout();
                }
                catch (apiError) {
                    console.warn('Logout API call failed, proceeding with local cleanup');
                }
                // Clear local storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                // Dispatch event to notify other components
                window.dispatchEvent(new Event('authChanged'));
            }
            toast({
                title: 'Logged out',
                description: 'You have been signed out successfully.'
            });
            // Navigate to admin login page
            navigate('/admin/login');
        }
        catch (error) {
            console.error('Logout error:', error);
            toast({
                title: 'Logout failed',
                description: 'There was an error signing out. Please try again.',
                variant: 'destructive'
            });
        }
    };
    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
        }
        if (user?.email) {
            return user.email.substring(0, 1).toUpperCase();
        }
        return 'AD';
    };
    // Get user display name
    const getUserDisplayName = () => {
        if (user?.name)
            return user.name;
        if (user?.email)
            return user.email.split('@')[0];
        return 'Admin User';
    };
    return (<motion.div className="sidebar fixed left-0 top-0 z-40 h-full shrink-0 border-r bg-background" initial={isCollapsed ? "closed" : "open"} animate={isCollapsed ? "closed" : "open"} variants={sidebarVariants} transition={transitionProps} onMouseEnter={() => setIsCollapsed(false)} onMouseLeave={() => setIsCollapsed(true)}>
      <motion.div className="flex h-full w-full flex-col items-start justify-start">
        <motion.ul variants={staggerVariants} className="flex h-full w-full flex-col items-start">
          <div className="flex h-full w-full flex-col">
            {/* Admin Panel Header */}
            <div className="flex w-full flex-col items-start justify-start gap-2 p-2">
              <div className="flex h-fit w-full flex-col items-start justify-start gap-2 p-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex w-full items-center justify-start gap-2 p-2 hover:bg-accent">
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-sm font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <motion.div variants={contentVariants} className="flex w-full items-center justify-start gap-2">
                        {!isCollapsed && (<span className="flex items-center justify-between flex-1">
                            <div className="flex flex-col items-start">
                              <p className="text-sm font-semibold">
                                Admin Panel
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getUserDisplayName()}
                              </p>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50"/>
                          </span>)}
                      </motion.div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {getUserDisplayName()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email || 'admin@store.com'}
                        </span>
                        <span className="text-xs text-green-600 font-medium mt-1">
                          Administrator
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                      <Link to="/admin/profile">
                        <UserCircle className="h-4 w-4"/> Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                      <Link to="/admin/users">
                        <UserCog className="h-4 w-4"/> Manage Users
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                      <Link to="/" className="flex items-center gap-2">
                        <Store className="h-4 w-4"/>
                        Back to Store
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator />

            {/* Main Navigation */}
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex h-full w-full flex-col justify-between overflow-hidden p-2">
                <ScrollArea className="h-full [&>div>div]:!block">
                  <div className="flex h-full flex-col gap-1">
                    {/* Main Menu Items */}
                    <div className="mb-2">
                    
                      {menuItems.map((item) => (<li key={item.id} className="w-full list-none">
                          <Link to={item.path} className={cn("flex w-full items-center justify-start gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors", activeSection === item.id && "bg-accent text-accent-foreground")}>
                            <item.icon className="h-4 w-4 shrink-0"/>
                            {!isCollapsed && (<div className="flex items-center justify-between flex-1">
                                <p className="text-sm">{item.title}</p>
                                {item.badge && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                                    {item.badge}
                                  </Badge>)}
                              </div>)}
                          </Link>
                        </li>))}
                    </div>

                    <Separator className="my-2"/>
                    
                    {/* Management Items */}
                    <div className="mb-2">
                      <motion.div variants={contentVariants} className="px-2 py-1">
                        {!isCollapsed && (<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Management
                          </p>)}
                      </motion.div>
                      {managementItems.map((item) => (<li key={item.id} className="w-full list-none">
                          <Link to={item.path} className={cn("flex w-full items-center justify-start gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors", activeSection === item.id && "bg-accent text-accent-foreground")}>
                            <item.icon className="h-4 w-4 shrink-0"/>
                            {!isCollapsed && (<div className="flex items-center justify-between flex-1">
                                <p className="text-sm">{item.title}</p>
                              </div>)}
                          </Link>
                        </li>))}
                    </div>
                  </div>
                  
                  {/* Sign Out Button */}
                  <div className="mt-4">
                    <Button variant="ghost" className="flex w-full items-center justify-start gap-3 p-2 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 shrink-0"/>
                      {!isCollapsed && (<span className="text-sm">Sign Out</span>)}
                    </Button>
                  </div>
                </ScrollArea>

                {/* Footer with Sign Out Button */}
                {showFooter && (<div className="flex flex-col gap-2 pt-2 border-t">
                    {/* Store Link */}
                    <Link to="/">
                      <Button variant="ghost" className="flex w-full items-center justify-start gap-3 p-2 hover:bg-accent">
                        <Store className="h-4 w-4 shrink-0"/>
                        {!isCollapsed && (<span className="text-sm">Back to Store</span>)}
                      </Button>
                    </Link>

                    {/* Version Info */}
                    <motion.div variants={contentVariants} className="px-2 py-1">
                      {!isCollapsed && (<div className="flex flex-col">
                          <p className="text-xs text-muted-foreground">
                            Admin Panel v1.0.0
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Krishna Stores
                          </p>
                        </div>)}
                    </motion.div>
                  </div>)}
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>);
}
