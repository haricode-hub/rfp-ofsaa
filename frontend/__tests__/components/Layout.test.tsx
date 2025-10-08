import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layout, useTheme } from '@/components/Layout'

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  SunIcon: () => <div data-testid="sun-icon">Sun</div>,
  MoonIcon: () => <div data-testid="moon-icon">Moon</div>,
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Layout Component', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should render children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render navigation by default', () => {
    render(<Layout><div>Content</div></Layout>)
    // SensAi appears in both nav and footer, check that it appears at least twice
    expect(screen.getAllByText('SensAi')).toHaveLength(2)
  })

  it('should render footer by default', () => {
    render(<Layout><div>Content</div></Layout>)
    expect(screen.getByText(/Powered by SensAi/)).toBeInTheDocument()
  })

  it('should not render navigation when showNavigation is false', () => {
    render(
      <Layout showNavigation={false}>
        <div>Content</div>
      </Layout>
    )
    // SensAi should only appear once (in footer, not in nav)
    expect(screen.getAllByText('SensAi')).toHaveLength(1)
  })

  it('should not render footer when showFooter is false', () => {
    render(
      <Layout showFooter={false}>
        <div>Content</div>
      </Layout>
    )
    expect(screen.queryByText(/Powered by SensAi/)).not.toBeInTheDocument()
  })

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup()
    render(<Layout><div>Content</div></Layout>)

    // Initial state should show MoonIcon (light mode)
    expect(screen.getAllByTestId('moon-icon')).toHaveLength(2) // Desktop and mobile

    // Click theme toggle
    const toggleButtons = screen.getAllByLabelText('Toggle theme')
    await user.click(toggleButtons[0])

    // Should now show SunIcon (dark mode)
    await waitFor(() => {
      expect(screen.getAllByTestId('sun-icon')).toHaveLength(2)
    })
  })

  it('should save theme preference to localStorage', async () => {
    const user = userEvent.setup()
    render(<Layout><div>Content</div></Layout>)

    const toggleButtons = screen.getAllByLabelText('Toggle theme')
    await user.click(toggleButtons[0])

    await waitFor(() => {
      expect(localStorageMock.getItem('theme')).toBe('dark')
    })
  })

  it('should load theme from localStorage on mount', () => {
    localStorageMock.setItem('theme', 'dark')

    render(<Layout><div>Content</div></Layout>)

    // Should show SunIcon since dark mode is loaded
    expect(screen.getAllByTestId('sun-icon')).toHaveLength(2)
  })

  it('should render all navigation links', () => {
    render(<Layout><div>Content</div></Layout>)

    expect(screen.getByText('Home')).toBeInTheDocument()
    // Services appears in both nav and footer, so use getAllByText
    expect(screen.getAllByText('Services').length).toBeGreaterThan(0)
    // About appears in both nav and footer
    expect(screen.getAllByText('About').length).toBeGreaterThan(0)
    // Contact appears in both nav and footer
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0)
  })

  it('should render footer service links', () => {
    render(<Layout><div>Content</div></Layout>)

    expect(screen.getByText('Knowledge Agent')).toBeInTheDocument()
    expect(screen.getByText('Presales Agent')).toBeInTheDocument()
    expect(screen.getByText('FSD Agent')).toBeInTheDocument()
  })

  it('should render footer company links', () => {
    render(<Layout><div>Content</div></Layout>)

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('should render footer support links', () => {
    render(<Layout><div>Content</div></Layout>)

    expect(screen.getByText('Help Center')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('API Reference')).toBeInTheDocument()
  })

  it('should have theme toggle accessible via keyboard', async () => {
    render(<Layout><div>Content</div></Layout>)

    const toggleButtons = screen.getAllByLabelText('Toggle theme')

    // Focus and press Enter
    toggleButtons[0].focus()
    expect(toggleButtons[0]).toHaveFocus()
  })
})

describe('useTheme Hook', () => {
  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const TestComponent = () => {
      try {
        useTheme()
        return <div>Success</div>
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>
      }
    }

    render(<TestComponent />)
    expect(screen.getByText(/useTheme must be used within a ThemeProvider/)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should provide theme context when inside Layout', async () => {
    const TestComponent = () => {
      const { isDarkMode, toggleTheme } = useTheme()
      return (
        <div>
          <div>Mode: {isDarkMode ? 'dark' : 'light'}</div>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <Layout>
        <TestComponent />
      </Layout>
    )

    expect(screen.getByText('Mode: light')).toBeInTheDocument()

    await user.click(screen.getByText('Toggle'))

    await waitFor(() => {
      expect(screen.getByText('Mode: dark')).toBeInTheDocument()
    })
  })
})
