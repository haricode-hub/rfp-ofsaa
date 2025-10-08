import { render, screen } from '@testing-library/react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div>{children}</div>
  }
})

// Mock remark and rehype plugins
jest.mock('remark-gfm', () => () => {})
jest.mock('rehype-raw', () => () => {})
jest.mock('rehype-sanitize', () => () => {})
jest.mock('rehype-highlight', () => () => {})

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  }
}))

describe('MarkdownRenderer Component', () => {
  it('should render plain text', () => {
    render(<MarkdownRenderer content="Hello World" isDarkMode={false} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should render with dark mode disabled', () => {
    render(<MarkdownRenderer content="Test content" isDarkMode={false} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render with dark mode enabled', () => {
    render(<MarkdownRenderer content="Dark mode test" isDarkMode={true} />)
    expect(screen.getByText('Dark mode test')).toBeInTheDocument()
  })

  it('should render empty content', () => {
    const { container } = render(<MarkdownRenderer content="" isDarkMode={false} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render markdown content', () => {
    render(<MarkdownRenderer content="# Heading\n\nParagraph text" isDarkMode={false} />)
    expect(screen.getByText(/Heading/)).toBeInTheDocument()
    expect(screen.getByText(/Paragraph text/)).toBeInTheDocument()
  })
})