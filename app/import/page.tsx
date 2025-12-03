'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { useImportHotels } from '@/hooks/useMockQueries'
import { Hotel } from '@/lib/types'
import { getRegions } from '@/lib/mockData'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

type ImportStep = 1 | 2 | 3

type ColumnMapping = {
  hotelName?: string
  region?: string
  phone?: string
  email?: string
  website?: string
  address?: string
}

const systemFields = [
  { value: 'hotelName', label: 'Hotel Name' },
  { value: 'region', label: 'Region' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'address', label: 'Address' },
]

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>(1)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [fileData, setFileData] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number } | null>(null)

  const importMutation = useImportHotels()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    try {
      if (fileExtension === 'csv') {
        // Parse CSV file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const columns = Object.keys(results.data[0] as object)
              const data = results.data.map((row: any) => columns.map((col) => row[col] || ''))
              setFileColumns(columns)
              setFileData(data)
            } else {
              alert('CSV file appears to be empty or invalid')
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error)
            alert('Error parsing CSV file. Please check the file format.')
          },
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const arrayBuffer = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(arrayBuffer, { type: 'array' })
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            
            // Convert to JSON with header row
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][]
            
            if (jsonData.length === 0) {
              alert('Excel file appears to be empty')
              return
            }

            // First row is headers
            const columns = jsonData[0].map((col) => String(col || '').trim()).filter((col) => col)
            
            if (columns.length === 0) {
              alert('No column headers found in Excel file')
              return
            }

            // Rest are data rows
            const parsedData = jsonData.slice(1).map((row) => {
              // Ensure row has same length as columns
              const paddedRow = [...row]
              while (paddedRow.length < columns.length) {
                paddedRow.push('')
              }
              return paddedRow.slice(0, columns.length).map((cell) => String(cell || '').trim())
            }).filter((row) => row.some((cell) => cell)) // Remove completely empty rows

            setFileColumns(columns)
            setFileData(parsedData)
          } catch (error) {
            console.error('Excel parsing error:', error)
            alert('Error parsing Excel file. Please check the file format.')
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        alert('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Error reading file. Please try again.')
    }
  }

  const handleColumnNameChange = (index: number, newName: string) => {
    const updatedColumns = [...fileColumns]
    updatedColumns[index] = newName
    setFileColumns(updatedColumns)
    // Update mapping if column name changed
    const oldName = fileColumns[index]
    if (columnMapping[oldName]) {
      setColumnMapping((prev) => {
        const newMapping = { ...prev }
        newMapping[newName] = newMapping[oldName]
        delete newMapping[oldName]
        return newMapping
      })
    }
  }

  const handleAddColumn = () => {
    setFileColumns([...fileColumns, ''])
  }

  const handleRemoveColumn = (index: number) => {
    const columnName = fileColumns[index]
    const updatedColumns = fileColumns.filter((_, i) => i !== index)
    setFileColumns(updatedColumns)
    // Remove from mapping
    setColumnMapping((prev) => {
      const newMapping = { ...prev }
      delete newMapping[columnName]
      return newMapping
    })
    // Remove from data
    setFileData((prev) => prev.map((row) => row.filter((_, i) => i !== index)))
  }

  const handleMappingChange = (excelColumn: string, systemField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [excelColumn]: systemField.trim(),
    }))
  }

  const getSystemFieldSuggestions = (input: string) => {
    if (!input) return systemFields
    const lowerInput = input.toLowerCase()
    return systemFields.filter(
      (field) =>
        field.label.toLowerCase().includes(lowerInput) ||
        field.value.toLowerCase().includes(lowerInput)
    )
  }

  const handleImport = async () => {
    // Map the file data according to column mapping
    const mappedHotels: Partial<Hotel>[] = fileData.map((row) => {
      const hotel: Partial<Hotel> = {}
      fileColumns.forEach((excelCol, index) => {
        const systemField = columnMapping[excelCol]
        if (systemField && row[index]) {
          // Support both exact matches and custom typed fields
          if (systemField === 'hotelName' || systemField.toLowerCase() === 'hotelname' || systemField.toLowerCase() === 'hotel name') {
            hotel.hotelName = row[index] as string
          } else if (systemField === 'region' || systemField.toLowerCase() === 'city') {
            hotel.region = row[index] as string
          } else if (systemField === 'phone' || systemField.toLowerCase() === 'phone number' || systemField.toLowerCase() === 'phonenumber') {
            hotel.phone = row[index] as string
          } else if (systemField === 'email' || systemField.toLowerCase() === 'email address') {
            hotel.email = row[index] as string
          } else if (systemField === 'website' || systemField.toLowerCase() === 'website url' || systemField.toLowerCase() === 'websiteurl') {
            hotel.website = row[index] as string
          } else if (systemField === 'address' || systemField.toLowerCase() === 'full address' || systemField.toLowerCase() === 'fulladdress') {
            hotel.address = row[index] as string
          }
        }
      })
      return hotel
    })

    const result = await importMutation.mutateAsync(mappedHotels)
    setImportResult(result)
  }

  const resetWizard = () => {
    setStep(1)
    setFileName(null)
    setFileColumns([])
    setFileData([])
    setColumnMapping({})
    setUpdateExisting(false)
    setImportResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Import Hotels" breadcrumb={['Home', 'Import']} />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= stepNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    {stepNum === 1 && 'Upload'}
                    {stepNum === 2 && 'Map Columns'}
                    {stepNum === 3 && 'Review & Import'}
                  </span>
                </div>
                {stepNum < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step > stepNum ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 1: Upload Excel File</h2>
                <p className="text-sm text-gray-600">Upload your Excel file (.xlsx or .csv) containing hotel data.</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Excel (.xlsx) or CSV files</p>
                  </div>
                </label>
              </div>

              {fileName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium text-green-900">{fileName}</span>
                    </div>
                  </div>
                  
                  {fileColumns.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">File Column Titles (Edit if needed):</p>
                      <div className="space-y-2">
                        {fileColumns.map((col, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleColumnNameChange(index, e.target.value)}
                              placeholder={`Column ${index + 1}`}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            {fileColumns.length > 1 && (
                              <button
                                onClick={() => handleRemoveColumn(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Remove column"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        <Button onClick={handleAddColumn} size="sm" variant="outline" className="w-full">
                          + Add Column
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => fileName && fileColumns.length > 0 && setStep(2)} disabled={!fileName || fileColumns.length === 0}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 2: Map Columns</h2>
                <p className="text-sm text-gray-600">
                  Map your Excel columns to the system fields. Unmapped columns will be ignored.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        File Column Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Map to System Field (Type or select)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Suggestions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fileColumns.map((excelCol, index) => {
                      const currentMapping = columnMapping[excelCol] || ''
                      const suggestions = getSystemFieldSuggestions(currentMapping)
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={excelCol}
                              onChange={(e) => handleColumnNameChange(index, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="text"
                                value={currentMapping}
                                onChange={(e) => handleMappingChange(excelCol, e.target.value)}
                                placeholder="Type field name (e.g., hotelName, region)"
                                list={`suggestions-${index}`}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <datalist id={`suggestions-${index}`}>
                                {suggestions.map((field) => (
                                  <option key={field.value} value={field.value}>
                                    {field.label}
                                  </option>
                                ))}
                              </datalist>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {suggestions.slice(0, 3).map((field) => (
                                <button
                                  key={field.value}
                                  onClick={() => handleMappingChange(excelCol, field.value)}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                                >
                                  {field.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update-existing"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="update-existing" className="text-sm text-gray-700">
                  Update existing hotels if matched by (Hotel name + Region)
                </label>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={Object.values(columnMapping).filter((v) => v && (v.toLowerCase().includes('hotel') || v.toLowerCase().includes('name'))).length === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 3: Review & Import</h2>
                <p className="text-sm text-gray-600">Review the mapped data and confirm the import.</p>
              </div>

              {importResult ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Import Complete!</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-800">
                        <span className="font-medium">Created:</span> {importResult.created} hotels
                      </p>
                      <p className="text-green-800">
                        <span className="font-medium">Updated:</span> {importResult.updated} hotels
                      </p>
                      <p className="text-green-800">
                        <span className="font-medium">Skipped:</span> {importResult.skipped} duplicates
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={resetWizard}>Import Another File</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Preview (first 5 rows)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.entries(columnMapping)
                              .filter(([_, systemField]) => systemField)
                              .map(([excelCol, systemField]) => (
                                <th key={excelCol} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  {systemFields.find((f) => f.value === systemField)?.label || systemField}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {fileData.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.entries(columnMapping)
                                .filter(([_, systemField]) => systemField)
                                .map(([excelCol, systemField]) => {
                                  const colIndex = fileColumns.indexOf(excelCol)
                                  return (
                                    <td key={systemField} className="px-4 py-2 text-sm text-gray-900">
                                      {row[colIndex] || '-'}
                                    </td>
                                  )
                                })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Ready to import <strong>{fileData.length} hotels</strong>. Click the button below to
                      proceed.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={() => setStep(2)} variant="outline">
                      Back
                    </Button>
                    <Button onClick={handleImport} disabled={importMutation.isPending}>
                      {importMutation.isPending ? 'Importing...' : `Import ${fileData.length} hotels`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

