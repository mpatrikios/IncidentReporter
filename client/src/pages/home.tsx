import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Plus, User, LogOut, Zap, TrendingUp, BookOpen, HelpCircle, ChevronDown, Edit, Calendar, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ReportTemplateDialog, type ReportTemplate } from "@/components/ReportTemplateDialog";

export default function Home() {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  // Use React Query to fetch reports with proper caching and refetching
  const { data: reports = [], isLoading: isLoadingReports, refetch: refetchReports } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reports");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const handleLogout = () => {
    logout.mutate();
  };

  const handleCreateReport = () => {
    setTemplateDialogOpen(true);
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    // Navigate to wizard with selected template
    setLocation(`/report-wizard?template=${template.id}`);
  };

  const handleEditReport = (reportId: string) => {
    setLocation(`/reports/${reportId}`);
  };

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    try {
      await apiRequest("DELETE", `/api/reports/${reportId}`);
      
      // Refetch the reports list to show updated data
      refetchReports();
      
      toast({
        title: "Report Deleted",
        description: `"${reportTitle}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch user reports

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Draft</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl border-2 border-blue-200">
                <Zap className="h-7 w-7 text-blue-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-700">
                  Engineering Suite
                </h1>
                <div className="text-xs text-gray-600 font-medium">
                  Civil Engineering Documentation Platform
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300">
                    <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </span>
                      {user?.isEngineer && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 w-fit">
                          Licensed Engineer
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white border-2 border-gray-200 shadow-lg">
                  <div className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer px-4 py-3"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-50 border-b-2 border-gray-200">
        <div className="container mx-auto px-6 py-12">
          <div className="relative z-10 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Welcome back, <span className="text-blue-700">{user?.givenName || user?.name}</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Streamline your civil engineering documentation with intelligent automation and modern workflows
            </p>
            <Button 
              size="lg" 
              onClick={handleCreateReport}
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-800"
            >
              <Plus className="h-5 w-5" />
              Create New Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white border-2 border-gray-200 shadow-lg card-hover animate-scale-in">
            <CardHeader className="text-center pb-4">
              <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-4 border-2 border-blue-200">
                <Plus className="h-8 w-8 text-blue-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">Create New Report</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Start a new engineering report using our intelligent step-by-step wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="w-full gap-2 bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-800" 
                onClick={handleCreateReport}
              >
                <FileText className="h-4 w-4" />
                Start Report
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-gray-200 shadow-lg card-hover animate-scale-in">
            <CardHeader className="pb-4">
              <div className="p-4 bg-gray-100 rounded-xl w-fit mb-4 border-2 border-gray-200">
                <FileText className="h-8 w-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">My Reports</CardTitle>
              <CardDescription className="text-base text-gray-600">
                View and manage your saved engineering reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => document.getElementById('my-reports-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View My Reports ({reports.length})
              </Button>
            </CardContent>
          </Card>

          {user?.isEngineer && (
            <Card className="bg-white border-2 border-gray-200 shadow-lg card-hover animate-scale-in">
              <CardHeader className="pb-4">
                <div className="p-4 bg-blue-50 rounded-xl w-fit mb-4 border-2 border-blue-200">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Review Queue</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Reports pending your engineering review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* My Reports Section */}
        <div id="my-reports-section" className="space-y-6 mb-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">My Reports</h2>
            <p className="text-gray-600 text-lg">Manage your saved engineering reports</p>
          </div>

          {isLoadingReports ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              <span className="ml-2 text-gray-600">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <Card className="bg-gray-50 border-2 border-gray-200">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                <p className="text-gray-600 mb-4">Create your first engineering report to get started.</p>
                <Button onClick={handleCreateReport} className="bg-blue-700 hover:bg-blue-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(reports) && reports.map((report: any) => (
                <Card key={report._id} className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg text-gray-900 line-clamp-2">
                        {report.title || `Report ${report.projectId}`}
                      </CardTitle>
                      {getStatusBadge(report.status)}
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(report.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Project ID: {report.projectId}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button 
                        size="sm" 
                        onClick={() => handleEditReport(report._id)}
                        className="flex-1 min-w-[80px] bg-blue-700 hover:bg-blue-800 text-white"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`flex-1 min-w-[80px] ${
                          report.googleDocId 
                            ? "border-green-300 text-green-700 hover:bg-green-50" 
                            : "border-gray-300 text-gray-400"
                        }`}
                        disabled={!report.googleDocId}
                        onClick={() => {
                          if (report.googleDocId) {
                            window.open(`https://docs.google.com/document/d/${report.googleDocId}/edit`, '_blank');
                          }
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {report.googleDocId ? "View Doc" : "No Doc"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 min-w-[80px] border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{report.title || `Report ${report.projectId}`}"? 
                              This action cannot be undone and will permanently remove the report and all its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReport(report._id, report.title || `Report ${report.projectId}`)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Report
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Quick Actions</h2>
            <p className="text-gray-600 text-lg">Explore additional features and resources</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-effect border-0 shadow-lg card-hover">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Report Templates</h3>
                    <p className="text-gray-600 mb-4">
                      Browse available report templates and engineering standards
                    </p>
                    <Button variant="outline" size="sm" disabled className="hover:bg-blue-600 hover:text-white">
                      View Templates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-effect border-0 shadow-lg card-hover">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-2xl">
                    <HelpCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Help & Documentation</h3>
                    <p className="text-gray-600 mb-4">
                      Learn how to use the report wizard and platform features
                    </p>
                    <Button variant="outline" size="sm" disabled className="hover:bg-orange-600 hover:text-white">
                      View Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ReportTemplateDialog 
        open={templateDialogOpen} 
        onOpenChange={setTemplateDialogOpen}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}