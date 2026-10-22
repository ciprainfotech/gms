import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { 
  FaBox, FaBoxes, FaPlus, FaSearch, FaEdit, FaTrashAlt, FaPrint, 
  FaExclamationTriangle, FaShieldAlt, FaChartLine, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import api from '../api/api';
import CustomToast, { ToastContainer } from '../components/CustomToast';
import ConfirmModal from '../components/ConfirmModal';
import '../App.css';
import '../assets/SaaSPremium.css'; // Premium UI

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const StockManagementPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Enforce Stock Validation Toggle State
  const [enforceStockValidation, setEnforceStockValidation] = useState(true);
  const [updatingValidation, setUpdatingValidation] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); 
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Mode: 'inventory' | 'valuation'
  const [viewMode, setViewMode] = useState('inventory');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (type, title, msg) => setToast({ type, title, msg });

  // Form State
  const [itemForm, setItemForm] = useState({
    id: null,
    name: '',
    partNo: '',
    type: 'Spare',
    unitPrice: '',
    stockQty: 0
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchItems();
    fetchGarageProfile();
  }, []);

  const fetchGarageProfile = async () => {
    try {
      const res = await api.get('/profile');
      if (res.data.success && res.data.garage) {
        setEnforceStockValidation(res.data.garage.enforce_stock_validation !== false);
      }
    } catch (err) {
      console.error('Error fetching garage profile:', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-items');
      if (res.data.success) setItems(res.data.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      showToast('error', 'Error', 'Failed to load master items.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleValidation = async (e) => {
    setUpdatingValidation(true);
    const newValue = e.target.checked;
    try {
      const res = await api.patch('/profile/stock-validation', { enforce_stock_validation: newValue });
      if (res.data.success) {
        setEnforceStockValidation(newValue);
        showToast('success', 'Constraint Updated', `Stock validation is now ${newValue ? 'ENABLED' : 'BYPASSED'}.`);
      }
    } catch (err) {
      console.error('Error updating stock validation:', err);
      showToast('error', 'Error', 'Failed to update stock validation setting.');
    } finally {
      setUpdatingValidation(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!itemForm.name.trim()) errors.name = 'Item name is required';
    if (!itemForm.unitPrice || Number(itemForm.unitPrice) <= 0) errors.unitPrice = 'Selling price must be greater than 0';
    if (itemForm.type === 'Spare' && Number(itemForm.stockQty) < 0) errors.stockQty = 'Stock cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: itemForm.name,
        partNo: itemForm.partNo,
        type: itemForm.type,
        unitPrice: Number(itemForm.unitPrice),
        stockQty: itemForm.type === 'Spare' ? Number(itemForm.stockQty) : null
      };

      if (itemForm.id) {
        const res = await api.put(`/master-items/${itemForm.id}`, payload);
        if (res.data.success) {
          showToast('success', 'Success', 'Item updated successfully.');
        }
      } else {
        const res = await api.post('/master-items', payload);
        if (res.data.success) {
          showToast('success', 'Success', 'Master item created successfully.');
        }
      }
      setShowItemModal(false);
      fetchItems();
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('error', 'Error', 'Failed to save item. Check if Part No already exists.');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await api.delete(`/master-items/${itemToDelete.id}`);
      if (res.data.success) {
        showToast('success', 'Deleted', 'Master item deleted successfully.');
        fetchItems();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('error', 'Error', 'Cannot delete item. It may be in use by bills or job sheets.');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.partNo || item.part_no || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'All' || item.type === filterType;
      return matchSearch && matchType;
    });
  }, [items, searchTerm, filterType]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  const summaryStats = useMemo(() => {
    let totalItems = items.length;
    let lowStock = items.filter(i => i.type === 'Spare' && Number(i.stockQty || i.stock_qty) <= 5).length;
    let totalCostValuation = 0;
    let totalSellValuation = 0;

    items.forEach(i => {
      if (i.type === 'Spare') {
        const qty = Number(i.stockQty ?? i.stock_qty) || 0;
        const cost = Number(i.costPrice ?? i.cost_price) || 0;
        const sell = Number(i.unitPrice ?? i.unit_price) || 0;
        totalCostValuation += (qty * cost);
        totalSellValuation += (qty * sell);
      }
    });

    return { totalItems, lowStock, totalCostValuation, totalSellValuation };
  }, [items]);

  return (
    <div className="p-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {toast && <ToastContainer toast={toast} onClose={() => setToast(null)} />}

      <div className="premium-page-header">
        <div>
          <h1 className="premium-page-title">Inventory & Master Items</h1>
          <p className="premium-page-subtitle">Manage your garage catalog, parts, labor services, and stock levels.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="premium-toggle-wrapper">
            <div className="d-flex flex-column text-end">
              <span className="fw-bold" style={{ fontSize: '0.8rem', color: enforceStockValidation ? '#10B981' : '#F59E0B' }}>
                {enforceStockValidation ? 'STRICT STOCK CHECK' : 'STOCK CHECK BYPASSED'}
              </span>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                {enforceStockValidation ? 'Blocks negative inventory' : 'Allows billing without stock'}
              </span>
            </div>
            <label className="premium-toggle">
              <input type="checkbox" checked={enforceStockValidation} onChange={handleToggleValidation} disabled={updatingValidation} />
              <span className="premium-toggle-slider"></span>
            </label>
          </div>
          
          <button className="premium-btn premium-btn-primary" onClick={() => {
            setItemForm({ id: null, name: '', partNo: '', type: 'Spare', unitPrice: '', stockQty: 0 });
            setFormErrors({});
            setShowItemModal(true);
          }}>
            <FaPlus /> Add New Item
          </button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <div className="premium-card text-center" style={{ padding: '20px' }}>
            <FaBoxes className="mb-2" style={{ color: 'var(--premium-primary)', fontSize: '24px' }} />
            <h3 className="fw-bold m-0 text-dark">{summaryStats.totalItems}</h3>
            <p className="text-muted small m-0 text-uppercase fw-semibold">Total Master Items</p>
          </div>
        </Col>
        <Col md={3}>
          <div className="premium-card text-center" style={{ padding: '20px' }}>
            <FaExclamationTriangle className="mb-2" style={{ color: 'var(--premium-danger)', fontSize: '24px' }} />
            <h3 className="fw-bold m-0 text-danger">{summaryStats.lowStock}</h3>
            <p className="text-muted small m-0 text-uppercase fw-semibold">Low Stock Items</p>
          </div>
        </Col>
        <Col md={3}>
          <div className="premium-card text-center" style={{ padding: '20px' }}>
            <FaChartLine className="mb-2" style={{ color: 'var(--premium-success)', fontSize: '24px' }} />
            <h3 className="fw-bold m-0 text-success">{formatCurrency(summaryStats.totalSellValuation)}</h3>
            <p className="text-muted small m-0 text-uppercase fw-semibold">Est. Sell Valuation</p>
          </div>
        </Col>
        <Col md={3}>
          <div className="premium-card text-center d-flex align-items-center justify-content-center" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => setViewMode(viewMode === 'inventory' ? 'valuation' : 'inventory')}>
            <div className="d-flex flex-column align-items-center gap-2">
              <FaPrint className="text-secondary" style={{ fontSize: '24px' }} />
              <span className="fw-bold text-primary text-uppercase" style={{ fontSize: '0.875rem' }}>
                {viewMode === 'inventory' ? 'View Valuation Report' : 'Back to Inventory'}
              </span>
            </div>
          </div>
        </Col>
      </Row>

      <div className="premium-card p-0">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <div className="premium-search-box" style={{ maxWidth: '350px' }}>
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search items or parts..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="d-flex gap-2">
            {['All', 'Spare', 'Service'].map(type => (
              <button 
                key={type} 
                onClick={() => { setFilterType(type); setCurrentPage(1); }}
                className={`premium-btn ${filterType === type ? 'premium-btn-primary' : 'premium-btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'inventory' ? (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Type</th>
                  <th className="text-end">Selling Price</th>
                  <th className="text-center">Stock</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map(item => {
                    const isSpare = item.type === 'Spare';
                    const qty = Number(item.stockQty ?? item.stock_qty) || 0;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-bold text-dark">{item.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>SKU: {item.partNo || item.part_no || 'N/A'}</div>
                        </td>
                        <td>
                          <span className={`premium-badge premium-badge-${isSpare ? 'primary' : 'neutral'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">{formatCurrency(item.unitPrice || item.unit_price)}</td>
                        <td className="text-center">
                          {isSpare ? (
                            <span className={`premium-badge premium-badge-${qty > 5 ? 'success' : qty > 0 ? 'warning' : 'danger'}`}>
                              {qty} in stock
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>&mdash;</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button className="premium-action-btn" onClick={() => {
                            setItemForm({
                              id: item.id,
                              name: item.name,
                              partNo: item.partNo || item.part_no || '',
                              type: item.type,
                              unitPrice: item.unitPrice || item.unit_price || '',
                              stockQty: qty
                            });
                            setFormErrors({});
                            setShowItemModal(true);
                          }}>
                            <FaEdit />
                          </button>
                          <button className="premium-action-btn delete" onClick={() => {
                            setItemToDelete(item);
                            setShowConfirmDelete(true);
                          }}>
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="premium-empty-state">
                        <FaBox className="premium-empty-icon" />
                        <h4 className="premium-empty-title">No items found</h4>
                        <p className="premium-empty-desc">We couldn't find any items matching your criteria. Try adjusting your search or add a new master item.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {!loading && filteredItems.length > 0 && (
              <div className="premium-pagination">
                <span className="premium-page-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} results
                </span>
                <div className="premium-page-controls">
                  <button className="premium-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaChevronLeft /></button>
                  <button className="premium-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaChevronRight /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="table-responsive p-4">
            <table className="premium-table" style={{ border: '1px solid var(--premium-border)', borderRadius: 'var(--radius-lg)' }}>
              <thead className="bg-light">
                <tr>
                  <th>Item Name</th>
                  <th>Part No</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Cost</th>
                  <th className="text-end">Sell Price</th>
                  <th className="text-end">Total Valuation</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i => i.type === 'Spare').map(item => {
                  const qty = Number(item.stockQty ?? item.stock_qty) || 0;
                  const cost = Number(item.costPrice ?? item.cost_price) || 0;
                  const sell = Number(item.unitPrice ?? item.unit_price) || 0;
                  return (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.name}</td>
                      <td className="text-muted">{item.partNo || item.part_no || 'N/A'}</td>
                      <td className="text-center fw-bold">{qty}</td>
                      <td className="text-end">{formatCurrency(cost)}</td>
                      <td className="text-end">{formatCurrency(sell)}</td>
                      <td className="text-end fw-bold text-success">{formatCurrency(qty * sell)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered dialogClassName="premium-modal" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{itemForm.id ? 'Edit Master Item' : 'Create Master Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveItem}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <div className="premium-form-group">
                  <label className="premium-label">Item Name *</label>
                  <input type="text" className="premium-input" placeholder="e.g. Engine Oil 5W30" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                  {formErrors.name && <span className="premium-error-text">{formErrors.name}</span>}
                </div>
              </Col>
              <Col md={4}>
                <div className="premium-form-group">
                  <label className="premium-label">SKU / Part No</label>
                  <input type="text" className="premium-input" placeholder="e.g. MGP-9900" value={itemForm.partNo} onChange={e => setItemForm({...itemForm, partNo: e.target.value})} />
                </div>
              </Col>
              <Col md={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Item Type</label>
                  <select className="premium-select" value={itemForm.type} onChange={e => setItemForm({...itemForm, type: e.target.value})}>
                    <option value="Spare">Spare Part (Tracks Live Quantity)</option>
                    <option value="Service">Labor Service (No Quantity Limit)</option>
                  </select>
                </div>
              </Col>
              <Col md={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Selling Price (₹) *</label>
                  <input type="number" step="0.01" className="premium-input" placeholder="0.00" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: e.target.value})} />
                  {formErrors.unitPrice && <span className="premium-error-text">{formErrors.unitPrice}</span>}
                </div>
              </Col>
              {itemForm.type === 'Spare' && (
                <Col md={6}>
                  <div className="premium-form-group">
                    <label className="premium-label">Master Stock Quantity</label>
                    <input type="number" step="1" className="premium-input" style={{ borderColor: 'var(--premium-primary)', backgroundColor: 'var(--premium-primary-light)' }} value={itemForm.stockQty} onChange={e => setItemForm({...itemForm, stockQty: e.target.value})} />
                    {formErrors.stockQty && <span className="premium-error-text">{formErrors.stockQty}</span>}
                  </div>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
            <button type="submit" className="premium-btn premium-btn-primary">{itemForm.id ? 'Save Changes' : 'Create Item'}</button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} onConfirm={confirmDelete} title="Delete Item" message={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`} confirmText="Delete Item" confirmVariant="danger" />
    </div>
  );
};

export default StockManagementPage;
