'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showNavigation = true,
  showFooter = true
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme class to document
    const documentElement = document.documentElement;
    if (isDarkMode) {
      documentElement.classList.add('dark');
    } else {
      documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className="min-h-screen transition-colors duration-300"
           style={{
             backgroundColor: 'var(--bg-primary)',
             color: 'var(--text-primary)'
           }}>
        {showNavigation && <Navigation />}
        <main>{children}</main>
        {showFooter && <Footer />}
      </div>
    </ThemeContext.Provider>
  );
};

const Navigation: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/#services', label: 'Services' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-colors duration-300 border-b"
         style={{
           backgroundColor: 'var(--bg-primary)',
           color: 'var(--text-primary)',
           borderColor: 'var(--border-color)'
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="heading-3 transition-colors duration-300"
              style={{ color: 'var(--blue-primary)' }}
            >
              SensAi
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
              >
                {item.label}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-300"
              style={{
                color: 'var(--blue-primary)'
              }}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 font-medium text-sm"
              style={{
                backgroundColor: 'var(--blue-primary)',
                color: 'white'
              }}
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-300"
              style={{
                color: 'var(--blue-primary)'
              }}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-all duration-300"
              style={{
                color: 'var(--blue-primary)'
              }}
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 border-t"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="heading-3 mb-4">SensAi</h3>
            <p className="small-text">
              Powerful AI-driven document processing tools for modern businesses.
            </p>
          </div>
          <div>
            <h4 className="nav-text font-semibold mb-4">Services</h4>
            <ul className="space-y-2 small-text">
              <li>
                <Link
                  href="/chat-with-doc"
                  className="nav-link"
                >
                  Knowledge Agent
                </Link>
              </li>
              <li>
                <Link
                  href="/presales"
                  className="nav-link"
                >
                  Presales Agent
                </Link>
              </li>
              <li>
                <Link
                  href="/fsd"
                  className="nav-link"
                >
                  FSD Agent
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="nav-text font-semibold mb-4">Company</h4>
            <ul className="space-y-2 small-text">
              <li>
                <a
                  href="#about"
                  className="nav-link"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="nav-link"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="nav-link"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="nav-link"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="nav-text font-semibold mb-4">Support</h4>
            <ul className="space-y-2 small-text">
              <li>
                <a
                  href="#"
                  className="nav-link"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="nav-link"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="nav-link"
                >
                  API Reference
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center small-text"
             style={{
               borderColor: 'var(--border-color)'
             }}>
          <p>Powered by SensAi · Your all-in-one AI workspace for document processing, content generation, and analysis.</p>
        </div>
      </div>
    </footer>
  );
};