import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Shield, DollarSign, X, Loader, Eye, Trash2
} from 'lucide-react';
import { contractAPI } from './services/api';
import './App.css';

/**
 * Contract Intelligence Platform
 * Senior-level React application demonstrating:
 * - Clean component architecture
 * - Proper state management
 * - Error handling and loading states
 * - Professional UI/UX
 */

function App() {
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Load contracts and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsRes, statsRes] = await Promise.all([
        contractAPI.list(),
        contractAPI.getStats(),
      ]);

      if (contractsRes.ok) setContracts(contractsRes.data);
      if (statsRes.ok) setStats(statsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress(true);
      setError(null);

      const result = await contractAPI.upload(file);
      
      if (result.ok) {
        // Immediately start analysis
        await contractAPI.analyze(result.data._id);
        await loadData();
        alert('Contract uploaded and analysis started!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadProgress(false);
      e.target.value = '';
    }
  };

  const handleViewContract = async (contractId) => {
    try {
      setLoading(true);
      const result = await contractAPI.get(contractId);
      if (result.ok) {
        setSelectedContract(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return;
    }

    try {
      await contractAPI.delete(contractId);
      setSelectedContract(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Shield className="logo-icon" />
              <h1>Contract Intelligence Platform</h1>
            </div>
            <div className="upload-section">
              <label className="upload-btn">
                {uploadProgress ? (
                  <>
                    <Loader className="spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Contract
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  disabled={uploadProgress}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="container main-content">
        {/* Dashboard Stats */}
        {stats && (
          <div className="stats-grid">
            <StatCard
              icon={<FileText />}
              label="Total Contracts"
              value={stats.totalContracts}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle />}
              label="Analyzed"
              value={stats.analyzedContracts}
              color="green"
            />
            <StatCard
              icon={<AlertTriangle />}
              label="High Risk"
              value={stats.highRiskContracts}
              color="red"
            />
            <StatCard
              icon={<TrendingUp />}
              label="Avg Compliance"
              value={`${Math.round(stats.avgComplianceScore)}%`}
              color="purple"
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="content-grid">
          {/* Contracts List */}
          <div className="contracts-list">
            <h2>Contracts</h2>
            
            {loading && !selectedContract ? (
              <div className="loading">
                <Loader className="spin" size={40} />
                <p>Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="empty-state">
                <FileText size={60} />
                <h3>No contracts yet</h3>
                <p>Upload your first contract to get started</p>
              </div>
            ) : (
              contracts.map(contract => (
                <ContractCard
                  key={contract._id}
                  contract={contract}
                  onView={handleViewContract}
                  onDelete={handleDeleteContract}
                  isSelected={selectedContract?._id === contract._id}
                />
              ))
            )}
          </div>

          {/* Contract Details */}
          {selectedContract && (
            <ContractDetails
              contract={selectedContract}
              onClose={() => setSelectedContract(null)}
              onDelete={handleDeleteContract}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// Contract Card Component
function ContractCard({ contract, onView, onDelete, isSelected }) {
  const getRiskBadge = (level) => {
    const badges = {
      low: { class: 'badge-green', label: 'Low Risk' },
      medium: { class: 'badge-yellow', label: 'Medium Risk' },
      high: { class: 'badge-red', label: 'High Risk' },
      critical: { class: 'badge-dark-red', label: 'Critical Risk' },
    };
    return badges[level] || { class: 'badge-gray', label: 'Not Assessed' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-gray', label: 'Pending' },
      processing: { class: 'badge-blue', label: 'Processing' },
      analyzed: { class: 'badge-green', label: 'Analyzed' },
      failed: { class: 'badge-red', label: 'Failed' },
    };
    return badges[status] || { class: 'badge-gray', label: status };
  };

  const riskBadge = getRiskBadge(contract.riskLevel);
  const statusBadge = getStatusBadge(contract.status);

  return (
    <div className={`contract-card ${isSelected ? 'selected' : ''}`}>
      <div className="contract-header">
        <FileText size={20} />
        <h3>{contract.title}</h3>
      </div>
      
      <div className="contract-meta">
        <span className={`badge ${statusBadge.class}`}>
          {statusBadge.label}
        </span>
        {contract.riskLevel && (
          <span className={`badge ${riskBadge.class}`}>
            {riskBadge.label}
          </span>
        )}
      </div>

      {contract.complianceScore !== undefined && (
        <div className="compliance-bar">
          <div className="compliance-label">
            Compliance Score: {contract.complianceScore}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${contract.complianceScore}%` }}
            />
          </div>
        </div>
      )}

      <div className="contract-actions">
        <button 
          className="btn-secondary"
          onClick={() => onView(contract._id)}
        >
          <Eye size={16} />
          View Details
        </button>
        <button 
          className="btn-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(contract._id);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Contract Details Component
function ContractDetails({ contract, onClose, onDelete }) {
  return (
    <div className="contract-details">
      <div className="details-header">
        <h2>Contract Analysis</h2>
        <button className="btn-icon" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="details-content">
        {/* Basic Info */}
        <section className="details-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <InfoItem label="Title" value={contract.title} />
            <InfoItem label="File" value={contract.fileName} />
            <InfoItem label="Status" value={contract.status} />
            <InfoItem 
              label="Analyzed" 
              value={contract.aiAnalysisDate 
                ? new Date(contract.aiAnalysisDate).toLocaleDateString() 
                : 'Not yet'
              } 
            />
          </div>
        </section>

        {/* AI Confidence */}
        {contract.aiConfidenceScore !== undefined && (
          <section className="details-section">
            <h3>AI Analysis Confidence</h3>
            <div className="confidence-score">
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ width: `${contract.aiConfidenceScore * 100}%` }}
                />
              </div>
              <span>{Math.round(contract.aiConfidenceScore * 100)}%</span>
            </div>
          </section>
        )}

        {/* Parties */}
        {contract.parties && contract.parties.length > 0 && (
          <section className="details-section">
            <h3><FileText size={20} /> Parties</h3>
            <div className="list">
              {contract.parties.map((party, idx) => (
                <div key={idx} className="list-item">
                  <strong>{party.name}</strong>
                  <span className="badge badge-gray">{party.role}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Dates */}
        {contract.keyDates && contract.keyDates.length > 0 && (
          <section className="details-section">
            <h3><Clock size={20} /> Key Dates</h3>
            <div className="list">
              {contract.keyDates.map((date, idx) => (
                <div key={idx} className="list-item">
                  <div>
                    <strong>{date.dateType}</strong>
                    <p className="text-sm">{date.description}</p>
                  </div>
                  <span className="text-gray">
                    {new Date(date.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Financial Terms */}
        {contract.financialTerms && contract.financialTerms.length > 0 && (
          <section className="details-section">
            <h3><DollarSign size={20} /> Financial Terms</h3>
            <div className="list">
              {contract.financialTerms.map((term, idx) => (
                <div key={idx} className="list-item">
                  <div>
                    <strong>{term.type}</strong>
                    <p className="text-sm">{term.description}</p>
                  </div>
                  <span className="amount">
                    {term.currency} {term.amount?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Risk Assessment */}
        {contract.risks && contract.risks.length > 0 && (
          <section className="details-section">
            <h3><AlertTriangle size={20} /> Risk Assessment</h3>
            <div className="risk-level">
              Overall Risk Level: 
              <span className={`badge badge-${
                contract.riskLevel === 'low' ? 'green' :
                contract.riskLevel === 'medium' ? 'yellow' :
                contract.riskLevel === 'high' ? 'red' : 'dark-red'
              }`}>
                {contract.riskLevel?.toUpperCase()}
              </span>
            </div>
            <div className="list">
              {contract.risks.map((risk, idx) => (
                <div key={idx} className="risk-item">
                  <div className="risk-header">
                    <strong>{risk.category}</strong>
                    <span className={`badge badge-${
                      risk.severity === 'low' ? 'green' :
                      risk.severity === 'medium' ? 'yellow' :
                      risk.severity === 'high' ? 'red' : 'dark-red'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm">{risk.description}</p>
                  <p className="recommendation">
                    <strong>Recommendation:</strong> {risk.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compliance Issues */}
        {contract.complianceIssues && contract.complianceIssues.length > 0 && (
          <section className="details-section">
            <h3><CheckCircle size={20} /> Compliance Issues</h3>
            <div className="compliance-score-big">
              Score: {contract.complianceScore}/100
            </div>
            <div className="list">
              {contract.complianceIssues.map((issue, idx) => (
                <div key={idx} className="list-item">
                  <div>
                    <strong>{issue.standard}</strong>
                    <p className="text-sm">{issue.issue}</p>
                  </div>
                  <span className={`badge badge-${
                    issue.severity === 'low' ? 'green' :
                    issue.severity === 'medium' ? 'yellow' : 'red'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Analysis */}
        {contract.pricingAnalysis && (
          <section className="details-section">
            <h3><TrendingUp size={20} /> Pricing Analysis</h3>
            <div className="pricing-position">
              Market Position: 
              <span className={`badge badge-${
                contract.pricingAnalysis.marketPosition === 'favorable' ? 'green' :
                contract.pricingAnalysis.marketPosition === 'average' ? 'yellow' : 'red'
              }`}>
                {contract.pricingAnalysis.marketPosition?.toUpperCase()}
              </span>
            </div>
            {contract.pricingAnalysis.recommendations && (
              <div className="recommendations">
                <h4>Recommendations:</h4>
                <ul>
                  {contract.pricingAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Similar Contracts */}
        {contract.similarContracts && contract.similarContracts.length > 0 && (
          <section className="details-section">
            <h3><FileText size={20} /> Similar Contracts</h3>
            <div className="list">
              {contract.similarContracts.map((similar, idx) => (
                <div key={idx} className="list-item">
                  <div>
                    <strong>Contract {similar.contractId}</strong>
                    <p className="text-sm">
                      Matched: {similar.matchedFeatures?.join(', ')}
                    </p>
                  </div>
                  <span className="similarity">
                    {Math.round(similar.similarity * 100)}% similar
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Info Item Component
function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

export default App;