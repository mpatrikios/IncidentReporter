import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, User, LogOut } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Engineering Reports
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.fullName || user?.username}
              </span>
              {user?.isEngineer && (
                <Badge variant="secondary">Engineer</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed border-2 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center">
              <Plus className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Create New Report</CardTitle>
              <CardDescription>
                Start a new engineering report using our step-by-step wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" onClick={handleCreateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Start Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Reports
              </CardTitle>
              <CardDescription>
                View and manage your submitted reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {user?.isEngineer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Review Queue
                </CardTitle>
                <CardDescription>
                  Reports pending your engineering review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">Report Templates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Browse available report templates and standards
                </p>
                <Button variant="outline" size="sm" disabled>
                  View Templates
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">Help & Documentation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Learn how to use the report wizard effectively
                </p>
                <Button variant="outline" size="sm" disabled>
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}