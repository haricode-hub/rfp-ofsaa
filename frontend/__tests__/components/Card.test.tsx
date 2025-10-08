import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card'

describe('Card Component', () => {
  it('should render children', () => {
    render(<Card>Test Content</Card>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply gradient classes', () => {
    const { container } = render(<Card gradient="blue">Blue Card</Card>)
    expect(container.firstChild).toHaveClass('card-gradient-blue')
  })

  it('should apply hover classes by default', () => {
    const { container } = render(<Card>Hoverable Card</Card>)
    expect(container.firstChild).toHaveClass('card-hover')
  })

  it('should not apply hover classes when hover is false', () => {
    const { container } = render(<Card hover={false}>Non-hoverable Card</Card>)
    expect(container.firstChild).not.toHaveClass('card-hover')
  })

  it('should call onClick when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(<Card onClick={handleClick}>Clickable Card</Card>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should have button role when onClick is provided', () => {
    render(<Card onClick={jest.fn()}>Clickable Card</Card>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should not have button role when onClick is not provided', () => {
    const { container } = render(<Card>Non-clickable Card</Card>)
    expect(container.querySelector('[role="button"]')).not.toBeInTheDocument()
  })

  it('should have cursor-pointer class when onClick is provided', () => {
    const { container } = render(<Card onClick={jest.fn()}>Clickable</Card>)
    expect(container.firstChild).toHaveClass('cursor-pointer')
  })

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Custom Card</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should apply all gradient variants', () => {
    const gradients: Array<'blue' | 'green' | 'purple' | 'none'> = ['blue', 'green', 'purple', 'none']

    gradients.forEach(gradient => {
      const { container } = render(<Card gradient={gradient}>{gradient}</Card>)
      if (gradient !== 'none') {
        expect(container.firstChild).toHaveClass(`card-gradient-${gradient}`)
      }
    })
  })
})

describe('CardHeader Component', () => {
  it('should render children', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })

  it('should apply default padding classes', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    expect(container.firstChild).toHaveClass('p-6', 'pb-0')
  })

  it('should apply custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>)
    expect(container.firstChild).toHaveClass('custom-header')
  })
})

describe('CardContent Component', () => {
  it('should render children', () => {
    render(<CardContent>Content Text</CardContent>)
    expect(screen.getByText('Content Text')).toBeInTheDocument()
  })

  it('should apply default padding classes', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    expect(container.firstChild).toHaveClass('p-6')
  })

  it('should apply custom className', () => {
    const { container } = render(<CardContent className="custom-content">Content</CardContent>)
    expect(container.firstChild).toHaveClass('custom-content')
  })
})

describe('CardFooter Component', () => {
  it('should render children', () => {
    render(<CardFooter>Footer Content</CardFooter>)
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('should apply default padding classes', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    expect(container.firstChild).toHaveClass('p-6', 'pt-0')
  })

  it('should apply custom className', () => {
    const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>)
    expect(container.firstChild).toHaveClass('custom-footer')
  })
})

describe('Card Component Integration', () => {
  it('should render complete card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>Test Header</CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Header')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Test Footer')).toBeInTheDocument()
  })
})
