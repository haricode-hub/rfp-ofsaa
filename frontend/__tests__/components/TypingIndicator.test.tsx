import { render, screen } from '@testing-library/react'
import TypingIndicator from '@/components/TypingIndicator'

describe('TypingIndicator Component', () => {
  it('should render component', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render AI thinking text', () => {
    render(<TypingIndicator isDarkMode={false} />)
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('should render three thinking dots', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
  })

  it('should apply dark mode styles when isDarkMode is true', () => {
    const { container } = render(<TypingIndicator isDarkMode={true} />)
    const dots = container.querySelectorAll('.rounded-full')

    dots.forEach(dot => {
      expect(dot).toHaveClass('bg-blue-400')
    })
  })

  it('should apply light mode styles when isDarkMode is false', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    const dots = container.querySelectorAll('.rounded-full')

    dots.forEach(dot => {
      expect(dot).toHaveClass('bg-blue-600')
    })
  })

  it('should have pointer-events-none class on container', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    expect(container.firstChild).toHaveClass('pointer-events-none')
  })

  it('should apply animation delay to each dot', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    const dots = container.querySelectorAll('.rounded-full')

    expect(dots[0]).toHaveStyle({ animationDelay: '0s' })
    expect(dots[1]).toHaveStyle({ animationDelay: '0.2s' })
    expect(dots[2]).toHaveStyle({ animationDelay: '0.4s' })
  })

  it('should have animation on dots', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    const dots = container.querySelectorAll('.rounded-full')

    dots.forEach(dot => {
      expect(dot).toHaveStyle({ animation: 'thinkingBounce 1.4s ease-in-out infinite' })
    })
  })

  it('should render status text with animate-pulse', () => {
    const { container } = render(<TypingIndicator isDarkMode={false} />)
    const statusText = screen.getByText('AI is thinking...')
    expect(statusText).toHaveClass('animate-pulse')
  })

  it('should apply dark mode text color when isDarkMode is true', () => {
    render(<TypingIndicator isDarkMode={true} />)
    const statusText = screen.getByText('AI is thinking...')
    expect(statusText).toHaveClass('text-blue-300')
  })

  it('should apply light mode text color when isDarkMode is false', () => {
    render(<TypingIndicator isDarkMode={false} />)
    const statusText = screen.getByText('AI is thinking...')
    expect(statusText).toHaveClass('text-blue-600')
  })
})
