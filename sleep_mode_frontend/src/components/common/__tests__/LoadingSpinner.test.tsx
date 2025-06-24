import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render default loading spinner', () => {
      const { container } = render(<LoadingSpinner />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render with large size', () => {
      const { container } = render(<LoadingSpinner size="large" />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })

    it('should render small size', () => {
      const { container } = render(<LoadingSpinner size="small" />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should render medium size (default)', () => {
      const { container } = render(<LoadingSpinner size="medium" />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render with custom className on wrapper', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />)
      
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })

    it('should render with loading text when provided', () => {
      const { getByText } = render(<LoadingSpinner text="Loading data..." />)
      
      expect(getByText('Loading data...')).toBeInTheDocument()
    })

    it('should not render text when not provided', () => {
      const { container } = render(<LoadingSpinner />)
      
      const text = container.querySelector('p')
      expect(text).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const { container } = render(<LoadingSpinner />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveAttribute('role', 'status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('should have semantic structure', () => {
      const { container } = render(<LoadingSpinner text="Loading content" />)
      
      // Check wrapper has flex layout for centering
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })
  })

  describe('Visual variants', () => {
    it('should apply correct color classes', () => {
      const { container } = render(<LoadingSpinner />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('border-gray-200', 'border-t-primary-600')
    })

    it('should have consistent styling structure', () => {
      const { container } = render(<LoadingSpinner />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('border-2', 'rounded-full', 'animate-spin')
    })

    it('should render text with proper styling when provided', () => {
      const { container } = render(<LoadingSpinner text="Loading..." />)
      
      const text = container.querySelector('p')
      expect(text).toHaveClass('mt-2', 'text-sm', 'text-gray-600', 'dark:text-gray-400')
    })
  })

  describe('Integration scenarios', () => {
    it('should be usable in loading overlay scenarios', () => {
      const { container, getByText } = render(
        <div className="relative">
          <div>Content being loaded</div>
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <LoadingSpinner text="Processing..." />
          </div>
        </div>
      )
      
      expect(getByText('Processing...')).toBeInTheDocument()
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should work with conditional rendering', () => {
      const { container, rerender } = render(
        <div>
          {true && <LoadingSpinner />}
        </div>
      )
      
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
      
      rerender(
        <div>
          {false && <LoadingSpinner />}
        </div>
      )
      
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()
    })

    it('should combine custom className with default structure', () => {
      const { container } = render(<LoadingSpinner className="my-4 p-2" />)
      
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'my-4', 'p-2')
    })
  })
}) 