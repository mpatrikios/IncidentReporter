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
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-12">
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <TrendingUp className="h-4 w-4" />
              Professional Engineering Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome back, <span className="gradient-text">{user?.firstName || user?.username}</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Streamline your civil engineering documentation with intelligent automation and modern workflows
            </p>
            <Button 
              size="lg" 
              onClick={handleCreateReport}
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="h-5 w-5" />
              Create New Report
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="glass-effect border-0 shadow-xl card-hover animate-scale-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="text-center relative z-10 pb-4">
              <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Create New Report</CardTitle>
              <CardDescription className="text-base">
                Start a new engineering report using our intelligent step-by-step wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <Button 
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80" 
                onClick={handleCreateReport}
              >
                <FileText className="h-4 w-4" />
                Start Report
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-xl card-hover animate-scale-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="p-4 bg-accent/10 rounded-2xl w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                <FileText className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">My Reports</CardTitle>
              <CardDescription className="text-base">
                View and manage your submitted engineering reports
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {user?.isEngineer && (
            <Card className="glass-effect border-0 shadow-xl card-hover animate-scale-in relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl w-fit mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/30 transition-colors">
                  <User className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Review Queue</CardTitle>
                <CardDescription className="text-base">
                  Reports pending your engineering review and approval
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button variant="outline" className="w-full hover:bg-emerald-600 hover:text-white" disabled>
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