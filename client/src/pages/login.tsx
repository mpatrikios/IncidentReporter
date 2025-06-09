import { useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, Shield, Users } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-2xl border-2 border-blue-200">
                <Zap className="h-8 w-8 text-blue-700" />
              </div>
              <h1 className="text-3xl font-bold text-blue-700">Engineering Suite</h1>
            </div>
            <h2 className="text-4xl font-bold text-grey-900 leading-tight">
              Professional Civil Engineering Documentation Platform
            </h2>
            <p className="text-xl text-grey-700">
              Streamline your engineering workflows with intelligent automation, modern interfaces, and comprehensive reporting tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <div className="p-2 bg-blue-100 rounded-xl border border-blue-300">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-800">Secure & Compliant</h3>
                <p className="text-blue-600">Enterprise-grade security with industry standard compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-grey-50 border-2 border-grey-200">
              <div className="p-2 bg-grey-100 rounded-xl border border-grey-300">
                <Zap className="h-6 w-6 text-grey-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-grey-800">Intelligent Automation</h3>
                <p className="text-grey-600">AI-powered report generation and workflow optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <div className="p-2 bg-blue-100 rounded-xl border border-blue-300">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-800">Team Collaboration</h3>
                <p className="text-blue-600">Real-time collaboration and review workflows</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="bg-white border-2 border-grey-200 shadow-xl animate-scale-in">
            <CardHeader className="space-y-4 text-center pb-8">
              <div className="flex justify-center lg:hidden">
                <div className="p-3 bg-blue-100 rounded-2xl border-2 border-blue-200">
                  <Zap className="h-8 w-8 text-blue-700" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold text-blue-700">Welcome Back</CardTitle>
                <CardDescription className="text-base text-grey-600">
                  Sign in to access your engineering workspace
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-grey-800">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-12 px-4 bg-white border-2 border-grey-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-grey-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-grey-800">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 px-4 bg-white border-2 border-grey-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-grey-900"
                    />
                  </div>
                </div>
                
                {login.error && (
                  <Alert className="border-2 border-red-300 bg-red-50">
                    <AlertDescription className="text-red-700 font-medium">
                      {login.error.message || "Invalid credentials. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-blue-800"
                  disabled={login.isPending}
                >
                  {login.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign In
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-grey-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-grey-600 font-semibold">Demo Accounts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg border border-blue-300">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-blue-800">Engineer Account</div>
                      <div className="text-xs text-blue-600 font-mono font-medium">john.doe / password123</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-grey-50 border-2 border-grey-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-grey-100 rounded-lg border border-grey-300">
                      <Users className="h-4 w-4 text-grey-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-grey-800">User Account</div>
                      <div className="text-xs text-grey-600 font-mono font-medium">jane.smith / password123</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}