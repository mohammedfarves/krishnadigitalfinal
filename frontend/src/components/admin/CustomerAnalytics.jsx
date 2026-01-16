"use client";
import { Users, UserCheck, UserX, Search, Filter, Download, Mail, MoreVertical, Eye, Loader2, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
export const CustomerAnalytics = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        totalCustomers: 0,
        orderedCustomers: 0,
        signupOnlyCustomers: 0,
        customers: [],
    });
    const navigate = useNavigate();
    const api = createApiClient();
    useEffect(() => {
        fetchCustomerData();
    }, []);
    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            // Use the customer analytics API endpoint
            const response = await api.get("/admin/users/analytics/customers");
            console.log("Customer analytics response:", response.data);
            if (response.data.success && response.data.data) {
                const apiData = response.data.data;
                // Transform the data to match our interface
                const transformedData = {
                    totalCustomers: apiData.totalCustomers || 0,
                    orderedCustomers: apiData.orderedCustomers || 0,
                    signupOnlyCustomers: apiData.signupOnlyCustomers || 0,
                    customers: (apiData.customers || []).map((customer) => ({
                        id: customer.id?.toString() || "",
                        customerCode: customer.customerCode || `CUST-${customer.id}`,
                        name: customer.name || "Unknown",
                        email: customer.email || "No email",
                        phone: customer.phone || "No phone",
                        dateOfBirth: customer.dateOfBirth,
                        orders: customer.orders || 0,
                        totalSpent: customer.totalSpent || "0.00",
                        status: customer.status || "signup-only",
                        joinDate: customer.joinDate ||
                            new Date(customer.createdAt || Date.now())
                                .toISOString()
                                .split("T")[0],
                        isVerified: customer.isVerified || false,
                        isActive: customer.isActive !== undefined ? customer.isActive : true,
                    })),
                };
                setAnalyticsData(transformedData);
            }
            else {
                toast({
                    title: "Error",
                    description: response.data.message || "Failed to load customer data",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error("Error fetching customer data:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load customer data",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleExportCustomers = async () => {
        try {
            setExporting(true);
            const response = await api.get("/admin/users/export", {
                responseType: "blob",
            });
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: "Success",
                description: "Customers exported successfully",
            });
        }
        catch (error) {
            console.error("Error exporting customers:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to export customers",
                variant: "destructive",
            });
        }
        finally {
            setExporting(false);
        }
    };
    const handleViewCustomer = (customerId) => {
        navigate(`/admin/analytics/customers/${customerId}`);
    };
    const handleSendEmail = (customerEmail) => {
        if (customerEmail && customerEmail !== "No email") {
            window.location.href = `mailto:${customerEmail}`;
        }
        else {
            toast({
                title: "Info",
                description: "Customer doesn't have an email address",
                variant: "default",
            });
        }
    };
    const filteredCustomers = analyticsData.customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || customer.status === filterStatus;
        return matchesSearch && matchesFilter;
    });
    const customerStats = [
        {
            title: "Total Customers",
            value: analyticsData.totalCustomers.toLocaleString(),
            icon: Users,
            color: "bg-blue-100 text-blue-600",
        },
        {
            title: "Ordered Customers",
            value: analyticsData.orderedCustomers.toLocaleString(),
            icon: UserCheck,
            color: "bg-green-100 text-green-600",
        },
        {
            title: "Signup Only",
            value: analyticsData.signupOnlyCustomers.toLocaleString(),
            icon: UserX,
            color: "bg-orange-100 text-orange-600",
        },
    ];
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    const formatDateDisplay = (dateString) => {
        if (!dateString || dateString === "Not set")
            return "Not set";
        return dateString;
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/>
          <p className="mt-4 text-muted-foreground">Loading customer data...</p>
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {customerStats.map((stat) => (<Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>))}
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>
              Customer List ({analyticsData.totalCustomers} total)
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search customers..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2"/>
                  <SelectValue placeholder="Filter"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="signup-only">Signup Only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleExportCustomers} disabled={exporting}>
                {exporting ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<Download className="h-4 w-4"/>)}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (<div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                ? "No customers found matching your search"
                : "No customers found"}
              </p>
            </div>) : (<div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (<TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.customerCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{customer.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDateDisplay(customer.dateOfBirth || "Not set")}
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(parseFloat(customer.totalSpent))}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${customer.status === "ordered"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"}`}>
                          {customer.status === "ordered"
                    ? "Ordered"
                    : "Signup Only"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.joinDate}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${customer.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"}`}>
                          {customer.isVerified ? "Verified" : "Not Verified"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                              <Eye className="h-4 w-4 mr-2"/> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(customer.email)} disabled={!customer.email || customer.email === "No email"}>
                              <Mail className="h-4 w-4 mr-2"/> Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </div>)}
        </CardContent>
      </Card>
    </div>);
};
