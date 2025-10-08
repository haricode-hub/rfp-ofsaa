import { renderHook, act } from '@testing-library/react'
import { useHistory } from '@/hooks/useHistory'

describe('useHistory Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with initial value', () => {
      const { result } = renderHook(() => useHistory('initial'))

      expect(result.current.value).toBe('initial')
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it('should initialize with empty string', () => {
      const { result } = renderHook(() => useHistory(''))

      expect(result.current.value).toBe('')
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('Setting Values', () => {
    it('should add value to history after debounce', () => {
      const { result } = renderHook(() => useHistory(''))

      act(() => {
        result.current.set('first')
        jest.runAllTimers()
      })

      expect(result.current.value).toBe('first')
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('should add multiple values to history', () => {
      const { result } = renderHook(() => useHistory(''))

      act(() => {
        result.current.set('first')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('second')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('third')
        jest.runAllTimers()
      })

      expect(result.current.value).toBe('third')
      expect(result.current.canUndo).toBe(true)
    })
  })

  describe('Undo Functionality', () => {
    it('should undo to previous value', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.set('changed')
        jest.runAllTimers()
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.value).toBe('initial')
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(true)
    })

    it('should undo multiple times', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.set('first')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('second')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('third')
        jest.runAllTimers()
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.value).toBe('second')

      act(() => {
        result.current.undo()
      })

      expect(result.current.value).toBe('first')
    })
  })

  describe('Redo Functionality', () => {
    it('should redo after undo', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.set('changed')
        jest.runAllTimers()
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        result.current.redo()
      })

      expect(result.current.value).toBe('changed')
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('should clear redo history on new value', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.set('first')
        jest.runAllTimers()
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      act(() => {
        result.current.set('second')
        jest.runAllTimers()
      })

      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('History Navigation', () => {
    it('should maintain correct history order', () => {
      const { result } = renderHook(() => useHistory('0'))

      act(() => {
        result.current.set('1')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('2')
        jest.runAllTimers()
      })

      act(() => {
        result.current.set('3')
        jest.runAllTimers()
      })

      act(() => {
        result.current.undo()
        result.current.undo()
      })

      expect(result.current.value).toBe('1')

      act(() => {
        result.current.redo()
      })

      expect(result.current.value).toBe('2')
    })
  })

  describe('Edge Cases', () => {
    it('should not undo when at beginning of history', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.undo()
      })

      expect(result.current.value).toBe('initial')
      expect(result.current.canUndo).toBe(false)
    })

    it('should not redo when at end of history', () => {
      const { result } = renderHook(() => useHistory('initial'))

      act(() => {
        result.current.set('changed')
        jest.runAllTimers()
      })

      act(() => {
        result.current.redo()
      })

      expect(result.current.value).toBe('changed')
      expect(result.current.canRedo).toBe(false)
    })
  })
})
