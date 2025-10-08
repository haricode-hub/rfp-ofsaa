import { render, screen } from '@testing-library/react'
import TextSelectionToolbar from '@/components/TextSelectionToolbar'

// Mock Turndown
jest.mock('turndown', () => {
  return jest.fn().mockImplementation(() => ({
    turndown: jest.fn((html: string) => html.replace(/<[^>]*>/g, '')),
    addRule: jest.fn(),
  }))
})

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  FONT_STYLES: {
    fontFamily: 'monospace',
    fontWeight: {
      medium: 500,
    },
  },
  TIMING: {
    delay: {
      toolbarShow: 300,
    },
  },
  SPACING: {
    toolbarOffset: 40,
  },
}))

describe('TextSelectionToolbar Component', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Test Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render with dark mode', () => {
      render(
        <TextSelectionToolbar isDarkMode={true}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render with light mode', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should not show toolbar initially', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.queryByText('Ask/write')).not.toBeInTheDocument()
      expect(screen.queryByText('Move to canvas')).not.toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should accept onAskWrite callback', () => {
      const handleAskWrite = jest.fn()
      render(
        <TextSelectionToolbar isDarkMode={false} onAskWrite={handleAskWrite}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept onMoveToCanvas callback', () => {
      const handleMoveToCanvas = jest.fn()
      render(
        <TextSelectionToolbar isDarkMode={false} onMoveToCanvas={handleMoveToCanvas}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should accept both callbacks', () => {
      const handleAskWrite = jest.fn()
      const handleMoveToCanvas = jest.fn()
      render(
        <TextSelectionToolbar
          isDarkMode={false}
          onAskWrite={handleAskWrite}
          onMoveToCanvas={handleMoveToCanvas}
        >
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Container Structure', () => {
    it('should have relative positioning', () => {
      const { container } = render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('relative')
    })

    it('should render children inside container', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div data-testid="child">Child Content</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('Multiple Children', () => {
    it('should render multiple children', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('First Child')).toBeInTheDocument()
      expect(screen.getByText('Second Child')).toBeInTheDocument()
      expect(screen.getByText('Third Child')).toBeInTheDocument()
    })

    it('should render nested children', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>
            <span>Nested Content</span>
          </div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Nested Content')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content</div>
        </TextSelectionToolbar>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle theme switching', () => {
      const { rerender } = render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content</div>
        </TextSelectionToolbar>
      )

      rerender(
        <TextSelectionToolbar isDarkMode={true}>
          <div>Content</div>
        </TextSelectionToolbar>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle content updates', () => {
      const { rerender } = render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Initial Content</div>
        </TextSelectionToolbar>
      )

      expect(screen.getByText('Initial Content')).toBeInTheDocument()

      rerender(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Updated Content</div>
        </TextSelectionToolbar>
      )

      expect(screen.getByText('Updated Content')).toBeInTheDocument()
      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div></div>
        </TextSelectionToolbar>
      )
      const { container } = render(
        <TextSelectionToolbar isDarkMode={false}>
          <div></div>
        </TextSelectionToolbar>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle missing callbacks gracefully', () => {
      render(
        <TextSelectionToolbar isDarkMode={false}>
          <div>Content without callbacks</div>
        </TextSelectionToolbar>
      )
      expect(screen.getByText('Content without callbacks')).toBeInTheDocument()
    })
  })
})
