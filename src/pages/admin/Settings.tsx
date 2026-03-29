import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shirt, Shield } from "lucide-react";

const Settings = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your admin account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Info
          </CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "User"}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="text-xs font-mono text-muted-foreground">{user?.id}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Joined</span>
            <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            Store Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Store Name</span>
            <span className="text-sm font-medium">T-Shirt Kella</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm">Lovable Cloud</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
