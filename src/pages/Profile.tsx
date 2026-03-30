import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, LogOut, Shield, Mail, Calendar } from "lucide-react";

const Profile = () => {
  const { user, loading, isAdmin, isModerator, isStaff, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const email = user.email ?? "No email";
  const initials = email.slice(0, 2).toUpperCase();
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const roleBadge = isAdmin ? "Admin" : isModerator ? "Moderator" : "Customer";
  const roleBadgeVariant = isAdmin
    ? "destructive"
    : isModerator
      ? "secondary"
      : "outline";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>

        {/* Profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl font-heading">{email}</CardTitle>
              <Badge variant={roleBadgeVariant as any}>{roleBadge}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="text-foreground font-medium">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Member since</p>
                  <p className="text-foreground font-medium">{createdAt}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex flex-wrap gap-3">
              {isStaff && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
