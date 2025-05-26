import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Civil Engineering Report Wizard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Streamline your engineering documentation process with our TurboTax-style report wizard. 
            Create professional reports quickly and accurately.
          </p>
          <Link href="/login">
            <Button size="lg" className="px-8 py-3 text-lg">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle className="text-lg">Step-by-Step Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Follow our intuitive wizard to complete reports section by section, ensuring nothing is missed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-lg">Engineer Review</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically route completed reports to licensed engineers for professional review and approval.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle className="text-lg">Save Time</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reduce report creation time by up to 70% with automated templates and standardized workflows.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle className="text-lg">Compliance Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built-in compliance checks ensure your reports meet industry standards and regulations.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Ready to streamline your engineering reports?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of engineers who have already simplified their documentation process.
          </p>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}