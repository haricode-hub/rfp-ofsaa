import { render, screen } from '@testing-library/react'
import DocumentDisplay from '@/components/DocumentDisplay'

// Mock MarkdownRenderer
jest.mock('@/components/MarkdownRenderer', () => {
  return function MockMarkdownRenderer({ content }: { content: string }) {
    return <div data-testid="markdown-renderer">{content}</div>
  }
})

// Mock TextSelectionToolbar
jest.mock('@/components/TextSelectionToolbar', () => {
  return function MockTextSelectionToolbar({ children }: { children: React.ReactNode }) {
    return <div data-testid="text-selection-toolbar">{children}</div>
  }
})

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  FONT_STYLES: {
    fontFamily: 'monospace',
    fontWeight: {
      normal: 400,
    },
    fontSize: {
      base: '16px',
    },
    lineHeight: {
      relaxed: '1.6',
    },
  },
}))

describe('DocumentDisplay Component', () => {
  describe('Empty State', () => {
    it('should render empty state when no content', () => {
      render(<DocumentDisplay isDarkMode={false} content="" />)
      expect(screen.getByText('Upload a document to view its content here')).toBeInTheDocument()
    })

    it('should render empty state with dark mode styles', () => {
      const { container } = render(<DocumentDisplay isDarkMode={true} content="" />)
      const emptyDiv = container.querySelector('.text-zinc-400')
      expect(emptyDiv).toBeInTheDocument()
    })

    it('should render empty state with light mode styles', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="" />)
      const emptyDiv = container.querySelector('.text-gray-500')
      expect(emptyDiv).toBeInTheDocument()
    })

    it('should apply canvas minimized padding in empty state', () => {
      const { container } = render(
        <DocumentDisplay isDarkMode={false} content="" isCanvasMinimized={true} />
      )
      const contentDiv = container.querySelector('.px-20')
      expect(contentDiv).toBeInTheDocument()
    })

    it('should apply normal padding when canvas not minimized', () => {
      const { container } = render(
        <DocumentDisplay isDarkMode={false} content="" isCanvasMinimized={false} />
      )
      const contentDiv = container.querySelector('.px-6')
      expect(contentDiv).toBeInTheDocument()
    })
  })

  describe('Content Display', () => {
    it('should render content when provided', () => {
      render(<DocumentDisplay isDarkMode={false} content="# Test Content" />)
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
      expect(screen.getByText('# Test Content')).toBeInTheDocument()
    })

    it('should render MarkdownRenderer with content', () => {
      render(<DocumentDisplay isDarkMode={false} content="Test markdown content" />)
      const renderer = screen.getByTestId('markdown-renderer')
      expect(renderer).toHaveTextContent('Test markdown content')
    })

    it('should render TextSelectionToolbar', () => {
      render(<DocumentDisplay isDarkMode={false} content="Some content" />)
      expect(screen.getByTestId('text-selection-toolbar')).toBeInTheDocument()
    })

    it('should apply dark mode border styles', () => {
      const { container } = render(<DocumentDisplay isDarkMode={true} content="Content" />)
      const header = container.querySelector('.border-white\\/30')
      expect(header).toBeInTheDocument()
    })

    it('should apply light mode border styles', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="Content" />)
      const header = container.querySelector('.border-gray-300')
      expect(header).toBeInTheDocument()
    })

    it('should apply minimized canvas padding', () => {
      const { container } = render(
        <DocumentDisplay isDarkMode={false} content="Content" isCanvasMinimized={true} />
      )
      const contentDiv = container.querySelector('.px-20')
      expect(contentDiv).toBeInTheDocument()
    })

    it('should apply normal canvas padding', () => {
      const { container } = render(
        <DocumentDisplay isDarkMode={false} content="Content" isCanvasMinimized={false} />
      )
      const contentDiv = container.querySelector('.px-6')
      expect(contentDiv).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('should pass onAskWrite callback to TextSelectionToolbar', () => {
      const handleAskWrite = jest.fn()
      render(
        <DocumentDisplay
          isDarkMode={false}
          content="Content"
          onAskWrite={handleAskWrite}
        />
      )
      expect(screen.getByTestId('text-selection-toolbar')).toBeInTheDocument()
    })

    it('should pass onMoveToCanvas callback to TextSelectionToolbar', () => {
      const handleMoveToCanvas = jest.fn()
      render(
        <DocumentDisplay
          isDarkMode={false}
          content="Content"
          onMoveToCanvas={handleMoveToCanvas}
        />
      )
      expect(screen.getByTestId('text-selection-toolbar')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have flex layout', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="Content" />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('flex-1', 'flex', 'flex-col', 'h-full')
    })

    it('should have header separator', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="Content" />)
      const header = container.querySelector('.border-b-2')
      expect(header).toBeInTheDocument()
    })

    it('should have scrollable content area', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="Content" />)
      const scrollArea = container.querySelector('.overflow-y-auto')
      expect(scrollArea).toBeInTheDocument()
    })

    it('should apply prose styling', () => {
      const { container } = render(<DocumentDisplay isDarkMode={false} content="Content" />)
      const proseDiv = container.querySelector('.prose')
      expect(proseDiv).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should handle undefined isCanvasMinimized', () => {
      render(<DocumentDisplay isDarkMode={false} content="Content" />)
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
    })

    it('should handle undefined callbacks', () => {
      render(<DocumentDisplay isDarkMode={false} content="Content" />)
      expect(screen.getByTestId('text-selection-toolbar')).toBeInTheDocument()
    })

    it('should render with all props provided', () => {
      const handleAskWrite = jest.fn()
      const handleMoveToCanvas = jest.fn()

      render(
        <DocumentDisplay
          isDarkMode={true}
          content="Test Content"
          isCanvasMinimized={true}
          onAskWrite={handleAskWrite}
          onMoveToCanvas={handleMoveToCanvas}
        />
      )

      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('text-selection-toolbar')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle whitespace-only content as empty', () => {
      render(<DocumentDisplay isDarkMode={false} content="   " />)
      // Whitespace is considered valid content, so it should render
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
    })

    it('should handle long content', () => {
      const longContent = 'a'.repeat(10000)
      render(<DocumentDisplay isDarkMode={false} content={longContent} />)
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
    })

    it('should handle special characters in content', () => {
      const specialContent = '!@#$%^&*()[]{}|\\<>?/'
      render(<DocumentDisplay isDarkMode={false} content={specialContent} />)
      expect(screen.getByText(specialContent)).toBeInTheDocument()
    })

    it('should handle multiline content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3'
      render(<DocumentDisplay isDarkMode={false} content={multilineContent} />)
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
    })
  })
})
