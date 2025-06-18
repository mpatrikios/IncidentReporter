import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-grey-50">
      <Card className="w-full max-w-md mx-4 border-2 border-grey-200 shadow-lg">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4 gap-4">
            <div className="p-4 bg-red-100 rounded-xl border-2 border-red-200">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-grey-900">404 - Page Not Found</h1>
          </div>

          <p className="mt-2 mb-6 text-grey-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link href="/">
            <Button className="gap-2 bg-blue-700 hover:bg-blue-800 text-white">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
