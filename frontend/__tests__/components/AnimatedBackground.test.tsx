import { render } from '@testing-library/react'
import AnimatedBackground from '@/components/AnimatedBackground'

// Mock THEME_COLORS
jest.mock('@/constants/theme', () => ({
  THEME_COLORS: {
    dark: {
      background: '#000000',
    },
    light: {
      background: '#ffffff',
    },
  },
}))

describe('AnimatedBackground Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render with light mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const backgroundDiv = container.querySelector('.relative')
    expect(backgroundDiv).toHaveStyle({ backgroundColor: '#ffffff' })
  })

  it('should render with dark mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={true} />)
    const backgroundDiv = container.querySelector('.relative')
    expect(backgroundDiv).toHaveStyle({ backgroundColor: '#000000' })
  })

  it('should render gradient layers in light mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const gradients = container.querySelectorAll('.animated-gradient, .animated-gradient-2, .animated-gradient-3, .animated-gradient-4, .animated-gradient-5')
    expect(gradients.length).toBeGreaterThan(0)
  })

  it('should render gradient layers in dark mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={true} />)
    const gradients = container.querySelectorAll('.animated-gradient, .animated-gradient-2, .animated-gradient-3')
    expect(gradients.length).toBeGreaterThan(0)
  })

  it('should have full screen height and width', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const backgroundDiv = container.querySelector('.relative')
    expect(backgroundDiv).toHaveClass('h-screen', 'w-full')
  })

  it('should have overflow hidden', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const backgroundDiv = container.querySelector('.relative')
    expect(backgroundDiv).toHaveClass('overflow-hidden')
  })

  it('should apply animated-gradient class to elements', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const animatedElement = container.querySelector('.animated-gradient')
    expect(animatedElement).toBeInTheDocument()
  })

  it('should apply animated-gradient-2 class to elements', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const animatedElement = container.querySelector('.animated-gradient-2')
    expect(animatedElement).toBeInTheDocument()
  })

  it('should apply animated-gradient-3 class to elements', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const animatedElement = container.querySelector('.animated-gradient-3')
    expect(animatedElement).toBeInTheDocument()
  })

  it('should apply animated-gradient-4 class in light mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const animatedElement = container.querySelector('.animated-gradient-4')
    expect(animatedElement).toBeInTheDocument()
  })

  it('should apply animated-gradient-5 class in light mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const animatedElement = container.querySelector('.animated-gradient-5')
    expect(animatedElement).toBeInTheDocument()
  })

  it('should not have animated-gradient-5 in dark mode', () => {
    const { container } = render(<AnimatedBackground isDarkMode={true} />)
    const animatedElement = container.querySelector('.animated-gradient-5')
    expect(animatedElement).not.toBeInTheDocument()
  })

  it('should have blur effect on gradient layers', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    const gradientLayer = container.querySelector('.blur-3xl')
    expect(gradientLayer).toBeInTheDocument()
  })

  it('should apply different opacity for dark and light modes', () => {
    const { container: darkContainer } = render(<AnimatedBackground isDarkMode={true} />)
    const { container: lightContainer } = render(<AnimatedBackground isDarkMode={false} />)

    const darkOpacity = darkContainer.querySelector('.absolute.inset-0')
    const lightOpacity = lightContainer.querySelector('.absolute.inset-0')

    expect(darkOpacity).toHaveClass('opacity-70')
    expect(lightOpacity).toHaveClass('opacity-35')
  })

  it('should render animated gradient classes', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    // Check that animated gradient classes are applied even though style jsx isn't rendered in tests
    const animatedElements = container.querySelectorAll('[class*="animated-gradient"]')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('should render all required gradient layers', () => {
    const { container } = render(<AnimatedBackground isDarkMode={false} />)
    // Light mode should have 5 gradient layers
    const lightGradients = container.querySelectorAll('.absolute')
    expect(lightGradients.length).toBeGreaterThan(4)

    const { container: darkContainer } = render(<AnimatedBackground isDarkMode={true} />)
    // Dark mode should have 4 gradient layers
    const darkGradients = darkContainer.querySelectorAll('.absolute')
    expect(darkGradients.length).toBeGreaterThan(3)
  })

  it('should switch gradient configuration when toggling dark mode', () => {
    const { container, rerender } = render(<AnimatedBackground isDarkMode={false} />)

    // Count light mode gradients
    const lightGradients = container.querySelectorAll('.animated-gradient, .animated-gradient-2, .animated-gradient-3, .animated-gradient-4, .animated-gradient-5')

    // Switch to dark mode
    rerender(<AnimatedBackground isDarkMode={true} />)

    // Count dark mode gradients (should not have gradient-4 and gradient-5)
    const darkGradient4 = container.querySelector('.animated-gradient-4')
    const darkGradient5 = container.querySelector('.animated-gradient-5')

    expect(lightGradients.length).toBeGreaterThan(0)
    expect(darkGradient4).not.toBeInTheDocument()
    expect(darkGradient5).not.toBeInTheDocument()
  })
})
