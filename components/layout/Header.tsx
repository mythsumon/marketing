'use client'

import { useRegions } from '@/hooks/useRegions'

interface HeaderProps {
  title: string
  breadcrumb?: string[]
  showFilters?: boolean
  regionFilter?: string
  onRegionChange?: (region: string) => void
  showMyHotelsFilter?: boolean
  myHotelsOnly?: boolean
  onMyHotelsToggle?: (value: boolean) => void
  actionButton?: React.ReactNode
}

export function Header({
  title,
  breadcrumb,
  showFilters = false,
  regionFilter,
  onRegionChange,
  showMyHotelsFilter = false,
  myHotelsOnly,
  onMyHotelsToggle,
  actionButton,
}: HeaderProps) {
  const { data: regions } = useRegions()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="text-sm text-gray-500 mb-1">
              {breadcrumb.map((item, index) => (
                <span key={index}>
                  {index > 0 && ' / '}
                  {item}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showFilters && (
            <>
              {onRegionChange && (
                <select
                  value={regionFilter || ''}
                  onChange={(e) => onRegionChange(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Regions</option>
                  {regions?.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              )}

              {showMyHotelsFilter && onMyHotelsToggle && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={myHotelsOnly || false}
                    onChange={(e) => onMyHotelsToggle(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">My Hotels</span>
                </label>
              )}
            </>
          )}
          {actionButton}
        </div>
      </div>
    </header>
  )
}

