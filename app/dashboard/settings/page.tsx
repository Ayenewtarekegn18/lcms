import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from './logout-button'

// Signing out runs on the server (./actions.ts), so this page needs no browser Supabase client.
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and system settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Account Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
            <LogoutButton />
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">System Status</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
