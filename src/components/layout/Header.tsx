import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { BookOpen, User, Settings, LogOut, Menu, X } from 'lucide-react'
import { blink } from '@/blink/client'
import type { User as UserType } from '@/types'

export function Header() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user as UserType)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleLogout = () => {
    blink.auth.logout()
  }

  const isActive = (path: string) => location.pathname === path

  if (loading) {
    return (
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold">TOEFL Prep AI</span>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-semibold">TOEFL Prep AI</span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/practice"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/practice') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Practice
            </Link>
            <Link
              to="/full-test"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/full-test') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Full Test
            </Link>
            <Link
              to="/progress"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/progress') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Progress
            </Link>
          </nav>
        )}

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Subscription Status */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="text-xs">
                  <div className="text-gray-600">Subscription</div>
                  <div className={`font-medium ${
                    user.subscriptionStatus === 'active' ? 'text-green-600' : 
                    user.subscriptionStatus === 'trial' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {user.subscriptionStatus === 'active' ? 'Active' : 
                     user.subscriptionStatus === 'trial' ? 'Trial' : 'Inactive'}
                  </div>
                </div>
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Button onClick={() => blink.auth.login()}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/practice"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/practice') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Practice
            </Link>
            <Link
              to="/full-test"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/full-test') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Full Test
            </Link>
            <Link
              to="/progress"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/progress') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Progress
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}