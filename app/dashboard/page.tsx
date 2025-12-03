'use client'

import { Header } from '@/components/layout/Header'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart'
import { useDashboardSummary, useUpcomingFollowUps } from '@/hooks/useMockQueries'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: followUps, isLoading: followUpsLoading } = useUpcomingFollowUps()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" breadcrumb={['Home', 'Dashboard']} />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Hotels"
            value={summary?.totalHotels || 0}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <KpiCard
            title="New / Not Contacted"
            value={summary?.newHotels || 0}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            title="Interested + Demo Booked"
            value={summary?.interestedHotels || 0}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            title="Signed Contracts"
            value={summary?.signedHotels || 0}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h2>
            {summaryLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : summary ? (
              <StatusDistributionChart data={summary.statusDistribution} />
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </div>

          {/* Region + Status Matrix */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Region & Status Matrix</h2>
            {summaryLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : summary ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Region</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700">New</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700">Calling</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700">Interested</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-700">Signed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.regionStatusMatrix).map(([region, statuses]) => (
                      <tr key={region} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium text-gray-900">{region}</td>
                        <td className="text-center py-2 px-2 text-gray-600">{statuses.NEW}</td>
                        <td className="text-center py-2 px-2 text-gray-600">{statuses.CALLING}</td>
                        <td className="text-center py-2 px-2 text-gray-600">
                          {statuses.INTERESTED + statuses.DEMO_BOOKED}
                        </td>
                        <td className="text-center py-2 px-2 text-gray-600">{statuses.SIGNED}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Follow-ups</h2>
          {followUpsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : followUps && followUps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow-up Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {followUps.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {hotel.hotelName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{hotel.region}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {hotel.assignee || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={hotel.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {hotel.nextFollowUpDate
                          ? format(new Date(hotel.nextFollowUpDate), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <Link href={`/hotels?id=${hotel.id}`}>
                          <Button size="sm" variant="primary">
                            Call now
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No upcoming follow-ups</div>
          )}
        </div>
      </div>
    </div>
  )
}





