"use client";
import { Users, Package, ShoppingCart, Gift, TrendingUp, TrendingDown, DollarSign, Eye, ArrowRight, Calendar, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Create axios instance
const createApiClient = () => {
    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
        },
    });
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return api;
};
export const AdminOverview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [todayBirthdays, setTodayBirthdays] = useState([]);
    const [sendingWishes, setSendingWishes] = useState([]);
    const api = createApiClient();
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch dashboard stats
            const statsResponse = await api.get("/admin/stats");
            if (statsResponse.data.success && statsResponse.data.data) {
                setStats(statsResponse.data.data);
            }
            else {
                toast({
                    title: "Error",
                    description: statsResponse.data.message || "Failed to load dashboard stats",
                    variant: "destructive",
                });
            }
            // Fetch today's birthdays
            const birthdaysResponse = await api.get("/birthdays/today");
            if (birthdaysResponse.data.success && birthdaysResponse.data.data) {
                setTodayBirthdays(birthdaysResponse.data.data);
            }
        }
        catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load dashboard data",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendBirthdayWish = async (userId) => {
        try {
            setSendingWishes((prev) => [...prev, userId]);
            const response = await api.post(`/birthdays/${userId}/wish`);
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Birthday wish sent successfully",
                });
                // Update local state to mark as sent
                setTodayBirthdays((prev) => prev.map((user) => user.id === userId ? { ...user, giftReceived: true } : user));
            }
        }
        catch (error) {
            console.error("Error sending birthday wish:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send birthday wish",
                variant: "destructive",
            });
        }
        finally {
            setSendingWishes((prev) => prev.filter((id) => id !== userId));
        }
    };
    const handleSendAllBirthdayWishes = async () => {
        try {
            const response = await api.post("/admin/send-birthday-wishes");
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: `${response.data.data?.count || 0} birthday wishes sent`,
                });
                // Refresh birthdays list
                const birthdaysResponse = await api.get("/birthdays/today");
                if (birthdaysResponse.data.success && birthdaysResponse.data.data) {
                    setTodayBirthdays(birthdaysResponse.data.data);
                }
            }
        }
        catch (error) {
            console.error("Error sending all birthday wishes:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send birthday wishes",
                variant: "destructive",
            });
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    };
    const calculateMonthlyGrowth = () => {
        if (!stats)
            return 0;
        const { totalRevenue, monthlyRevenue } = stats.counts;
        if (!totalRevenue || totalRevenue === 0)
            return 0;
        return Math.round((monthlyRevenue / totalRevenue) * 100);
    };
    if (loading) {
        return (<div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2"/>
                <Skeleton className="h-8 w-32 mb-4"/>
                <Skeleton className="h-4 w-20"/>
              </CardContent>
            </Card>))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32"/>
            </CardHeader>
            <CardContent>
              {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-16 w-full mb-2"/>))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40"/>
            </CardHeader>
            <CardContent>
              {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-16 w-full mb-2"/>))}
            </CardContent>
          </Card>
        </div>
      </div>);
    }
    // If no stats data, show empty state
    if (!stats) {
        return (<div className="flex flex-col items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">
            Unable to load dashboard statistics
          </p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>);
    }
    const statCards = [
        {
            title: "Total Revenue",
            value: formatCurrency(stats.counts.totalRevenue || 0),
            change: `+${calculateMonthlyGrowth()}%`,
            trend: "up",
            icon: DollarSign,
            color: "text-green-600",
        },
        {
            title: "Total Orders",
            value: stats.counts.totalOrders.toLocaleString(),
            change: `+${stats.counts.newOrdersThisMonth || 0} this month`,
            trend: "up",
            icon: ShoppingCart,
            color: "text-blue-600",
        },
        {
            title: "Total Customers",
            value: stats.counts.totalUsers.toLocaleString(),
            change: `+${stats.counts.newUsersThisMonth || 0} this month`,
            trend: "up",
            icon: Users,
            color: "text-purple-600",
        },
        {
            title: "Active Products",
            value: stats.counts.totalProducts.toLocaleString(),
            change: "Active",
            trend: "up",
            icon: Package,
            color: "text-orange-600",
        },
    ];
    return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (<Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-destructive"}`}>
                    {stat.trend === "up" ? (<TrendingUp className="h-4 w-4"/>) : (<TrendingDown className="h-4 w-4"/>)}
                    {stat.change}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6"/>
                </div>
              </div>
            </CardContent>
          </Card>))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-6 flex flex-col gap-3" onClick={() => navigate("/admin/products")}>
          <Package className="h-8 w-8"/>
          <span className="text-sm">Add Product</span>
        </Button>
        <Button variant="outline" className="h-auto py-6 flex flex-col gap-3" onClick={() => navigate("/admin/orders")}>
          <Eye className="h-8 w-8"/>
          <span className="text-sm">View Orders</span>
        </Button>
        <Button variant="outline" className="h-auto py-6 flex flex-col gap-3" onClick={() => navigate("/admin/analytics")}>
          <Users className="h-8 w-8"/>
          <span className="text-sm">Customers</span>
        </Button>
        <Button variant="outline" className="h-auto py-6 flex flex-col gap-3" onClick={() => navigate("/admin/birthdays")}>
          <Calendar className="h-8 w-8"/>
          <span className="text-sm">Birthdays</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orders")}>
              View All <ArrowRight className="ml-1 h-4 w-4"/>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders?.length ? (stats.recentOrders.map((order) => (<div key={order.id} className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.name || "Customer"} •{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(order.totalPrice)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${order.orderStatus === "delivered"
                ? "bg-green-100 text-green-700"
                : order.orderStatus === "shipped"
                    ? "bg-blue-100 text-blue-700"
                    : order.orderStatus === "processing"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"}`}>
                        {order.orderStatus.charAt(0).toUpperCase() +
                order.orderStatus.slice(1)}
                      </span>
                    </div>
                  </div>))) : (<p className="text-center py-8 text-muted-foreground">
                  No recent orders
                </p>)}
            </div>
          </CardContent>
        </Card>

        {/* Today's Birthdays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary"/>
              Today's Birthdays ({todayBirthdays.length})
            </CardTitle>
            {todayBirthdays.length > 0 && (<Button variant="ghost" size="sm" onClick={handleSendAllBirthdayWishes} disabled={sendingWishes.length > 0}>
                Send All
              </Button>)}
          </CardHeader>
          <CardContent>
            {todayBirthdays.length > 0 ? (<div className="space-y-3">
                {todayBirthdays.map((user) => (<div key={user.id} className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.phone} {user.email && `• ${user.email}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleSendBirthdayWish(user.id)} disabled={sendingWishes.includes(user.id) || user.giftReceived}>
                      {sendingWishes.includes(user.id)
                    ? "Sending..."
                    : user.giftReceived
                        ? "🎉 Sent"
                        : "🎂 Send"}
                    </Button>
                  </div>))}
                <Button variant="link" className="w-full mt-2" onClick={() => navigate("/admin/birthdays")}>
                  View All Birthdays
                </Button>
              </div>) : (<div className="text-center py-8">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">No birthdays today</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check back tomorrow for birthday celebrations!
                </p>
              </div>)}
          </CardContent>
        </Card>
      </div>

      {/* Popular Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary"/>
            Popular Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.popularProducts?.length ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.popularProducts.slice(0, 5).map((product) => (<div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium line-clamp-1">{product.name}</h4>
                    <span className="text-sm font-semibold">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      ⭐ {product.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span>•</span>
                    <span>{product.totalReviews || 0} reviews</span>
                  </div>
                </div>))}
            </div>) : (<p className="text-center py-8 text-muted-foreground">
              No popular products data available
            </p>)}
        </CardContent>
      </Card>
    </div>);
};
