'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('colors')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f0' }}>
      {/* Header */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#f8f6f0' }}>
        <div className="px-8 py-6">
          <h1 className="heading-1 mb-2">
            SENSAI Design System
          </h1>
          <p className="text-lg text-gray-600">
            Complete style guide and component library
          </p>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-gray-200" style={{ backgroundColor: '#f8f6f0' }}>
          <nav className="p-6">
            <ul className="space-y-2">
              {[
                { id: 'colors', label: 'Colors' },
                { id: 'typography', label: 'Typography' },
                { id: 'components', label: 'Components' },
                { id: 'layout', label: 'Layout & Spacing' },
                { id: 'patterns', label: 'Design Patterns' }
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-600/5'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8" style={{ backgroundColor: '#f8f6f0' }}>
          {activeTab === 'colors' && <ColorsSection />}
          {activeTab === 'typography' && <TypographySection />}
          {activeTab === 'components' && <ComponentsSection />}
          {activeTab === 'layout' && <LayoutSection />}
          {activeTab === 'patterns' && <PatternsSection />}
        </main>
      </div>
    </div>
  )
}

function ColorsSection() {
  const colors = [
    {
      name: 'Primary Background',
      hex: '#e8e3d5',
      usage: 'Main background color for the interface',
      className: 'bg-primary'
    },
    {
      name: 'Light Background',
      hex: '#f8f6f0',
      usage: 'Secondary background, lighter variation',
      className: 'bg-light'
    },
    {
      name: 'Pure White',
      hex: '#ffffff',
      usage: 'Input fields, cards, contrast elements',
      className: 'bg-white'
    },
    {
      name: 'Pure Black',
      hex: '#000000',
      usage: 'Primary text, accent elements, active states',
      className: 'bg-blue-600'
    },
    {
      name: 'Gray 600',
      hex: '#6b7280',
      usage: 'Secondary text, labels',
      className: 'text-gray-600'
    },
    {
      name: 'Gray 400',
      hex: '#9ca3af',
      usage: 'Tertiary text, placeholders',
      className: 'text-gray-400'
    },
    {
      name: 'Gray 300',
      hex: '#d1d5db',
      usage: 'Borders, dividers',
      className: 'border-gray-300'
    },
    {
      name: 'Green Accent',
      hex: '#10b981',
      usage: 'Success states, active indicators',
      className: 'bg-green-500'
    }
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: color.hex }}
            ></div>
            <div className="p-4">
              <h3 className="font-semibold text-blue-600 mb-1">{color.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{color.hex.toUpperCase()}</p>
              <p className="text-xs text-gray-500 mb-2">{color.usage}</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{color.className}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypographySection() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Typography Scale</h2>
      
      <div className="space-y-8">
        {/* Logo Typography */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Brand Typography</h3>
          <div className="text-2xl font-semibold text-blue-600 mb-2">
            Fontshare<span className="text-xs align-super ml-0.5">™</span>
          </div>
          <p className="text-sm text-gray-600">Logo: font-semibold, 24px</p>
        </div>

        {/* Display Typography */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Display Typography</h3>
          <div className="space-y-4">
            <div>
              <div className="text-6xl font-bold text-blue-600 mb-2">100</div>
              <p className="text-sm text-gray-600">Display Large: font-bold, 60px</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Display Heading</div>
              <p className="text-sm text-gray-600">Display Medium: font-bold, 36px</p>
            </div>
          </div>
        </div>

        {/* Content Typography */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Content Typography</h3>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Heading 1</h1>
              <p className="text-sm text-gray-600">H1: font-bold, 30px</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-blue-600 mb-2">Heading 2</h2>
              <p className="text-sm text-gray-600">H2: font-semibold, 24px</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Heading 3</h3>
              <p className="text-sm text-gray-600">H3: font-semibold, 18px</p>
            </div>
            <div>
              <p className="text-base text-blue-600 mb-2">Body Text - Regular paragraph content for reading and general information.</p>
              <p className="text-sm text-gray-600">Body: font-normal, 16px</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 mb-2">Small Text - Labels, captions, and secondary information.</p>
              <p className="text-sm text-gray-600">Small: font-medium, 14px</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Extra Small - Fine print, metadata, and micro-copy.</p>
              <p className="text-sm text-gray-600">XS: font-medium, 12px</p>
            </div>
          </div>
        </div>

        {/* Font Preview Typography */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Font Preview Typography</h3>
          <div 
            className="font-black text-blue-600 leading-none tracking-tight mb-2" 
            style={{ 
              fontSize: '60px', 
              lineHeight: '0.8',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontWeight: '900'
            }}
          >
            Satoshi
          </div>
          <p className="text-sm text-gray-600">Font Preview: font-black, 60px, leading-none</p>
        </div>
      </div>
    </div>
  )
}

function ComponentsSection() {
  const [inputValue, setInputValue] = useState('')
  const [sliderValue, setSliderValue] = useState(60)

  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-600 mb-6">UI Components</h2>
      
      <div className="space-y-8">
        {/* Navigation Components */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Navigation</h3>
          
          {/* Main Navigation */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Primary Navigation</p>
            <nav className="flex items-center" style={{ backgroundColor: '#e8e3d5' }}>
              <div className="bg-blue-600 text-white px-8 py-4 flex flex-col items-center text-sm font-medium">
                <span className="mb-1">Fonts</span>
                <span className="text-xs">100</span>
              </div>
              <div className="px-8 py-4 text-sm font-medium text-blue-600 cursor-pointer flex flex-col items-center hover:bg-blue-600/5">
                <span className="mb-1">Pairs</span>
                <span className="text-xs text-gray-600">59</span>
              </div>
              <div className="px-8 py-4 text-sm font-medium text-blue-600 cursor-pointer hover:bg-blue-600/5">
                Licenses
              </div>
            </nav>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Tab Navigation</p>
            <div className="flex items-center space-x-6">
              <button className="text-sm font-medium text-gray-400 hover:text-blue-600">Cities</button>
              <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">Excerpts</button>
              <button className="text-sm font-medium text-gray-400 hover:text-blue-600">Names</button>
            </div>
          </div>

          {/* Hamburger Menu */}
          <div>
            <p className="text-sm text-gray-600 mb-3">Menu Icon</p>
            <div className="flex flex-col space-y-1.5 cursor-pointer w-fit p-2">
              <div className="w-7 h-0.5 bg-blue-600"></div>
              <div className="w-7 h-0.5 bg-blue-600"></div>
              <div className="w-7 h-0.5 bg-blue-600"></div>
            </div>
          </div>
        </div>

        {/* Input Components */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Form Controls</h3>
          
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Search Input</p>
              <div className="flex items-center space-x-3 bg-white px-4 py-2 border border-gray-300 w-fit">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="bg-transparent border-none outline-none text-sm placeholder-gray-400 w-32"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            </div>

            {/* Dropdown */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Dropdown Button</p>
              <button className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-300 text-sm font-medium text-blue-600 hover:bg-gray-50">
                <span>Categories</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Slider */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Slider Control</p>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">{sliderValue}px</span>
                <input 
                  type="range" 
                  min="8" 
                  max="300" 
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-32 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Button Components */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Buttons</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors">
                Primary Button
              </button>
              <button className="bg-white border border-gray-300 text-blue-600 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
                Secondary Button
              </button>
              <button className="text-blue-600 text-sm font-medium hover:underline">
                Text Button
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Status Indicators</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">Status Dots</p>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-gray-300 rounded-full bg-green-400"></div>
                <div className="w-4 h-4 border border-gray-300 rounded-full bg-blue-600"></div>
                <div className="w-4 h-4 border border-gray-300 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LayoutSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Layout & Spacing</h2>
      
      <div className="space-y-8">
        {/* Spacing Scale */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Spacing Scale</h3>
          <div className="space-y-4">
            {[
              { name: 'XS', value: '4px', className: 'p-1' },
              { name: 'SM', value: '8px', className: 'p-2' },
              { name: 'MD', value: '16px', className: 'p-4' },
              { name: 'LG', value: '24px', className: 'p-6' },
              { name: 'XL', value: '32px', className: 'p-8' },
              { name: '2XL', value: '48px', className: 'p-12' }
            ].map(space => (
              <div key={space.name} className="flex items-center space-x-4">
                <span className="w-12 text-sm font-medium">{space.name}</span>
                <span className="w-16 text-sm text-gray-600">{space.value}</span>
                <div className="bg-gray-100">
                  <div className={`bg-blue-600 ${space.className}`}></div>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{space.className}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Grid System */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Grid System</h3>
          <div className="grid grid-cols-12 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-gray-100 h-8 flex items-center justify-center text-xs">
                {i + 1}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">12-column grid with 16px gap</p>
        </div>

        {/* Container Widths */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Container Widths</h3>
          <div className="space-y-4">
            {[
              { name: 'Mobile', width: '100%', maxWidth: '640px' },
              { name: 'Tablet', width: '100%', maxWidth: '768px' },
              { name: 'Desktop', width: '100%', maxWidth: '1024px' },
              { name: 'Large', width: '100%', maxWidth: '1280px' }
            ].map(container => (
              <div key={container.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{container.name}</span>
                  <span className="text-gray-600">max-width: {container.maxWidth}</span>
                </div>
                <div className="bg-gray-100 h-4" style={{ maxWidth: container.maxWidth }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PatternsSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Design Patterns</h2>
      
      <div className="space-y-8">
        {/* Card Pattern */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Font Card Pattern</h3>
          <div className="border-b border-gray-300 py-8 px-4" style={{ backgroundColor: '#e8e3d5' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-medium text-blue-600">Satoshi</h2>
                <svg className="w-5 h-5 text-gray-300 cursor-pointer hover:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>10 styles</span>
                <span>Variable</span>
                <span>Open Source</span>
              </div>
            </div>
            <div className="mb-6">
              <div 
                className="font-black text-blue-600 leading-none tracking-tight" 
                style={{ 
                  fontSize: '60px', 
                  lineHeight: '0.8',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  fontWeight: '900'
                }}
              >
                Satoshi
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Designed by Indian Type Foundry
            </div>
          </div>
        </div>

        {/* Filter Pattern */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Filter Control Pattern</h3>
          <div className="space-y-4" style={{ backgroundColor: '#e8e3d5', padding: '24px' }}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white px-4 py-2 border border-gray-300">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm placeholder-gray-400 w-32" />
              </div>
              <button className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-300 text-sm font-medium text-blue-600 hover:bg-gray-50">
                <span>Categories</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Usage Guidelines</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Color Usage</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• Use cream background (#e8e3d5) for main interface areas</li>
                <li>• Black should be used sparingly for high contrast elements</li>
                <li>• White backgrounds for input fields and content cards</li>
                <li>• Green accents only for success states and active indicators</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Typography</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• Use font-black (900) only for large font previews</li>
                <li>• Maintain consistent line-height: 0.8 for displays, 1.5 for body</li>
                <li>• Always include proper spacing between text elements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Spacing</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• Use 8px grid system for consistent spacing</li>
                <li>• Cards should have 32px padding for comfortable reading</li>
                <li>• Maintain 24px spacing between major sections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}