import React, { useState, useEffect, useCallback } from 'react'
import {
  UploadCloud,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Database,
  Radio,
  Layers,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  HardDrive,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Alert from '../components/common/Alert'
import StatCard from '../components/feedback/StatCard'
import LoadingState from '../components/feedback/LoadingState'

export default function NetworkTrafficPage() {
  const { token } = useAuth()
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // Flows state
  const [flows, setFlows] = useState([])
  const [totalFlows, setTotalFlows] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingFlows, setLoadingFlows] = useState(false)

  // Filters
  const [sourceIp, setSourceIp] = useState('')
  const [destIp, setDestIp] = useState('')
  const [protocol, setProtocol] = useState('')
  const [labelFilter, setLabelFilter] = useState('')

  // Statistics
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  // Selected flow for modal
  const [selectedFlow, setSelectedFlow] = useState(null)

  // Fetch Statistics
  const fetchStatistics = useCallback(async () => {
    if (!token) return
    setLoadingStats(true)
    try {
      const res = await fetch(`${apiBase}/api/v1/network/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [apiBase, token])

  // Fetch Flows
  const fetchFlows = useCallback(async () => {
    if (!token) return
    setLoadingFlows(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      if (sourceIp) params.append('source_ip', sourceIp)
      if (destIp) params.append('destination_ip', destIp)
      if (protocol) params.append('protocol', protocol)
      if (labelFilter) params.append('label', labelFilter)

      const res = await fetch(`${apiBase}/api/v1/network/flows?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFlows(data.items || [])
        setTotalFlows(data.total || 0)
        setTotalPages(data.total_pages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch flows:', err)
    } finally {
      setLoadingFlows(false)
    }
  }, [apiBase, token, page, pageSize, sourceIp, destIp, protocol, labelFilter])

  useEffect(() => {
    fetchStatistics()
    fetchFlows()
  }, [fetchStatistics, fetchFlows])

  // Handle File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setUploadError(null)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch(`${apiBase}/api/v1/network/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed')
      }

      setUploadResult(data)
      setSelectedFile(null)
      // Refresh telemetry
      fetchStatistics()
      fetchFlows()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen flex flex-col bg-cyber-950 text-slate-100">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar className="hidden lg:flex" activeItem="traffic" />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cyber-800 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="info" dot size="sm">
                  PHASE 3 INGESTION ACTIVE
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  Schema: Canonical / CICIDS2017 / UNSW-NB15
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-100">
                Network Flow Telemetry Ingestion
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Ingest, inspect, filter, and analyze bi-directional network flow telemetry records stored in PostgreSQL.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={() => {
                  fetchStatistics()
                  fetchFlows()
                }}
              >
                Refresh Telemetry
              </Button>
            </div>
          </div>

          {/* Telemetry Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Ingested Flows"
              value={stats ? Number(stats.total_flows).toLocaleString() : '...'}
              threatLevel="low"
              subtitle="PostgreSQL telemetry rows"
              icon={Database}
            />
            <StatCard
              title="Total Packets"
              value={stats ? Number(stats.total_packets).toLocaleString() : '...'}
              threatLevel="low"
              subtitle="Aggregated flow count"
              icon={Activity}
            />
            <StatCard
              title="Total Data Volume"
              value={stats ? formatBytes(stats.total_bytes) : '...'}
              threatLevel="low"
              subtitle="Total bytes ingested"
              icon={HardDrive}
            />
            <StatCard
              title="Average Duration"
              value={stats ? `${(stats.avg_duration * 1000).toFixed(1)} ms` : '...'}
              threatLevel="medium"
              subtitle="Flow session latency"
              icon={Radio}
            />
          </div>

          {/* Dataset Upload Card */}
          <Card title="Ingest Network Traffic Dataset (CSV)" className="shadow-cyber">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-cyber-800 hover:border-cyan-500/60 rounded-xl p-6 text-center transition-colors bg-cyber-950/40">
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Select or drag a network flow CSV dataset
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: <strong>CICIDS2017</strong>, <strong>UNSW-NB15</strong>, or <strong>Canonical CSV</strong> (max 50 MB)
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="csv-file-input">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={FileText}
                      onClick={() => document.getElementById('csv-file-input')?.click()}
                    >
                      {selectedFile ? selectedFile.name : 'Choose CSV File...'}
                    </Button>
                  </label>

                  {selectedFile && (
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={uploading}
                      icon={UploadCloud}
                    >
                      Upload & Ingest into PostgreSQL
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Result Alerts */}
              {uploadResult && (
                <Alert
                  variant="success"
                  title={`Dataset Ingestion Succeeded: ${uploadResult.filename}`}
                  message={`Detected Schema: ${uploadResult.detected_format} • Processed in ${uploadResult.processing_time_seconds}s. Inserted ${uploadResult.inserted_rows} rows into PostgreSQL (skipped: ${uploadResult.skipped_rows}).`}
                  onClose={() => setUploadResult(null)}
                />
              )}

              {uploadError && (
                <Alert
                  variant="error"
                  title="Dataset Ingestion Error"
                  message={uploadError}
                  onClose={() => setUploadError(null)}
                />
              )}
            </form>
          </Card>

          {/* Filters Bar */}
          <Card title="Telemetry Search & Server-Side Filtering">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Source IP"
                placeholder="e.g. 192.168"
                icon={Search}
                value={sourceIp}
                onChange={(e) => {
                  setSourceIp(e.target.value)
                  setPage(1)
                }}
              />
              <Input
                label="Destination IP"
                placeholder="e.g. 10.0"
                icon={Search}
                value={destIp}
                onChange={(e) => {
                  setDestIp(e.target.value)
                  setPage(1)
                }}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Protocol</label>
                <select
                  value={protocol}
                  onChange={(e) => {
                    setProtocol(e.target.value)
                    setPage(1)
                  }}
                  className="block w-full rounded-lg bg-cyber-950/80 border border-cyber-800 text-slate-100 text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">All Protocols</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <Input
                label="Label / Attack"
                placeholder="e.g. DDoS or Normal"
                icon={Filter}
                value={labelFilter}
                onChange={(e) => {
                  setLabelFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </Card>

          {/* Network Flows Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <span>Ingested Flow Telemetry</span>
                <span className="text-cyan-400 font-mono font-bold">({totalFlows})</span>
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                Page {page} of {totalPages}
              </div>
            </div>

            <div className="w-full overflow-hidden rounded-xl border border-cyber-800 bg-cyber-900 shadow-cyber">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-cyber-800 bg-cyber-950/80 text-[11px] font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Source Socket</th>
                      <th className="px-4 py-3">Destination Socket</th>
                      <th className="px-4 py-3">Proto</th>
                      <th className="px-4 py-3 text-right">Duration (s)</th>
                      <th className="px-4 py-3 text-right">Packets</th>
                      <th className="px-4 py-3 text-right">Bytes</th>
                      <th className="px-4 py-3">Classification Label</th>
                      <th className="px-4 py-3 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-800/60">
                    {loadingFlows ? (
                      <tr>
                        <td colSpan={9} className="py-12">
                          <LoadingState variant="radar" text="Querying PostgreSQL flows buffer..." />
                        </td>
                      </tr>
                    ) : flows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                          No network flows match the selected filters. Upload a dataset or clear filters.
                        </td>
                      </tr>
                    ) : (
                      flows.map((flow) => (
                        <tr
                          key={flow.id}
                          className="hover:bg-cyan-950/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedFlow(flow)}
                        >
                          <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                            {new Date(flow.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2.5 text-slate-200">
                            {flow.source_ip}:{flow.source_port}
                          </td>
                          <td className="px-4 py-2.5 text-slate-200">
                            {flow.destination_ip}:{flow.destination_port}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-cyan-400">
                            {flow.protocol}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-300">
                            {flow.flow_duration.toFixed(3)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-300">
                            {Number(flow.packet_count).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-300">
                            {formatBytes(flow.byte_count)}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant={flow.label?.toLowerCase() === 'normal' ? 'low' : 'critical'}
                              size="sm"
                              dot
                            >
                              {flow.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFlow(flow)
                              }}
                              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyber-850"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-800 bg-cyber-950/60 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="rounded bg-cyber-900 border border-cyber-800 text-slate-200 px-2 py-1 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>flows per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-slate-300 px-2 font-mono">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronRight}
                    iconPosition="right"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Deep Inspection Modal */}
          {selectedFlow && (
            <Modal
              isOpen={!!selectedFlow}
              onClose={() => setSelectedFlow(null)}
              title={`Network Flow Inspection #${selectedFlow.id}`}
              description="Bi-directional telemetry header and rate analysis"
              size="lg"
              footer={
                <Button variant="secondary" size="sm" onClick={() => setSelectedFlow(null)}>
                  Close Inspection
                </Button>
              }
            >
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-cyber-950 rounded-lg border border-cyber-800">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Source Socket</span>
                    <span className="text-cyan-400 font-bold">{selectedFlow.source_ip}:{selectedFlow.source_port}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Destination Socket</span>
                    <span className="text-cyan-400 font-bold">{selectedFlow.destination_ip}:{selectedFlow.destination_port}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Transport Protocol</span>
                    <span className="text-slate-100 font-bold">{selectedFlow.protocol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Flow Duration</span>
                    <span className="text-slate-200">{selectedFlow.flow_duration} seconds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Packet Count</span>
                    <span className="text-slate-200">{Number(selectedFlow.packet_count).toLocaleString()} pkts</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Byte Count</span>
                    <span className="text-slate-200">{formatBytes(selectedFlow.byte_count)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Packet Rate</span>
                    <span className="text-slate-200">{selectedFlow.packet_rate} pkts/sec</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Byte Rate</span>
                    <span className="text-slate-200">{selectedFlow.byte_rate} bytes/sec</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Telemetry Label</span>
                    <Badge variant={selectedFlow.label === 'Normal' ? 'low' : 'critical'} size="sm">
                      {selectedFlow.label}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-cyber-950/60 rounded-lg border border-cyber-800 text-[11px] text-slate-400 font-sans">
                  <strong>Dataset Ingestion Source:</strong> {selectedFlow.dataset_source} • Captured at: {new Date(selectedFlow.timestamp).toISOString()}
                </div>
              </div>
            </Modal>
          )}
        </main>
      </div>
    </div>
  )
}
