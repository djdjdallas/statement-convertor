"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  SUBSCRIPTION_TIERS,
  checkUsageLimit,
  hasXeroAccess,
  hasBulkXeroExport,
} from "@/lib/subscription-tiers";
import SubscriptionCard from "@/components/SubscriptionCard";
import CheckoutSuccess from "@/components/CheckoutSuccess";
import TrialStatusBanner from "@/components/TrialStatusBanner";
import TrialExpiredModal from "@/components/TrialExpiredModal";
import { toast } from "@/hooks/use-toast";
import { getUserLimits } from "@/lib/trial-utils";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  BarChart3,
  Calendar,
  User,
  LogOut,
  Settings,
  MessageCircle,
  Sheet,
  Sparkles,
  Building,
  Zap,
  Link as LinkIcon,
  Import,
  Send,
} from "lucide-react";
import BulkImportDialog from "@/components/xero/BulkImportDialog";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function DashboardPage() {
  const [files, setFiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalFiles: 0,
    totalTransactions: 0,
    totalExports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false);
  const [xeroConnections, setXeroConnections] = useState([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    fileToDelete: null,
    isDeleting: false
  });
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    console.log(
      "Dashboard useEffect - user:",
      user,
      "authLoading:",
      authLoading
    );

    if (authLoading) {
      console.log("Still loading authentication state...");
      return;
    }

    if (!user) {
      console.log("No user found, redirecting to signin...");
      router.replace("/auth/signin");
      return;
    }

    console.log("User authenticated, fetching dashboard data...");
    fetchDashboardData();

    // Check for Google linking success
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_linked") === "true") {
      toast({
        title: "Success!",
        description: "Your Google account has been linked successfully.",
      });
      // Remove the parameter from URL
      router.replace("/dashboard");
    } else if (params.get("error")) {
      toast({
        title: "Error",
        description: params.get("error"),
        variant: "destructive",
      });
      // Remove the parameter from URL
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profile || { subscription_tier: "free" });

      // Check if trial has expired
      if (
        profile?.signup_intent === "trial" &&
        profile?.trial_end_date &&
        new Date(profile.trial_end_date) < new Date() &&
        (!profile?.subscription_tier || profile?.subscription_tier === "free")
      ) {
        setShowTrialExpiredModal(true);
      }

      // Check Google Drive connection
      try {
        const response = await fetch("/api/auth/google/link");
        if (response.ok) {
          const data = await response.json();
          setHasGoogleDrive(data.linked);
        }
      } catch (err) {
        console.log("Could not check Google Drive status");
      }

      // Fetch files with transaction counts
      const { data: filesData } = await supabase
        .from("files")
        .select(
          `
          *,
          transactions(count)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setFiles(filesData || []);

      // Check Xero connections
      try {
        const xeroResponse = await fetch("/api/xero/connections");
        if (xeroResponse.ok) {
          const { connections } = await xeroResponse.json();
          setXeroConnections(connections?.filter((c) => c.is_active) || []);
        }
      } catch (err) {
        console.log("Could not check Xero connection status");
      }

      // Fetch usage statistics using the efficient stored function
      const { data: monthlyUsage, error: usageError } = await supabase
        .rpc("get_user_monthly_usage", { p_user_id: user.id })
        .single();

      if (usageError) {
        console.error("Error fetching monthly usage:", usageError);
      }

      const { data: exports } = await supabase
        .from("file_exports")
        .select("id")
        .eq("user_id", user.id);

      const totalTransactions =
        filesData?.reduce(
          (sum, file) => sum + (file.transactions?.[0]?.count || 0),
          0
        ) || 0;

      setStats({
        thisMonth: monthlyUsage?.conversions_count || 0,
        totalFiles: filesData?.length || 0,
        totalTransactions,
        totalExports: exports?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = (file) => {
    setDeleteModalState({
      isOpen: true,
      fileToDelete: file,
      isDeleting: false
    });
  };

  const confirmDeleteFile = async () => {
    const fileToDelete = deleteModalState.fileToDelete;
    if (!fileToDelete) return;

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

    try {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", fileToDelete.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Remove from local state
      setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id));

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalFiles: prev.totalFiles - 1,
      }));

      // Show success toast
      toast({
        title: "File Deleted",
        description: "The file has been successfully deleted.",
        variant: "success",
      });

      // Close modal
      setDeleteModalState({
        isOpen: false,
        fileToDelete: null,
        isDeleting: false
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const userTier = userProfile?.subscription_tier || "free";
  const tierInfo = getUserLimits(userProfile) || SUBSCRIPTION_TIERS[userTier];
  const monthlyLimit =
    tierInfo?.monthlyConversions || tierInfo?.limits?.monthlyConversions;
  const canProcess = monthlyLimit === -1 || stats.thisMonth < monthlyLimit;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // This should not render because of the useEffect redirect, but keeping as fallback
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Redirecting to sign in...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Statement Desk
                </span>
                <div className="text-xs text-gray-500 -mt-1">
                  AI-Powered Analytics
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge
                variant="outline"
                className={`capitalize px-3 py-1 font-medium border-2 ${
                  userTier === "premium"
                    ? "border-gradient-to-r from-purple-500 to-pink-500 text-purple-700 bg-purple-50"
                    : userTier === "basic"
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : "border-gray-300 text-gray-600 bg-gray-50"
                }`}
              >
                ✨ {userTier} Plan
              </Badge>
              {hasGoogleDrive && (
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-700 bg-green-50"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z" />
                  </svg>
                  Google Connected
                </Badge>
              )}
              <div className="flex items-center space-x-1">
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-white/60 transition-all duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Checkout Success Message */}
        <CheckoutSuccess />

        {/* Trial Status Banner */}
        <TrialStatusBanner
          userProfile={userProfile}
          userSubscription={userProfile}
        />

        {/* Trial Expired Modal */}
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={() => setShowTrialExpiredModal(false)}
          userProfile={userProfile}
        />

        {/* Modern Welcome Section with Bento Box Layout */}
        <div className="mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Welcome back,{" "}
                  {userProfile?.full_name || user.email?.split("@")[0]}! 👋
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  Transform your financial data with AI-powered insights
                </p>
              </div>
              <div className="mt-6 md:mt-0 flex space-x-3">
                <Link href="/analytics">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button
                    variant="outline"
                    className="border-2 border-indigo-200 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    AI Chat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards with Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats.thisMonth}
                    </p>
                    {monthlyLimit !== -1 && (
                      <p className="text-sm text-gray-500 ml-1">
                        / {monthlyLimit}
                      </p>
                    )}
                  </div>
                  {monthlyLimit !== -1 && (
                    <div className="mt-3">
                      <Progress
                        value={(stats.thisMonth / monthlyLimit) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((stats.thisMonth / monthlyLimit) * 100)}%
                        used
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Files
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.totalFiles}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Successfully processed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Transactions
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    {stats.totalTransactions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Extracted & analyzed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exports</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats.totalExports}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Downloads completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Xero Connection Status */}
        {xeroConnections.length > 0 && hasXeroAccess(userTier) && (
          <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-md">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Xero Integration</CardTitle>
                    <CardDescription>
                      Connected to {xeroConnections.length} organization
                      {xeroConnections.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hasBulkXeroExport(userTier) ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowBulkImport(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Bulk Export to Xero
                  </Button>
                ) : (
                  <Button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    onClick={() => {
                      toast({
                        title: "Business Plan Required",
                        description:
                          "Bulk export to Xero is available on Business plans and above. Upgrade to export multiple files at once.",
                        variant: "default",
                        action: (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/pricing")}
                          >
                            View Plans
                          </Button>
                        ),
                      });
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Bulk Export to Xero
                    <Badge className="ml-2" variant="secondary">
                      Business
                    </Badge>
                  </Button>
                )}
                <Link href="/settings">
                  <Button
                    variant="outline"
                    className="w-full border-green-300 hover:bg-green-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Connection
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-green-300 hover:bg-green-50"
                  disabled
                >
                  <Import className="h-4 w-4 mr-2" />
                  Import from Xero (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modern Quick Actions with Bento Box Design */}
        <Card className="mb-12 bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              🚀 Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Get started with your most common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Link href="/upload">
                <Button
                  className={`w-full h-32 flex flex-col space-y-3 text-lg font-medium transition-all duration-300 hover:scale-105 ${
                    canProcess
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-2xl"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  disabled={!canProcess}
                >
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Plus className="h-8 w-8" />
                  </div>
                  <span>Upload New File</span>
                  {!canProcess && (
                    <span className="text-xs opacity-75">Limit Reached</span>
                  )}
                </Button>
              </Link>

              <Link href="#pricing">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Upgrade Plan
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Get unlimited access
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/analytics">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          View Analytics
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          AI-powered insights
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/chat">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          AI Assistant
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Ask about finances
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Google Workspace Integration Highlight */}
        {hasGoogleDrive && (
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-md">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"
                      fill="#4285F4"
                    />
                    <path d="M7.71 3.5h8.58L22.85 15H9.71z" fill="#34A853" />
                    <path
                      d="M1.15 15l6.56-11.5L14.27 15H1.15z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M14.27 15l-6.56 7.5L1.15 15h13.12z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                Google Workspace Connected
              </CardTitle>
              <CardDescription>
                Seamlessly work with your financial data across Google's
                productivity suite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    Import from Drive
                  </h4>
                  <p className="text-sm text-gray-600">
                    Access PDF statements directly from your Google Drive
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Sheet className="h-4 w-4 text-green-600" />
                    Export to Sheets
                  </h4>
                  <p className="text-sm text-gray-600">
                    Create interactive spreadsheets with charts & AI insights
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Auto-sync
                  </h4>
                  <p className="text-sm text-gray-600">
                    Processed files automatically saved to your Drive
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Integration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <SubscriptionCard
              userProfile={userProfile}
              monthlyUsage={stats.thisMonth}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Supported Banks
                  </h4>
                  <p className="text-gray-600">
                    We support statements from Chase, Bank of America, Wells
                    Fargo, Citibank, and 200+ more banks.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    File Formats
                  </h4>
                  <p className="text-gray-600">
                    Upload PDF files up to{" "}
                    {userTier === "free"
                      ? "10MB"
                      : userTier === "basic"
                      ? "50MB"
                      : "100MB"}
                    . Export as Excel or CSV.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Security</h4>
                  <p className="text-gray-600">
                    All files are automatically deleted after 7 days. We use
                    bank-level encryption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>
                  Your uploaded and processed bank statements
                </CardDescription>
              </div>
              <Link href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by uploading your first bank statement
                </p>
                <Link href="/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First File
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(file.processing_status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {file.original_filename}
                          </h4>
                          {file.source === "google_drive" && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50"
                            >
                              <svg
                                className="w-3 h-3 mr-0.5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z" />
                              </svg>
                              Drive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.created_at)}</span>
                          {file.transactions?.[0]?.count && (
                            <>
                              <span>•</span>
                              <span>
                                {file.transactions[0].count} transactions
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(file.processing_status)}>
                        {file.processing_status}
                      </Badge>

                      {file.processing_status === "completed" && (
                        <>
                          <Link href={`/preview/${file.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          {xeroConnections.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-300 hover:bg-green-50"
                              onClick={() => {
                                // TODO: Implement individual file export to Xero
                                toast({
                                  title: "Export to Xero",
                                  description:
                                    "Individual file export coming soon. Use Bulk Import for now.",
                                });
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Xero
                            </Button>
                          )}
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Limits Warning */}
        {!canProcess && monthlyLimit !== -1 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-medium text-orange-900">
                    Monthly limit reached
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    You've processed {stats.thisMonth} out of {monthlyLimit}{" "}
                    files this month. Upgrade your plan to continue processing
                    files.
                  </p>
                  <Link href="/pricing" className="inline-block mt-3">
                    <Button size="sm">Upgrade Plan</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Import Dialog */}
        <BulkImportDialog
          isOpen={showBulkImport}
          onClose={() => {
            setShowBulkImport(false);
            fetchDashboardData(); // Refresh data after closing
          }}
          availableFiles={files.filter(
            (f) => f.processing_status === "completed" && !f.xero_import_id
          )}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalState.isOpen}
          onClose={() => setDeleteModalState({
            isOpen: false,
            fileToDelete: null,
            isDeleting: false
          })}
          onConfirm={confirmDeleteFile}
          title="Delete File"
          itemName={deleteModalState.fileToDelete?.original_filename}
          itemDetails={{
            size: deleteModalState.fileToDelete?.file_size,
            date: deleteModalState.fileToDelete?.created_at,
            transactionCount: deleteModalState.fileToDelete?.transactions?.[0]?.count
          }}
          isDeleting={deleteModalState.isDeleting}
        />
      </div>
    </div>
  );
}
