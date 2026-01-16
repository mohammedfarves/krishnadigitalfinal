import { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
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
export const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRefs = useRef([]);
    const [form, setForm] = useState({
        code: "",
        name: "",
        variant: "",
        sku: "",
        price: "",
        discountPrice: "",
        tax: "",
        categoryId: "",
        subcategory: "",
        brandId: "",
        modelCode: "",
        modelName: "",
        description: "",
        isFeatured: false,
    });
    const [colorsList, setColorsList] = useState([
        { name: "", files: [], existingImages: [], stock: 0 },
    ]);
    const [attributes, setAttributes] = useState("{}");
    const [brands, setBrands] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [models, setModels] = useState([]);
    // Get authenticated user
    const currentUserId = localStorage.getItem("userId") || "1";
    const api = createApiClient();
    const resetForm = () => {
        setForm({
            code: "",
            name: "",
            variant: "",
            sku: "",
            price: "",
            discountPrice: "",
            tax: "",
            categoryId: "",
            subcategory: "",
            brandId: "",
            modelCode: "",
            modelName: "",
            description: "",
            isFeatured: false,
        });
        setColorsList([{ name: "", files: [], existingImages: [], stock: 0 }]);
        setAttributes("{}");
        setEditingProductId(null);
        setIsEditing(false);
        setIsSubmitting(false);
        fileInputRefs.current = [];
    };
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get("/products", {
                    params: { page: 1, limit: 200 },
                });
                const data = response.data?.data || response.data;
                const prods = Array.isArray(data)
                    ? data
                    : data?.data?.products || data?.products || [];
                setProducts(prods);
            }
            catch (err) {
                console.error("Failed to load admin products", err);
                toast({
                    title: "Error",
                    description: err.response?.data?.message || "Failed to load products",
                    variant: "destructive",
                });
            }
        };
        const fetchMeta = async () => {
            try {
                const [bRes, cRes] = await Promise.all([
                    api.get("/brands"),
                    api.get("/categories"),
                ]);
                setBrands(bRes.data?.data || bRes.data || []);
                setCategoriesList(cRes.data?.data || cRes.data || []);
            }
            catch (err) {
                console.warn("Failed to load brands/categories", err);
            }
        };
        fetchProducts();
        fetchMeta();
    }, []);
    // Generate SKU when brand, category, subcategory, or code changes
    useEffect(() => {
        if (isEditing)
            return; // Don't auto-generate SKU when editing
        const generateSku = () => {
            if (!form.code || !form.brandId || !form.categoryId)
                return;
            const brand = brands.find((b) => String(b.id) === form.brandId);
            const category = categoriesList.find((c) => String(c.id) === form.categoryId);
            if (!brand || !category)
                return;
            const timestamp = Date.now().toString().slice(-6);
            const brandCode = brand.name.substring(0, 3).toUpperCase().replace(/\s/g, "");
            const categoryCode = category.name
                .substring(0, 3)
                .toUpperCase()
                .replace(/\s/g, "");
            const subCatCode = form.subcategory
                ? form.subcategory.substring(0, 3).toUpperCase().replace(/\s/g, "")
                : "GEN";
            const productCode = form.code.toUpperCase().replace(/\s/g, "");
            const generatedSku = `${brandCode}-${productCode}-${categoryCode}-${subCatCode}-${timestamp}`;
            setForm((prev) => ({
                ...prev,
                sku: generatedSku,
            }));
        };
        generateSku();
    }, [form.code, form.brandId, form.categoryId, form.subcategory, brands, categoriesList, isEditing]);
    const filteredProducts = products.filter((product) => {
        const name = (product.name || "").toString().toLowerCase();
        const sku = (product.sku || "").toString().toLowerCase();
        const code = (product.code || "").toString().toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
            sku.includes(searchTerm.toLowerCase()) ||
            code.includes(searchTerm.toLowerCase());
        const matchesFilter = filterCategory === "all" ||
            (product.category && product.category.name === filterCategory);
        return matchesSearch && matchesFilter;
    });
    const handleOpenAdd = () => {
        resetForm();
        setIsEditing(false);
        setIsDialogOpen(true);
    };
    const handleOpenEdit = (product) => {
        setIsEditing(true);
        setEditingProductId(String(product.id));
        // Populate form from product
        setForm({
            code: product.code || "",
            name: product.name || "",
            variant: product.variant || "",
            sku: product.sku || "",
            price: product.price != null ? String(product.price) : "",
            discountPrice: product.discountPrice != null ? String(product.discountPrice) : "",
            tax: product.tax != null ? String(product.tax) : "",
            categoryId: product.category?.id ? String(product.category.id) : "",
            subcategory: product.subcategory || "",
            brandId: product.brand?.id ? String(product.brand.id) : "",
            modelCode: product.modelCode || "",
            modelName: product.modelName || "",
            description: product.description || "",
            isFeatured: product.isFeatured || false,
        });
        // Populate colors and images
        const colors = [];
        if (product.colorsAndImages && typeof product.colorsAndImages === "object") {
            Object.entries(product.colorsAndImages).forEach(([colorName, images]) => {
                if (Array.isArray(images) && images.length > 0) {
                    colors.push({
                        name: colorName,
                        existingImages: images.map((img) => ({
                            url: img.url,
                            type: img.type || "gallery",
                            alt: img.alt || colorName,
                            publicId: img.publicId,
                        })),
                        files: [],
                        stock: product.stock && product.stock[colorName]
                            ? Number(product.stock[colorName])
                            : 0,
                    });
                }
            });
        }
        if (colors.length === 0) {
            colors.push({ name: "", files: [], existingImages: [], stock: 0 });
        }
        setColorsList(colors);
        // Populate attributes
        setAttributes(product.attributes ? JSON.stringify(product.attributes, null, 2) : "{}");
        setIsDialogOpen(true);
    };
    const validateForm = () => {
        // Required fields check
        if (!form.code || !form.name || !form.brandId || !form.categoryId || !form.price) {
            return "Please fill required fields: Code, Name, Brand, Category, Price";
        }
        // Model validation - require modelCode and modelName for new products
        if (!form.modelCode || !form.modelName) {
            return "Please provide Model Code and Model Name";
        }
        // Colors validation
        const validColors = colorsList.filter((c) => c.name.trim() !== "");
        if (validColors.length === 0) {
            return "Please add at least one color";
        }
        // Check each color has at least one image (either existing or new)
        for (const color of validColors) {
            const hasExistingImages = color.existingImages && color.existingImages.length > 0;
            const hasNewFiles = color.files && color.files.length > 0;
            if (!hasExistingImages && !hasNewFiles) {
                return `Color "${color.name}" must have at least one image`;
            }
        }
        return null;
    };
    const buildFormData = () => {
        const formData = new FormData();
        console.log("Building form data...");
        // Add basic fields
        formData.append("code", form.code);
        formData.append("name", form.name);
        if (form.variant)
            formData.append("variant", form.variant);
        formData.append("brandId", form.brandId);
        formData.append("categoryId", form.categoryId);
        if (form.subcategory)
            formData.append("subcategory", form.subcategory);
        formData.append("price", form.price);
        if (form.discountPrice)
            formData.append("discountPrice", form.discountPrice);
        if (form.tax)
            formData.append("tax", form.tax);
        if (form.sku)
            formData.append("sku", form.sku);
        if (form.description)
            formData.append("description", form.description);
        formData.append("isFeatured", form.isFeatured.toString());
        // Add model info (always required)
        formData.append("modelCode", form.modelCode || "DEFAULT");
        formData.append("modelName", form.modelName || "Default Model");
        // Add sellerId from authenticated user
        formData.append("sellerId", currentUserId);
        console.log("Seller ID:", currentUserId);
        // Build fileColorMapping
        const fileColorMapping = {};
        let fileIndex = 0;
        const stockObj = {};
        colorsList.forEach((color, colorIndex) => {
            if (!color.name.trim())
                return;
            // Add stock for this color
            stockObj[color.name] = color.stock || 0;
            // Add new files to FormData and create mapping
            if (color.files && color.files.length > 0) {
                const indices = [];
                color.files.forEach((file) => {
                    formData.append("images", file);
                    indices.push(fileIndex);
                    fileIndex++;
                });
                if (indices.length > 0) {
                    fileColorMapping[color.name] = indices;
                }
            }
        });
        // Add fileColorMapping if there are new files
        if (Object.keys(fileColorMapping).length > 0) {
            console.log("File Color Mapping:", fileColorMapping);
            formData.append("fileColorMapping", JSON.stringify(fileColorMapping));
        }
        // Add stock object
        console.log("Stock object:", stockObj);
        formData.append("stock", JSON.stringify(stockObj));
        // Add existing colorsAndImages structure
        const existingColorsAndImages = {};
        colorsList.forEach((color) => {
            if (!color.name.trim())
                return;
            if (color.existingImages && color.existingImages.length > 0) {
                existingColorsAndImages[color.name] = color.existingImages.map((img) => ({
                    url: img.url,
                    type: img.type,
                    alt: img.alt,
                    publicId: img.publicId,
                }));
            }
        });
        // Add existing colorsAndImages if any
        if (Object.keys(existingColorsAndImages).length > 0) {
            console.log("Existing Colors and Images:", existingColorsAndImages);
            formData.append("colorsAndImages", JSON.stringify(existingColorsAndImages));
        }
        // Add attributes
        try {
            const parsedAttributes = JSON.parse(attributes);
            formData.append("attributes", JSON.stringify(parsedAttributes));
        }
        catch {
            formData.append("attributes", "{}");
        }
        // Debug: Log all FormData entries
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
            if (key === "images") {
                console.log(`${key}: File - ${value.name}`);
            }
            else {
                console.log(`${key}:`, value);
            }
        }
        return formData;
    };
    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            toast({
                title: "Validation Error",
                description: error,
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = buildFormData();
            console.log("Submitting product...", {
                isEditing,
                editingProductId,
                productCode: form.code,
                subcategory: form.subcategory,
                colorsCount: colorsList.filter((c) => c.name.trim()).length,
                totalFiles: colorsList.reduce((sum, color) => sum + (color.files?.length || 0), 0),
            });
            let response;
            if (isEditing && editingProductId) {
                console.log("Updating product:", editingProductId);
                response = await api.put(`/products/${editingProductId}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                const updated = response.data?.data || response.data;
                setProducts(products.map((p) => String(p.id) === String(editingProductId) ? { ...p, ...updated } : p));
                toast({
                    title: "Success",
                    description: "Product updated successfully",
                });
            }
            else {
                console.log("Creating new product");
                response = await api.post("/products", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                console.log("Create response:", response.data);
                const created = response.data?.data || response.data;
                setProducts([created, ...products]);
                toast({
                    title: "Success",
                    description: "Product created successfully",
                });
            }
            setIsDialogOpen(false);
            resetForm();
        }
        catch (err) {
            console.error("Failed to save product", err);
            console.error("Error response:", err.response?.data);
            const errorMsg = err.response?.data?.message ||
                err.response?.data?.errors?.join(", ") ||
                err.message ||
                "Save failed";
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?"))
            return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter((p) => String(p.id) !== String(id)));
            toast({
                title: "Success",
                description: "Product deleted successfully",
            });
        }
        catch (err) {
            console.error("Failed to delete product", err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to delete product",
                variant: "destructive",
            });
        }
    };
    const handleDuplicate = async (product) => {
        try {
            // Create a copy with modified code and name
            const formData = new FormData();
            formData.append("code", `${product.code}-copy`);
            formData.append("name", `${product.name} (Copy)`);
            formData.append("brandId", product.brandId);
            formData.append("categoryId", product.categoryId);
            if (product.subcategory)
                formData.append("subcategory", product.subcategory);
            formData.append("price", product.price);
            formData.append("description", product.description || "");
            formData.append("modelCode", product.modelCode || "");
            formData.append("modelName", product.modelName || "");
            // Copy colorsAndImages and stock
            if (product.colorsAndImages) {
                formData.append("colorsAndImages", JSON.stringify(product.colorsAndImages));
            }
            if (product.stock) {
                formData.append("stock", JSON.stringify(product.stock));
            }
            // Add sellerId
            formData.append("sellerId", currentUserId);
            const response = await api.post("/products", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const created = response.data?.data || response.data;
            setProducts([created, ...products]);
            toast({
                title: "Success",
                description: "Product duplicated successfully",
            });
        }
        catch (err) {
            console.error("Failed to duplicate product", err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to duplicate product",
                variant: "destructive",
            });
        }
    };
    const addColor = () => {
        setColorsList([...colorsList, { name: "", files: [], existingImages: [], stock: 0 }]);
    };
    const removeColor = (index) => {
        setColorsList(colorsList.filter((_, i) => i !== index));
        fileInputRefs.current = fileInputRefs.current.filter((_, i) => i !== index);
    };
    const updateColor = (index, field, value) => {
        const updated = [...colorsList];
        updated[index] = { ...updated[index], [field]: value };
        setColorsList(updated);
    };
    const handleFileUpload = (index, files) => {
        if (!files)
            return;
        const fileArray = Array.from(files);
        const currentFiles = colorsList[index].files || [];
        const allFiles = [...currentFiles, ...fileArray];
        updateColor(index, "files", allFiles);
        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].value = "";
        }
    };
    const removeFile = (colorIndex, fileIndex) => {
        const updated = [...colorsList];
        const files = [...(updated[colorIndex].files || [])];
        files.splice(fileIndex, 1);
        updated[colorIndex].files = files;
        setColorsList(updated);
    };
    const removeExistingImage = (colorIndex, imageIndex) => {
        const updated = [...colorsList];
        const existingImages = [...(updated[colorIndex].existingImages || [])];
        existingImages.splice(imageIndex, 1);
        updated[colorIndex].existingImages = existingImages;
        setColorsList(updated);
    };
    const triggerFileInput = (index) => {
        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].click();
        }
    };
    const categories = [
        ...new Set(products.map((p) => p.category?.name || "Uncategorized")),
    ];
    // Get subcategories for selected category
    const selectedCategory = categoriesList.find((c) => String(c.id) === form.categoryId);
    const subcategories = selectedCategory?.subcategories || [];
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    return (<div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-destructive">
              {products.filter((p) => {
            if (!p.stock)
                return true;
            if (typeof p.stock === "number")
                return p.stock === 0;
            return Object.values(p.stock).every((val) => Number(val) === 0);
        }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Featured</p>
            <p className="text-2xl font-bold text-blue-600">
              {products.filter((p) => p.isFeatured).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Products</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search products..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2"/>
                  <SelectValue placeholder="Category"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2"/> Add Product
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
            const colors = product.colorsAndImages
                ? Object.keys(product.colorsAndImages)
                : [];
            const totalStock = product.stock
                ? typeof product.stock === "number"
                    ? product.stock
                    : Object.values(product.stock).every((val) => val !== undefined && val !== null)
                        ? Object.values(product.stock).reduce((sum, val) => sum + Number(val || 0), 0)
                        : 0
                : 0;
            return (<TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.colorsAndImages &&
                    Object.values(product.colorsAndImages)[0]?.[0]?.url && (<img src={Object.values(product.colorsAndImages)[0][0].url} alt={product.name} className="w-10 h-10 rounded object-cover"/>)}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku || product.code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {product.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {colors.slice(0, 3).map((color) => (<Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>))}
                          {colors.length > 3 && (<Badge variant="outline" className="text-xs">
                              +{colors.length - 3}
                            </Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.discountPrice && <>₹{product.discountPrice}</>}
                        {product.price && (<span className="text-xs text-muted-foreground line-through ml-2">
                            ₹{product.price}
                          </span>)}
                      </TableCell>
                      <TableCell>
                        <span className={totalStock === 0 ? "text-destructive font-medium" : ""}>
                          {totalStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch checked={product.isActive} onCheckedChange={async () => {
                    try {
                        const formData = new FormData();
                        formData.append("isActive", (!product.isActive).toString());
                        await api.put(`/products/${product.id}`, formData, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        });
                        const updatedProducts = products.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p);
                        setProducts(updatedProducts);
                    }
                    catch (err) {
                        console.error("Failed to update product status", err);
                    }
                }}/>
                      </TableCell>
                      <TableCell>
                        <Switch checked={product.isFeatured} onCheckedChange={async () => {
                    try {
                        const formData = new FormData();
                        formData.append("isFeatured", (!product.isFeatured).toString());
                        await api.put(`/products/${product.id}`, formData, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        });
                        const updatedProducts = products.map((p) => p.id === product.id
                            ? { ...p, isFeatured: !p.isFeatured }
                            : p);
                        setProducts(updatedProducts);
                    }
                    catch (err) {
                        console.error("Failed to update featured status", err);
                    }
                }}/>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                              <Edit className="h-4 w-4 mr-2"/> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 mr-2"/> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>);
        })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit Product */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {isEditing
            ? "Update the product details below."
            : "Fill in the product details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Product Code *</Label>
                  <Input id="code" placeholder="e.g., PROD001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" placeholder="Enter product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Input id="variant" placeholder="e.g., 2024 Edition, Pro Version" value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Auto-generated)</Label>
                  <Input id="sku" placeholder="Stock Keeping Unit" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="bg-muted" readOnly={!isEditing}/>
                  <p className="text-xs text-muted-foreground">
                    {isEditing
            ? "You can edit SKU for existing products"
            : "SKU is auto-generated based on product details"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Product description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}/>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price</Label>
                  <Input id="discountPrice" type="number" placeholder="0.00" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input id="tax" type="number" placeholder="0" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })}/>
                </div>
              </div>
            </div>

            <Separator />

            {/* Categories & Models */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Categories & Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandId">Brand *</Label>
                  <Select value={form.brandId} onValueChange={(value) => setForm({ ...form, brandId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand"/>
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (<SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value, subcategory: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category"/>
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((category) => (<SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={form.subcategory} onValueChange={(value) => setForm({ ...form, subcategory: value })} disabled={!form.categoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={form.categoryId ? "Select subcategory" : "Select category first"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcat, index) => (<SelectItem key={index} value={subcat}>
                          {subcat}
                        </SelectItem>))}
                      <SelectItem value="none">None / General</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.categoryId && subcategories.length === 0 && (<p className="text-xs text-muted-foreground">
                      No subcategories defined for this category
                    </p>)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Model Information *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelCode">Model Code *</Label>
                    <Input id="modelCode" placeholder="e.g., AC001, TV2024" value={form.modelCode} onChange={(e) => setForm({ ...form, modelCode: e.target.value })}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelName">Model Name *</Label>
                    <Input id="modelName" placeholder="e.g., Inverter Split AC, 4K Smart TV" value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })}/>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter model code and name for this product
                </p>
              </div>
            </div>

            <Separator />

            {/* Colors & Images */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Colors & Images *</h3>
                <Button type="button" variant="outline" onClick={addColor}>
                  <Plus className="h-4 w-4 mr-2"/> Add Color
                </Button>
              </div>

              {colorsList.map((color, colorIndex) => (<div key={colorIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Color {colorIndex + 1}</h4>
                    {colorsList.length > 1 && (<Button type="button" variant="ghost" size="sm" onClick={() => removeColor(colorIndex)}>
                        Remove
                      </Button>)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Color Name *</Label>
                      <Input placeholder="e.g., Red, Blue, Black" value={color.name} onChange={(e) => updateColor(colorIndex, "name", e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" placeholder="0" value={color.stock} onChange={(e) => updateColor(colorIndex, "stock", parseInt(e.target.value) || 0)}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Images</Label>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => triggerFileInput(colorIndex)} className="w-full">
                          <Upload className="h-4 w-4 mr-2"/>
                          Select Images
                        </Button>
                        <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(colorIndex, e.target.files)} className="hidden" ref={(el) => {
                fileInputRefs.current[colorIndex] = el;
            }}/>
                      </div>
                      {color.files && color.files.length > 0 && (<p className="text-sm text-muted-foreground">
                          {color.files.length} image(s) selected
                        </p>)}
                    </div>
                  </div>

                  {/* Image Previews */}
                  <div className="space-y-2">
                    <Label>Image Previews</Label>
                    <div className="flex flex-wrap gap-2">
                      {/* Existing Images */}
                      {color.existingImages?.map((img, imgIndex) => (<div key={`existing-${imgIndex}`} className="relative group">
                          <img src={img.url} alt={img.alt} className="w-24 h-24 object-cover rounded border"/>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeExistingImage(colorIndex, imgIndex)}>
                              Remove
                            </Button>
                          </div>
                          <Badge className="absolute top-1 left-1">{img.type}</Badge>
                        </div>))}

                      {/* New Files */}
                      {color.files?.map((file, fileIndex) => (<div key={`new-${fileIndex}`} className="relative group">
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-24 h-24 object-cover rounded border"/>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeFile(colorIndex, fileIndex)}>
                              Remove
                            </Button>
                          </div>
                          <Badge className="absolute top-1 left-1">
                            {(color.existingImages?.length || 0) + fileIndex === 0
                    ? "main"
                    : "gallery"}
                          </Badge>
                          <p className="text-xs text-center mt-1 truncate max-w-[96px]">
                            {file.name}
                          </p>
                        </div>))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      First image will be set as main image. At least one image per color
                      is required.
                    </p>
                  </div>
                </div>))}
            </div>

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Settings</h3>

              <div className="flex items-center space-x-2">
                <Switch id="isFeatured" checked={form.isFeatured} onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked })}/>
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attributes">Attributes (JSON)</Label>
                <Textarea id="attributes" placeholder='{"color": "red", "size": "M"}' value={attributes} onChange={(e) => setAttributes(e.target.value)} rows={3}/>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button variant="outline" onClick={() => {
            setIsDialogOpen(false);
            resetForm();
        }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  {isEditing ? "Updating..." : "Creating..."}
                </>) : (isEditing ? "Update Product" : "Create Product")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
};
