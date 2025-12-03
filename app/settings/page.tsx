'use client'

import { Header } from '@/components/layout/Header'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" breadcrumb={['Home', 'Settings']} />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">Settings page - placeholder for future configuration options.</p>
        </div>
      </div>
    </div>
  )
}


