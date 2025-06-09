import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, User, LogOut, Zap, TrendingUp, BookOpen, HelpCircle } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate();
  };

  const handleCreateReport = () => {
    setLocation("/report-wizard");
  };

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <div className="glass-effect border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">
              Engineering Suite
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {user?.fullName || user?.username}
              </span>
              {user?.isEngineer && (
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  Engineer
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-grey-50 border-b-2 border-grey-200">
        <div className="container mx-auto px-6 py-12">
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-6 border-2 border-blue-200">
              <TrendingUp className="h-4 w-4" />
              Professional Engineering Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-grey-900">
              Welcome back, <span className="text-blue-700">{user?.firstName || user?.username}</span>
            </h2>
            <p className="text-xl text-grey-700 mb-8 max-w-2xl">
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
          <Card className="bg-white border-2 border-grey-200 shadow-lg card-hover animate-scale-in">
            <CardHeader className="text-center pb-4">
              <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-4 border-2 border-blue-200">
                <Plus className="h-8 w-8 text-blue-700" />
              </div>
              <CardTitle className="text-xl text-grey-900">Create New Report</CardTitle>
              <CardDescription className="text-base text-grey-600">
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

          <Card className="bg-white border-2 border-grey-200 shadow-lg card-hover animate-scale-in">
            <CardHeader className="pb-4">
              <div className="p-4 bg-grey-100 rounded-xl w-fit mb-4 border-2 border-grey-200">
                <FileText className="h-8 w-8 text-grey-700" />
              </div>
              <CardTitle className="text-xl text-grey-900">My Reports</CardTitle>
              <CardDescription className="text-base text-grey-600">
                View and manage your submitted engineering reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-2 border-grey-300 text-grey-700 hover:bg-grey-100" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {user?.isEngineer && (
            <Card className="bg-white border-2 border-grey-200 shadow-lg card-hover animate-scale-in">
              <CardHeader className="pb-4">
                <div className="p-4 bg-blue-50 rounded-xl w-fit mb-4 border-2 border-blue-200">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-grey-900">Review Queue</CardTitle>
                <CardDescription className="text-base text-grey-600">
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

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Quick Actions</h2>
            <p className="text-muted-foreground text-lg">Explore additional features and resources</p>
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
                    <p className="text-muted-foreground mb-4">
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
                    <p className="text-muted-foreground mb-4">
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
    </div>
  );
}