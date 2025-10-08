import { render, screen } from '@testing-library/react'
import MarkdownCanvas from '@/components/MarkdownCanvas'
import { createRef } from 'react'
import type { MarkdownCanvasRef } from '@/components/MarkdownCanvas'

// Mock MarkdownRenderer
jest.mock('@/components/MarkdownRenderer', () => {
  return function MockMarkdownRenderer({ content }: { content: string }) {
    return <div data-testid="markdown-renderer">{content}</div>
  }
})

// Mock useHistory hook
jest.mock('@/hooks/useHistory', () => ({
  useHistory: jest.fn((initialValue: string) => ({
    value: initialValue,
    set: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    reset: jest.fn(),
    canUndo: false,
    canRedo: false,
    getHistory: jest.fn(() => []),
    goToVersion: jest.fn(),
  })),
}))

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  FONT_STYLES: {
    fontFamily: 'monospace',
    fontWeight: {
      normal: 400,
      medium: 500,
    },
    fontSize: {
      base: '16px',
    },
    lineHeight: {
      relaxed: '1.6',
    },
  },
  TIMING: {
    delay: {
      autoPreview: 5000,
    },
    animation: {
      fast: 150,
      slow: 500,
    },
  },
}))

describe('MarkdownCanvas Component', () => {
  describe('Rendering', () => {
    it('should render textarea by default', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()
    })

    it('should render with dark mode styles', () => {
      render(<MarkdownCanvas isDarkMode={true} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('text-zinc-200')
    })

    it('should render with light mode styles', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('text-gray-900')
    })

    it('should have correct placeholder text', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()
    })

    it('should render as a textarea element', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea.tagName).toBe('TEXTAREA')
    })
  })

  describe('Props', () => {
    it('should accept isDarkMode prop', () => {
      const { rerender } = render(<MarkdownCanvas isDarkMode={false} />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()

      rerender(<MarkdownCanvas isDarkMode={true} />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()
    })

    it('should accept onStateChange callback', () => {
      const handleStateChange = jest.fn()
      render(<MarkdownCanvas isDarkMode={false} onStateChange={handleStateChange} />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()
    })

    it('should accept selectedTextToAdd prop', () => {
      render(<MarkdownCanvas isDarkMode={false} selectedTextToAdd="Test" />)
      expect(screen.getByPlaceholderText('Type or paste Markdown here...')).toBeInTheDocument()
    })
  })

  describe('Ref Interface', () => {
    it('should expose methods via ref', () => {
      const ref = createRef<MarkdownCanvasRef>()
      render(<MarkdownCanvas ref={ref} isDarkMode={false} />)

      expect(ref.current).toBeDefined()
      expect(typeof ref.current?.undo).toBe('function')
      expect(typeof ref.current?.redo).toBe('function')
      expect(typeof ref.current?.reset).toBe('function')
      expect(typeof ref.current?.getHistory).toBe('function')
      expect(typeof ref.current?.goToVersion).toBe('function')
    })

    it('should expose canUndo and canRedo via ref', () => {
      const ref = createRef<MarkdownCanvasRef>()
      render(<MarkdownCanvas ref={ref} isDarkMode={false} />)

      expect(ref.current).toBeDefined()
      expect(typeof ref.current?.canUndo).toBe('boolean')
      expect(typeof ref.current?.canRedo).toBe('boolean')
    })
  })

  describe('Styling', () => {
    it('should apply flex-1 class', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('flex-1')
    })

    it('should apply w-full class', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('w-full')
    })

    it('should apply resize-none class', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('resize-none')
    })

    it('should apply bg-transparent class', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('bg-transparent')
    })

    it('should apply focus:outline-none class', () => {
      render(<MarkdownCanvas isDarkMode={false} />)
      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('focus:outline-none')
    })
  })

  describe('Component Integration', () => {
    it('should render without crashing', () => {
      const { container } = render(<MarkdownCanvas isDarkMode={false} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle theme switching', () => {
      const { rerender } = render(<MarkdownCanvas isDarkMode={false} />)

      rerender(<MarkdownCanvas isDarkMode={true} />)

      const textarea = screen.getByPlaceholderText('Type or paste Markdown here...')
      expect(textarea).toHaveClass('text-zinc-200')
    })
  })
})
