import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical, ArrowLeft, Plus, Filter, AlertTriangle,
  CheckCircle2, Clock, FileText, Download, Printer, Search,
  Stethoscope, Activity, Eye, ChevronRight, X, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const categoryIcons = {
  BLOOD: FlaskConical,
  IMAGING: Activity,
  URINE: FlaskConical,
  PATHOLOGY: FileText,
  CARDIAC: Activity,
  OTHER: FileText,
};

const statusConfig = {
  ORDERED: { label: 'Test Ordered', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  SAMPLE_COLLECTED: { label: 'Sample Collected', bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' },
  COMPLETED: { label: 'Results Ready', bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  REVIEWED: { label: 'Doctor Reviewed', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
};

const flagConfig = {
  NORMAL: { label: 'Normal Limits', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  HIGH: { label: 'Elevated / High', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  LOW: { label: 'Below Normal / Low', bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.25)' },
  CRITICAL: { label: 'Critical Alert', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' },
};

const PatientLabReports = () => {
  const { user } = useAuth();
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Upload modal form state
  const [formTestName, setFormTestName] = useState('');
  const [formCategory, setFormCategory] = useState('BLOOD');
  const [formInstructions, setFormInstructions] = useState('');
  const [formResultsSummary, setFormResultsSummary] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [savingUpload, setSavingUpload] = useState(false);

  const loadLabTests = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getLabTests();
      setLabTests(data);
    } catch (err) {
      console.error('Failed to load lab tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabTests();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formTestName.trim()) return;

    setSavingUpload(true);
    try {
      await appointmentsService.createLabTest({
        test_name: formTestName.trim(),
        category: formCategory,
        instructions: formInstructions.trim(),
        results_summary: formResultsSummary.trim(),
        file_name: formFileName.trim() || 'External_Lab_Report.pdf',
        status: formResultsSummary.trim() ? 'COMPLETED' : 'ORDERED',
        abnormal_flag: 'NORMAL',
      });
      setShowUploadModal(false);
      setFormTestName('');
      setFormInstructions('');
      setFormResultsSummary('');
      setFormFileName('');
      loadLabTests();
    } catch (err) {
      console.error('Upload lab test failed:', err);
      alert('Failed to register lab test.');
    } finally {
      setSavingUpload(false);
    }
  };

  const handlePrint = (report) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>MediFlow Lab Diagnostic Report - ${report.test_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            h1 { color: #0284c7; margin: 0 0 4px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; background: #e0f2fe; color: #0369a1; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td, th { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>MediFlow Clinical Diagnostic Report</h1>
              <p>Certified Laboratory & Diagnostic Services</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Patient:</strong> ${user?.full_name}</p>
              <p><strong>Date:</strong> ${new Date(report.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="section">
            <span class="badge">${report.category}</span>
            <h2 style="margin: 8px 0;">${report.test_name}</h2>
            <p><strong>Status:</strong> ${report.status} | <strong>Classification:</strong> ${report.abnormal_flag}</p>
          </div>
          <div class="section">
            <div class="section-title">Clinical Findings & Results Summary</div>
            <div class="box">${report.results_summary || 'Analysis pending completion.'}</div>
          </div>
          ${report.doctor_notes ? `
          <div class="section">
            <div class="section-title">Physician Clinical Interpretation</div>
            <div class="box" style="border-left: 4px solid #10b981;">${report.doctor_notes}</div>
          </div>
          ` : ''}
          <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Confidential medical record generated via MediFlow Telehealth & Clinical Workspace.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Filter list
  const filtered = labTests.filter((t) => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesSearch = !searchQuery.trim() ||
      t.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = labTests.length;
  const pendingCount = labTests.filter(t => t.status === 'ORDERED' || t.status === 'SAMPLE_COLLECTED').length;
  const completedCount = labTests.filter(t => t.status === 'COMPLETED' || t.status === 'REVIEWED').length;
  const abnormalCount = labTests.filter(t => t.abnormal_flag === 'HIGH' || t.abnormal_flag === 'LOW' || t.abnormal_flag === 'CRITICAL').length;

  return (
    <div className="patient-portal-page">
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/patient"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'grid', placeItems: 'center', color: '#10b981',
            }}>
              <FlaskConical size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Lab & Diagnostic Test Reports
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                View doctor requisition orders, lab findings, and physician interpretations
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '0.86rem', fontWeight: 700,
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
            }}
          >
            <Plus size={16} /> Upload / Record Lab Test
          </button>
          <PatientAvatarMenu />
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '18px 20px', borderRadius: '16px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
            display: 'grid', placeItems: 'center',
          }}>
            <FlaskConical size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{totalCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Requisitions</div>
          </div>
        </div>

        <div style={{
          padding: '18px 20px', borderRadius: '16px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
            display: 'grid', placeItems: 'center',
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Samples / Results</div>
          </div>
        </div>

        <div style={{
          padding: '18px 20px', borderRadius: '16px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
            display: 'grid', placeItems: 'center',
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{completedCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Results Ready & Reviewed</div>
          </div>
        </div>

        <div style={{
          padding: '18px 20px', borderRadius: '16px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: abnormalCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: abnormalCount > 0 ? '#ef4444' : '#10b981',
            display: 'grid', placeItems: 'center',
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{abnormalCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Abnormal / Alerts Flagged</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'All Tests' },
            { id: 'ORDERED', label: 'Ordered' },
            { id: 'SAMPLE_COLLECTED', label: 'Sample Taken' },
            { id: 'COMPLETED', label: 'Results Ready' },
            { id: 'REVIEWED', label: 'Doctor Reviewed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '7px 14px', borderRadius: '10px',
                border: filterStatus === tab.id ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--border-subtle)',
                background: filterStatus === tab.id ? 'rgba(14, 165, 233, 0.12)' : 'var(--surface-hover)',
                color: filterStatus === tab.id ? '#0ea5e9' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
          padding: '6px 12px', borderRadius: '10px', minWidth: '240px',
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search test name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              color: 'var(--text-main)', fontSize: '0.85rem', width: '100%',
            }}
          />
        </div>
      </div>

      {/* Lab Tests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading diagnostic reports...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', borderRadius: '20px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
        }}>
          <FlaskConical size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3 style={{ margin: 0, color: 'var(--heading-color)', fontSize: '1.1rem' }}>No diagnostic test records found</h3>
          <p style={{ margin: '6px 0 16px', fontSize: '0.86rem' }}>
            When your doctor orders blood tests or radiology, they will appear here with instant results tracking.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '8px 18px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
            }}
          >
            + Add Outside Lab Record
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((test) => {
            const CatIcon = categoryIcons[test.category] || FlaskConical;
            const sc = statusConfig[test.status] || statusConfig.ORDERED;
            const fc = flagConfig[test.abnormal_flag] || flagConfig.NORMAL;

            return (
              <div
                key={test.id}
                style={{
                  background: 'var(--bg-glass-card)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-subtle)',
                  padding: '20px',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <CatIcon size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                        {test.test_name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>Category: <strong>{test.category}</strong></span>
                        <span>•</span>
                        <span>Date: <strong>{new Date(test.created_at).toLocaleDateString()}</strong></span>
                        {test.doctor_details && (
                          <>
                            <span>•</span>
                            <span>Ordered by: <strong>Dr. {test.doctor_details.full_name}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status Badge */}
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px',
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      fontSize: '0.78rem', fontWeight: 800,
                    }}>
                      {sc.label}
                    </span>

                    {/* Flag Badge */}
                    {test.results_summary && (
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px',
                        background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`,
                        fontSize: '0.78rem', fontWeight: 800,
                      }}>
                        {fc.label}
                      </span>
                    )}

                    {/* Print Button */}
                    <button
                      onClick={() => handlePrint(test)}
                      title="Print or save as PDF"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', borderRadius: '10px',
                        background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      }}
                    >
                      <Printer size={13} /> Print Report
                    </button>
                  </div>
                </div>

                {/* Pre-test instructions */}
                {test.instructions && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '0.82rem', color: '#f59e0b', marginBottom: '12px',
                  }}>
                    <strong>Patient Instructions:</strong> {test.instructions}
                  </div>
                )}

                {/* Results Section */}
                {test.results_summary ? (
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                    marginBottom: '10px',
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Diagnostic Results & Metrics
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {test.results_summary}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                    Results are currently being processed by the clinical laboratory.
                  </div>
                )}

                {/* Doctor's interpretation */}
                {test.doctor_notes && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}>
                    <Stethoscope size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Physician Review Note
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {test.doctor_notes}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Upload / Record Lab Test */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'grid', placeItems: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '540px',
            width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(30px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                  display: 'grid', placeItems: 'center',
                }}>
                  <FlaskConical size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Record Lab or Diagnostic Test
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Test Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC) or Lipid Panel"
                  required
                  value={formTestName}
                  onChange={(e) => setFormTestName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="BLOOD">Blood Test</option>
                    <option value="IMAGING">Radiology / Imaging</option>
                    <option value="URINE">Urinalysis</option>
                    <option value="PATHOLOGY">Pathology / Biopsy</option>
                    <option value="CARDIAC">Cardiac Diagnostic</option>
                    <option value="OTHER">Other Diagnostic</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Document / Report File Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quest_Lipid_Oct2026.pdf"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Preparation / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting 10 hours prior to test"
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Results Summary & Values (Optional if already received)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Total Cholesterol: 185 mg/dL (Normal <200), HDL: 55 mg/dL, LDL: 105 mg/dL"
                  value={formResultsSummary}
                  onChange={(e) => setFormResultsSummary(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUpload || !formTestName.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#fff', cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  {savingUpload ? 'Saving...' : 'Save Lab Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLabReports;
