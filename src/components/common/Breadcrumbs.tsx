/**
 * Breadcrumbs component
 * Shows current navigation path
 */

import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  // Don't show breadcrumbs on root or single-level paths
  if (pathnames.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="py-2">
      <ol className="flex items-center space-x-1 text-sm">
        <li className="flex items-center">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const label = value.charAt(0).toUpperCase() + value.slice(1)

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
              {isLast ? (
                <span className="text-gray-900 font-medium">{label}</span>
              ) : (
                <Link 
                  to={to} 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}