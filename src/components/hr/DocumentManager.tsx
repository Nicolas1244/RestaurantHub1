import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, Search, Filter, Eye, File, FilePlus, FolderPlus, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Document types
type DocumentCategory = 'contract' | 'payslip' | 'dpae' | 'other';

interface Document {
  id: string;
  employeeId: string;
  name: string;
  category: DocumentCategory;
  uploadDate: string;
  size: number;
  url: string;
  status?: 'pending' | 'signed' | 'rejected';
}

interface DocumentManagerProps {
  employeeId?: string; // Optional - if provided, only show documents for this employee
  restrictToEmployee?: boolean; // If true, user can only see their own documents
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  employeeId,
  restrictToEmployee = false
}) => {
  const { t, i18n } = useTranslation();
  const { currentRestaurant, getRestaurantEmployees } = useAppContext();
  const { profile, isManager } = useAuth();
  
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get employees
  const employees = currentRestaurant ? getRestaurantEmployees(currentRestaurant.id) : [];
  
  // Filter employees if employeeId is provided or restrictToEmployee is true
  const filteredEmployees = employeeId 
    ? employees.filter(e => e.id === employeeId)
    : restrictToEmployee && profile
      ? employees.filter(e => e.email === profile.email)
      : employees;

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would fetch documents from an API
        // For now, we'll generate mock data
        const mockDocuments = generateMockDocuments();
        setDocuments(mockDocuments);
        
        // Apply initial filters
        filterDocuments(mockDocuments, searchTerm, categoryFilter);
      } catch (error) {
        console.error('Failed to load documents:', error);
        toast.error(i18n.language === 'fr' 
          ? 'Échec du chargement des documents' 
          : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    
    loadDocuments();
  }, [employeeId, restrictToEmployee, profile]);

  // Generate mock documents
  const generateMockDocuments = (): Document[] => {
    const mockDocs: Document[] = [];
    
    filteredEmployees.forEach(employee => {
      // Contract
      mockDocs.push({
        id: `contract-${employee.id}`,
        employeeId: employee.id,
        name: `Contrat_${employee.contractType}_${employee.lastName}_${employee.firstName}.pdf`,
        category: 'contract',
        uploadDate: employee.startDate,
        size: 1024 * 1024 * 2.3, // 2.3 MB
        url: '#',
        status: 'signed'
      });
      
      // DPAE
      mockDocs.push({
        id: `dpae-${employee.id}`,
        employeeId: employee.id,
        name: `DPAE_${employee.lastName}_${employee.firstName}.pdf`,
        category: 'dpae',
        uploadDate: employee.startDate,
        size: 1024 * 512, // 512 KB
        url: '#',
        status: 'signed'
      });
      
      // Payslips (last 3 months)
      for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
        const year = date.getFullYear();
        
        mockDocs.push({
          id: `payslip-${employee.id}-${i}`,
          employeeId: employee.id,
          name: `Bulletin_${month}_${year}_${employee.lastName}_${employee.firstName}.pdf`,
          category: 'payslip',
          uploadDate: `${year}-${date.getMonth() + 1}-15`,
          size: 1024 * 1024 * 1.1, // 1.1 MB
          url: '#'
        });
      }
    });
    
    return mockDocs;
  };

  // Filter documents
  const filterDocuments = (
    docs: Document[], 
    search: string, 
    category: DocumentCategory | 'all'
  ) => {
    let filtered = docs;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        employees.find(e => e.id === doc.employeeId)?.firstName.toLowerCase().includes(searchLower) ||
        employees.find(e => e.id === doc.employeeId)?.lastName.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(doc => doc.category === category);
    }
    
    setFilteredDocuments(filtered);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterDocuments(documents, value, categoryFilter);
  };

  // Handle category filter
  const handleCategoryFilter = (category: DocumentCategory | 'all') => {
    setCategoryFilter(category);
    filterDocuments(documents, searchTerm, category);
  };

  // Handle document upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    clearInterval(interval);
    setUploadProgress(100);
    
    // Add new document to state
    const file = files[0];
    const newDoc: Document = {
      id: `new-${Date.now()}`,
      employeeId: employeeId || filteredEmployees[0]?.id || '',
      name: file.name,
      category: categoryFilter === 'all' ? 'other' : categoryFilter,
      uploadDate: new Date().toISOString().split('T')[0],
      size: file.size,
      url: '#',
      status: 'pending'
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    filterDocuments([newDoc, ...documents], searchTerm, categoryFilter);
    
    setShowUploadModal(false);
    toast.success(i18n.language === 'fr' 
      ? 'Document téléchargé avec succès' 
      : 'Document uploaded successfully');
  };

  // Handle document download
  const handleDownload = (doc: Document) => {
    // In a real implementation, this would download the document
    toast.success(i18n.language === 'fr' 
      ? 'Téléchargement du document démarré' 
      : 'Document download started');
  };

  // Handle document delete
  const handleDelete = (doc: Document) => {
    if (confirm(i18n.language === 'fr' 
      ? 'Êtes-vous sûr de vouloir supprimer ce document ?' 
      : 'Are you sure you want to delete this document?')) {
      
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      filterDocuments(documents.filter(d => d.id !== doc.id), searchTerm, categoryFilter);
      
      toast.success(i18n.language === 'fr' 
        ? 'Document supprimé avec succès' 
        : 'Document deleted successfully');
    }
  };

  // Handle document view
  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get employee name
  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  // Get category label
  const getCategoryLabel = (category: DocumentCategory): string => {
    switch (category) {
      case 'contract':
        return i18n.language === 'fr' ? 'Contrat' : 'Contract';
      case 'payslip':
        return i18n.language === 'fr' ? 'Bulletin de paie' : 'Payslip';
      case 'dpae':
        return 'DPAE';
      case 'other':
        return i18n.language === 'fr' ? 'Autre' : 'Other';
    }
  };

  // Get category color
  const getCategoryColor = (category: DocumentCategory): string => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800';
      case 'payslip':
        return 'bg-green-100 text-green-800';
      case 'dpae':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get document icon
  const getDocumentIcon = (doc: Document) => {
    switch (doc.category) {
      case 'contract':
        return <FileText size={16} className="text-blue-500" />;
      case 'payslip':
        return <FileText size={16} className="text-green-500" />;
      case 'dpae':
        return <FileText size={16} className="text-purple-500" />;
      case 'other':
        return <File size={16} className="text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {i18n.language === 'fr' ? 'En attente' : 'Pending'}
          </span>
        );
      case 'signed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {i18n.language === 'fr' ? 'Signé' : 'Signed'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {i18n.language === 'fr' ? 'Rejeté' : 'Rejected'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="text-blue-600 mr-3" size={24} />
            <h3 className="text-lg font-medium text-gray-800">
              {i18n.language === 'fr' ? 'Gestion des Documents' : 'Document Management'}
            </h3>
          </div>
          
          {/* Action buttons - only show if user is a manager or viewing their own documents */}
          {(isManager() || restrictToEmployee) && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowFolderModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FolderPlus size={16} className="mr-2" />
                {i18n.language === 'fr' ? 'Nouveau Dossier' : 'New Folder'}
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FilePlus size={16} className="mr-2" />
                {i18n.language === 'fr' ? 'Ajouter un Document' : 'Add Document'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={i18n.language === 'fr' ? 'Rechercher des documents...' : 'Search documents...'}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Category filter */}
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <div className="flex space-x-1">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  categoryFilter === 'all'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i18n.language === 'fr' ? 'Tous' : 'All'}
              </button>
              <button
                onClick={() => handleCategoryFilter('contract')}
                className={`px-3 py-1 text-sm rounded-md ${
                  categoryFilter === 'contract'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {i18n.language === 'fr' ? 'Contrats' : 'Contracts'}
              </button>
              <button
                onClick={() => handleCategoryFilter('payslip')}
                className={`px-3 py-1 text-sm rounded-md ${
                  categoryFilter === 'payslip'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {i18n.language === 'fr' ? 'Bulletins' : 'Payslips'}
              </button>
              <button
                onClick={() => handleCategoryFilter('dpae')}
                className={`px-3 py-1 text-sm rounded-md ${
                  categoryFilter === 'dpae'
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                DPAE
              </button>
              <button
                onClick={() => handleCategoryFilter('other')}
                className={`px-3 py-1 text-sm rounded-md ${
                  categoryFilter === 'other'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i18n.language === 'fr' ? 'Autres' : 'Others'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Document list */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Document' : 'Document'}
              </th>
              {!employeeId && !restrictToEmployee && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Catégorie' : 'Category'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Date' : 'Date'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Taille' : 'Size'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Statut' : 'Status'}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {i18n.language === 'fr' ? 'Actions' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={employeeId || restrictToEmployee ? 6 : 7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={employeeId || restrictToEmployee ? 6 : 7} className="px-6 py-4 text-center text-gray-500">
                  {i18n.language === 'fr' 
                    ? 'Aucun document trouvé' 
                    : 'No documents found'}
                </td>
              </tr>
            ) : (
              filteredDocuments.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getDocumentIcon(doc)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {doc.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  {!employeeId && !restrictToEmployee && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getEmployeeName(doc.employeeId)}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                      {getCategoryLabel(doc.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.uploadDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(doc.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(doc)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title={i18n.language === 'fr' ? 'Voir' : 'View'}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title={i18n.language === 'fr' ? 'Télécharger' : 'Download'}
                    >
                      <Download size={16} />
                    </button>
                    {(isManager() || restrictToEmployee) && (
                      <button
                        onClick={() => handleDelete(doc)}
                        className="text-red-600 hover:text-red-900"
                        title={i18n.language === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowUploadModal(false)} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>

              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {i18n.language === 'fr' ? 'Télécharger un Document' : 'Upload Document'}
              </h2>

              <div className="space-y-6">
                {/* Employee selection - only show if employeeId is not provided */}
                {!employeeId && !restrictToEmployee && (
                  <div>
                    <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                    </label>
                    <select
                      id="employee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Catégorie' : 'Category'}
                  </label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="contract">{i18n.language === 'fr' ? 'Contrat' : 'Contract'}</option>
                    <option value="payslip">{i18n.language === 'fr' ? 'Bulletin de paie' : 'Payslip'}</option>
                    <option value="dpae">DPAE</option>
                    <option value="other">{i18n.language === 'fr' ? 'Autre' : 'Other'}</option>
                  </select>
                </div>

                {/* Date selection */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Date du document' : 'Document Date'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Fichier' : 'File'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>{i18n.language === 'fr' ? 'Télécharger un fichier' : 'Upload a file'}</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={(e) => handleUpload(e.target.files)}
                          />
                        </label>
                        <p className="pl-1">{i18n.language === 'fr' ? 'ou glisser-déposer' : 'or drag and drop'}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG, GIF {i18n.language === 'fr' ? 'jusqu\'à' : 'up to'} 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload progress */}
                {uploadProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>{i18n.language === 'fr' ? 'Progression' : 'Progress'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput.files) {
                        handleUpload(fileInput.files);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {i18n.language === 'fr' ? 'Télécharger' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowViewModal(false)} />
            
            <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDocument.name}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="bg-gray-100 rounded-lg p-4 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      {i18n.language === 'fr' 
                        ? 'Aperçu du document non disponible' 
                        : 'Document preview not available'}
                    </p>
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Download size={16} className="mr-2" />
                      {i18n.language === 'fr' ? 'Télécharger' : 'Download'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Informations' : 'Information'}
                    </h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">{i18n.language === 'fr' ? 'Employé' : 'Employee'}</dt>
                        <dd className="text-sm text-gray-900">{getEmployeeName(selectedDocument.employeeId)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">{i18n.language === 'fr' ? 'Catégorie' : 'Category'}</dt>
                        <dd className="text-sm text-gray-900">{getCategoryLabel(selectedDocument.category)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">{i18n.language === 'fr' ? 'Date' : 'Date'}</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedDocument.uploadDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">{i18n.language === 'fr' ? 'Taille' : 'Size'}</dt>
                        <dd className="text-sm text-gray-900">{formatFileSize(selectedDocument.size)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Statut' : 'Status'}
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">
                          {i18n.language === 'fr' ? 'Statut actuel' : 'Current status'}
                        </span>
                        {getStatusBadge(selectedDocument.status)}
                      </div>
                      
                      {selectedDocument.status === 'pending' && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            {i18n.language === 'fr' ? 'Approuver' : 'Approve'}
                          </button>
                          <button
                            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            {i18n.language === 'fr' ? 'Rejeter' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {i18n.language === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowFolderModal(false)} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
              <button
                onClick={() => setShowFolderModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>

              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {i18n.language === 'fr' ? 'Créer un Nouveau Dossier' : 'Create New Folder'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Nom du dossier' : 'Folder Name'}
                  </label>
                  <input
                    type="text"
                    id="folderName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={i18n.language === 'fr' ? 'Entrez le nom du dossier' : 'Enter folder name'}
                  />
                </div>

                {/* Employee selection - only show if employeeId is not provided */}
                {!employeeId && !restrictToEmployee && (
                  <div>
                    <label htmlFor="folderEmployee" className="block text-sm font-medium text-gray-700 mb-1">
                      {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                    </label>
                    <select
                      id="folderEmployee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{i18n.language === 'fr' ? 'Tous les employés' : 'All employees'}</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category selection */}
                <div>
                  <label htmlFor="folderCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Catégorie' : 'Category'}
                  </label>
                  <select
                    id="folderCategory"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="contract">{i18n.language === 'fr' ? 'Contrats' : 'Contracts'}</option>
                    <option value="payslip">{i18n.language === 'fr' ? 'Bulletins de paie' : 'Payslips'}</option>
                    <option value="dpae">DPAE</option>
                    <option value="other">{i18n.language === 'fr' ? 'Autres' : 'Others'}</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(i18n.language === 'fr' 
                        ? 'Dossier créé avec succès' 
                        : 'Folder created successfully');
                      setShowFolderModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {i18n.language === 'fr' ? 'Créer' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;