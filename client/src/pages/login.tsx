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
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Engineering Suite</h1>
            </div>
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Professional Civil Engineering Documentation Platform
            </h2>
            <p className="text-xl text-muted-foreground">
              Streamline your engineering workflows with intelligent automation, modern interfaces, and comprehensive reporting tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure & Compliant</h3>
                <p className="text-muted-foreground">Enterprise-grade security with industry standard compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/10 rounded-xl">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Intelligent Automation</h3>
                <p className="text-muted-foreground">AI-powered report generation and workflow optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Team Collaboration</h3>
                <p className="text-muted-foreground">Real-time collaboration and review workflows</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="glass-effect border-0 shadow-2xl animate-scale-in">
            <CardHeader className="space-y-4 text-center pb-8">
              <div className="flex justify-center lg:hidden">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold gradient-text">Welcome Back</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Sign in to access your engineering workspace
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-12 px-4 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 px-4 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                
                {login.error && (
                  <Alert className="border-destructive/20 bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {login.error.message || "Invalid credentials. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={login.isPending}
                >
                  {login.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign In
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">Demo Accounts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Engineer Account</div>
                      <div className="text-xs text-muted-foreground font-mono">john.doe / password123</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">User Account</div>
                      <div className="text-xs text-muted-foreground font-mono">jane.smith / password123</div>
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