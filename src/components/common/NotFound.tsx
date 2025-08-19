/**
 * 404 Not Found component
 * Displayed when user navigates to an unknown route
 */

import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Home, AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      {/* Background pattern */}
      <div className="fixed inset-0 z-0 opacity-30 bg-[image:linear-gradient(to_right,var(--border),transparent_1px),linear-gradient(to_bottom,var(--border),transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_0%,transparent_100%)]" />
      
      <div className="z-10 flex flex-col items-center text-center max-w-md">
        <div className="flex items-center justify-center mb-6 text-primary">
          <AlertCircle className="h-12 w-12" />
        </div>
        
        <h1 className="text-7xl font-bold mb-4 text-primary">404</h1>
        
        <p className="text-xl font-semibold mb-2">Page not found</p>
        
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <Button asChild className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}