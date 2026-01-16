import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, User, Sparkles, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
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
    return api;
};
// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
// Helper function to format date
const formatDate = (dateString, includeTime = true) => {
    const date = new Date(dateString);
    const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
    };
    if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
    }
    return new Intl.DateTimeFormat("en-IN", options).format(date);
};
// Auth API functions
const authApi = {
    register: async (data) => {
        const api = createApiClient();
        const response = await api.post("/auth/register", data);
        return response.data;
    },
    verifyOtp: async (phone, otp, purpose = "register") => {
        const api = createApiClient();
        const response = await api.post("/auth/verify-otp", { phone, otp, purpose });
        return response.data;
    },
    login: async (data) => {
        const api = createApiClient();
        const response = await api.post("/auth/login", data);
        return response.data;
    },
    verifyLogin: async (phone, otp) => {
        const api = createApiClient();
        const response = await api.post("/auth/verify-login", { phone, otp, purpose: "login" });
        return response.data;
    },
    resendOtp: async (phone, purpose = "login") => {
        const api = createApiClient();
        const response = await api.post("/auth/resend-otp", { phone, purpose });
        return response.data;
    },
    getMe: async () => {
        const api = createApiClient();
        // Add auth token to request
        const token = localStorage.getItem("authToken");
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const response = await api.get("/auth/me");
        return response.data;
    },
    updateMe: async (data) => {
        const api = createApiClient();
        // Add auth token to request
        const token = localStorage.getItem("authToken");
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const response = await api.put("/auth/me", data);
        return response.data;
    },
    logout: async () => {
        const api = createApiClient();
        // Add auth token to request
        const token = localStorage.getItem("authToken");
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        try {
            const response = await api.post("/auth/logout");
            // Clear local storage
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            return response.data;
        }
        catch (error) {
            // Even if API call fails, clear local storage
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            return {
                success: true,
                message: "Logged out successfully",
                data: null,
            };
        }
    }
};
// Realistic confetti piece with physics
const RealisticConfetti = ({ index, totalPieces }) => {
    // Pre-calculate random values for this piece
    const config = useMemo(() => {
        const colors = [
            "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3",
            "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA",
            "#FF9F43", "#6C5CE7", "#00CEC9", "#FD79A8",
            "#E84393", "#00B894", "#FDCB6E", "#74B9FF"
        ];
        const shapes = ["circle", "square", "rectangle", "star", "triangle"];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Explosion from center
        const angle = (index / totalPieces) * 360 + (Math.random() - 0.5) * 30;
        const velocity = 200 + Math.random() * 300;
        const radians = (angle * Math.PI) / 180;
        const endX = Math.cos(radians) * velocity;
        const endY = Math.sin(radians) * velocity - 100; // Upward bias
        return {
            color,
            shape,
            size: 6 + Math.random() * 10,
            startX: 50,
            startY: 50,
            endX,
            endY,
            rotation: Math.random() * 1080 - 540,
            delay: Math.random() * 0.3,
            duration: 2.5 + Math.random() * 1.5,
            wobble: Math.random() * 40 - 20,
        };
    }, [index, totalPieces]);
    const renderShape = () => {
        switch (config.shape) {
            case "circle":
                return (<div className="rounded-full" style={{
                        width: config.size,
                        height: config.size,
                        background: config.color,
                        boxShadow: `0 0 ${config.size / 2}px ${config.color}40`,
                    }}/>);
            case "square":
                return (<div className="rounded-sm" style={{
                        width: config.size,
                        height: config.size,
                        background: config.color,
                    }}/>);
            case "rectangle":
                return (<div className="rounded-sm" style={{
                        width: config.size * 0.4,
                        height: config.size * 1.2,
                        background: config.color,
                    }}/>);
            case "star":
                return (<div style={{
                        width: config.size,
                        height: config.size,
                        background: config.color,
                        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    }}/>);
            case "triangle":
                return (<div style={{
                        width: 0,
                        height: 0,
                        borderLeft: `${config.size / 2}px solid transparent`,
                        borderRight: `${config.size / 2}px solid transparent`,
                        borderBottom: `${config.size}px solid ${config.color}`,
                    }}/>);
            default:
                return (<div className="rounded-full" style={{
                        width: config.size,
                        height: config.size,
                        background: config.color,
                    }}/>);
        }
    };
    return (<motion.div className="absolute pointer-events-none" style={{
            left: `${config.startX}%`,
            top: `${config.startY}%`,
            transform: "translate(-50%, -50%)",
        }} initial={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 0,
            opacity: 0
        }} animate={{
            x: [0, config.endX + config.wobble, config.endX],
            y: [0, config.endY - 50, config.endY + 400],
            rotate: [0, config.rotation / 2, config.rotation],
            scale: [0, 1.2, 1, 0.8],
            opacity: [0, 1, 1, 0],
        }} transition={{
            duration: config.duration,
            delay: config.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
            times: [0, 0.2, 0.7, 1],
        }}>
      {renderShape()}
    </motion.div>);
};
// Sparkle burst component
const SparkleBurst = ({ delay }) => {
    const sparkles = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
        id: i,
        angle: (i / 6) * 360,
        distance: 30 + Math.random() * 40,
        size: 3 + Math.random() * 4,
    })), []);
    return (<motion.div className="absolute" style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 30}%`,
        }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, delay }}>
      {sparkles.map((sparkle) => (<motion.div key={sparkle.id} className="absolute bg-yellow-300 rounded-full" style={{
                width: sparkle.size,
                height: sparkle.size,
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
            }} initial={{ x: 0, y: 0, scale: 0 }} animate={{
                x: Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance,
                y: Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance,
                scale: [0, 1.5, 0],
            }} transition={{
                duration: 0.5,
                delay: delay + 0.1,
                ease: "easeOut",
            }}/>))}
    </motion.div>);
};
// Main confetti explosion
const ConfettiExplosion = () => {
    const totalPieces = 80;
    return (<div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main confetti pieces */}
      {Array.from({ length: totalPieces }, (_, i) => (<RealisticConfetti key={i} index={i} totalPieces={totalPieces}/>))}
      
      {/* Sparkle bursts */}
      {Array.from({ length: 5 }, (_, i) => (<SparkleBurst key={`sparkle-${i}`} delay={0.2 + i * 0.15}/>))}
      
      {/* Center flash */}
      <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full" style={{
            background: "radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)",
        }} initial={{ scale: 0, opacity: 0 }} animate={{
            scale: [0, 2, 3],
            opacity: [0, 0.8, 0],
        }} transition={{
            duration: 0.6,
            ease: "easeOut",
        }}/>
      
      {/* Ribbon streamers */}
      {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * 360;
            const radians = (angle * Math.PI) / 180;
            const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#6C5CE7", "#FD79A8", "#00CEC9"];
            return (<motion.div key={`ribbon-${i}`} className="absolute left-1/2 top-1/2 origin-bottom" style={{
                    width: 3,
                    height: 60,
                    background: `linear-gradient(to bottom, ${colors[i % colors.length]}, transparent)`,
                    borderRadius: 2,
                }} initial={{
                    x: 0,
                    y: 0,
                    rotate: angle,
                    scaleY: 0,
                    opacity: 0,
                }} animate={{
                    x: Math.cos(radians) * 150,
                    y: Math.sin(radians) * 150,
                    rotate: angle + 180,
                    scaleY: [0, 1, 0.5],
                    opacity: [0, 1, 0],
                }} transition={{
                    duration: 1.5,
                    delay: 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                }}/>);
        })}
    </div>);
};
export function SignupDialog({ open, onOpenChange }) {
    const [step, setStep] = useState("info");
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [authMode, setAuthMode] = useState('register');
    const [devOtp, setDevOtp] = useState(null);
    const navigate = useNavigate();
    // Custom AuthContext functions (mocked since we don't have the actual context)
    const sendLoginOtp = async (phone) => {
        try {
            // Use the authApi login function
            const response = await authApi.login({ phone });
            // In development, show OTP if available
            if (response.data?.otp) {
                setDevOtp(response.data.otp);
                return response.data.otp;
            }
            return response.success;
        }
        catch (error) {
            throw new Error(error.message || 'Failed to send OTP');
        }
    };
    const loginWithOtp = async (phone, otp) => {
        try {
            // Use the authApi verifyLogin function
            const response = await authApi.verifyLogin(phone, otp);
            if (response.success && response.data) {
                const { token, user } = response.data;
                // Store authentication data
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                // Notify other components
                window.dispatchEvent(new Event('authChanged'));
                return user;
            }
            else {
                throw new Error(response.message || 'OTP verification failed');
            }
        }
        catch (error) {
            throw new Error(error.message || 'OTP verification failed');
        }
    };
    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep("info");
                setUsername("");
                setPhone("");
                setOtp("");
                setError("");
            }, 300);
        }
    }, [open]);
    const handleTryToClose = () => {
        if (step !== "success") {
            toast({
                title: "Please sign up to continue",
                description: "Complete the signup to access exclusive deals!",
                variant: "destructive",
            });
        }
    };
    const handleGenerateOTP = async () => {
        if (authMode === 'register' && !username.trim()) {
            setError("Please enter your name");
            return;
        }
        if (!phone.trim() || phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            if (authMode === 'register') {
                const response = await authApi.register({ name: username, phone });
                const otp = response?.data?.otp;
                toast({
                    title: response.message || 'OTP sent successfully',
                    description: otp ? `OTP: ${otp}` : undefined,
                    variant: "default",
                });
                setDevOtp(otp || null);
                setStep("otp");
            }
            else {
                // Login flow
                const returned = await sendLoginOtp(phone);
                toast({
                    title: "OTP sent successfully",
                    variant: "default",
                });
                if (returned) {
                    setDevOtp(returned);
                }
                setStep('otp');
            }
        }
        catch (err) {
            setDevOtp(null);
            const errorMessage = err.response?.data?.message || err?.message || 'Failed to send OTP';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError("Please enter the complete OTP");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            if (authMode === 'register') {
                const response = await authApi.verifyOtp(phone, otp);
                if (response.success && response.data) {
                    const { token, user } = response.data;
                    // Persist token and user
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    // Notify other components
                    window.dispatchEvent(new Event('authChanged'));
                    toast({
                        title: 'Signed up successfully',
                        variant: 'default',
                    });
                    setStep("success");
                    setTimeout(() => {
                        onOpenChange(false);
                    }, 800);
                }
                else {
                    throw new Error(response.message || 'OTP verification failed');
                }
            }
            else {
                // Login flow
                const user = await loginWithOtp(phone, otp);
                toast({
                    title: 'Signed in successfully',
                    variant: 'default',
                });
                // If this account is an admin, redirect them to the admin panel immediately
                if (user.role === 'admin') {
                    setDevOtp(null);
                    setTimeout(() => {
                        onOpenChange(false);
                        navigate('/admin');
                    }, 200);
                    return;
                }
                setUsername(user.name || '');
                setStep('success');
                setDevOtp(null);
                setTimeout(() => {
                    onOpenChange(false);
                }, 800);
            }
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || err?.message || 'OTP verification failed';
            const retryMsg = err?.retryAfter ? ` Try again after ${err.retryAfter} seconds.` : '';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage + retryMsg,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20" onPointerDownOutside={(e) => {
            e.preventDefault();
            handleTryToClose();
        }} onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleTryToClose();
        }}>
        {/* Close button that shows toast */}
        {step !== "success" && (<button onClick={handleTryToClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10">
            <X className="h-4 w-4"/>
            <span className="sr-only">Close</span>
          </button>)}

        <AnimatePresence mode="wait">
          {step === "info" && (<motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary"/>
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  {authMode === 'register' ? 'Join Our Community!' : 'Welcome back!'}
                </DialogTitle>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button onClick={() => setAuthMode('register')} className={`px-3 py-1 rounded-full text-sm ${authMode === 'register' ? 'bg-accent text-primary' : 'bg-card text-foreground'}`}>
                    Sign up
                  </button>
                  <button onClick={() => setAuthMode('login')} className={`px-3 py-1 rounded-full text-sm ${authMode === 'login' ? 'bg-accent text-primary' : 'bg-card text-foreground'}`}>
                    Sign in
                  </button>
                </div>
                <p className="text-muted-foreground text-center mt-2">
                  {authMode === 'register'
                ? 'Get exclusive deals and updates on your favorite hardware'
                : 'Sign in with your phone number to continue'}
                </p>
              </DialogHeader>

              <div className="space-y-4">
                {authMode === 'register' && (<div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Your Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                      <Input id="username" placeholder="Enter your name" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"/>
                    </div>
                  </div>)}

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input id="phone" type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"/>
                  </div>
                </div>

                {error && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-sm text-center">
                    {error}
                  </motion.p>)}

                <Button onClick={handleGenerateOTP} disabled={isLoading} className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                  {isLoading ? (<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"/>) : (authMode === 'register' ? 'Generate OTP' : 'Send OTP')}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {authMode === 'register'
                ? 'By signing up, you agree to our Terms & Privacy Policy'
                : 'We will send a one-time password to your phone.'}
                </p>

                {authMode === 'register' ? (<div className="text-center text-sm mt-2">
                    Already have an account?{" "}
                    <button onClick={() => {
                    setAuthMode('login');
                    setDevOtp(null);
                }} className="text-primary font-medium hover:underline">
                      Sign in
                    </button>
                  </div>) : (<div className="text-center text-sm mt-2">
                    New here?{" "}
                    <button onClick={() => {
                    setAuthMode('register');
                    setDevOtp(null);
                }} className="text-primary font-medium hover:underline">
                      Sign up
                    </button>
                  </div>)}
              </div>
            </motion.div>)}

          {step === "otp" && (<motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary"/>
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  Verify Your Number
                </DialogTitle>
                <p className="text-muted-foreground text-center mt-2">
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium text-foreground">+91 {phone}</span>
                </p>
              </DialogHeader>

              {devOtp && (<div className="px-6 pb-2">
                  <p className="text-sm text-muted-foreground">
                    Dev OTP: <span className="font-mono">{devOtp}</span>
                  </p>
                </div>)}

              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl border-border/50"/>
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl border-border/50"/>
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl border-border/50"/>
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl border-border/50"/>
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl border-border/50"/>
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl border-border/50"/>
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-sm text-center">
                    {error}
                  </motion.p>)}

                <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6} className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                  {isLoading ? (<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"/>) : ("Verify OTP")}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Didn't receive code?</span>
                  <button type="button" onClick={() => { setStep("info"); setDevOtp(null); }} className="text-primary font-medium hover:underline">
                    Resend OTP
                  </button>
                </div>
              </div>
            </motion.div>)}

          {step === "success" && (<motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5, type: "spring" }} className="p-8 flex flex-col items-center justify-center min-h-[400px] relative">
              {/* Enhanced Confetti animation */}
              <ConfettiExplosion />

              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}>
                  <PartyPopper className="w-12 h-12 text-green-500"/>
                </motion.div>
              </motion.div>

              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-3xl font-bold text-center mb-2 relative z-10">
                Welcome, {username || 'Friend'}! 🎉
              </motion.h2>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-muted-foreground text-center text-lg relative z-10">
                You're now part of our community!
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-6 px-6 py-3 bg-primary/10 rounded-full relative z-10">
                <span className="text-primary font-medium">10% OFF on your first order!</span>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-8 relative z-10">
                <Button onClick={() => onOpenChange(false)} variant="outline" className="px-8">
                  Start Shopping
                </Button>
              </motion.div>
            </motion.div>)}
        </AnimatePresence>
      </DialogContent>
    </Dialog>);
}
