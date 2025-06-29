import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { supabase, Client, Employee, uploadClientLogo, deleteClientLogo } from '../lib/supabase';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Alert from '../components/ui/Alert';
import { 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Building2,
  Camera,
  User,
  Mail,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  Copy,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Phone,
  MapPin
} from 'lucide-react';

// Reste du code sans changement...

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
}

function ClientManagement() {
  const { currentUser } = useData();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEmployees, setShowEmployees] = useState<{ [key: string]: boolean }>({});
  const [expandedClients, setExpandedClients] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: ''
  });
  
  // Gestion des employés multiples
  const [employeesList, setEmployeesList] = useState<EmployeeFormData[]>([
    { first_name: '', last_name: '', email: '' }
  ]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [singleEmployeeForm, setSingleEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // États pour les dialogues de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // État pour les alertes
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setAlert({ show: true, type, message, title });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        showAlert('error', 'Erreur lors du chargement des clients');
        return;
      }

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('last_name');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        showAlert('error', 'Erreur lors du chargement des employés');
        return;
      }

      // Combine data
      const clientsWithEmployees = (clientsData || []).map(client => ({
        ...client,
        employees: (employeesData || []).filter(emp => emp.client_id === client.id)
      }));

      setClients(clientsWithEmployees);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showAlert('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File, clientId?: string) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Veuillez sélectionner un fichier image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'La taille du fichier ne peut pas dépasser 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const tempId = clientId || `temp-${Date.now()}`;
      const logoUrl = await uploadClientLogo(file, tempId);
      
      if (logoUrl) {
        setFormData(prev => ({ ...prev, logo_url: logoUrl }));
        showAlert('success', 'Logo téléchargé avec succès');
      } else {
        showAlert('error', 'Erreur lors du téléchargement du logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showAlert('error', 'Erreur lors du téléchargement du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            description: formData.description || null,
            logo_url: formData.logo_url || null
          })
          .eq('id', editingClient.id);

        if (error) {
          console.error('Error updating client:', error);
          showAlert('error', 'Erreur lors de la mise à jour du client');
          return;
        }

        showAlert('success', 'Client mis à jour avec succès');
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            logo_url: formData.logo_url || null
          }]);

        if (error) {
          console.error('Error creating client:', error);
          showAlert('error', 'Erreur lors de la création du client');
          return;
        }

        showAlert('success', 'Client créé avec succès');
      }

      await fetchClients();
      resetClientForm();
    } catch (error) {
      console.error('Error saving client:', error);
      showAlert('error', 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEmployees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Valider que tous les employés ont au moins un nom et un email
    const validEmployees = employeesList.filter(emp => 
      emp.first_name.trim() && emp.last_name.trim() && emp.email.trim()
    );

    if (validEmployees.length === 0) {
      showAlert('warning', 'Veuillez remplir au moins un employé avec nom, prénom et email');
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données pour l'insertion
      const employeesToInsert = validEmployees.map(emp => ({
        client_id: selectedClient.id,
        first_name: emp.first_name.trim(),
        last_name: emp.last_name.trim(),
        email: emp.email.trim()
      }));

      const { error } = await supabase
        .from('employees')
        .insert(employeesToInsert);

      if (error) {
        console.error('Error adding employees:', error);
        showAlert('error', 'Erreur lors de l\'ajout des employés');
        return;
      }

      await fetchClients();
      resetEmployeeForm();
      showAlert('success', `${validEmployees.length} employé(s) ajouté(s) avec succès`);
    } catch (error) {
      console.error('Error adding employees:', error);
      showAlert('error', 'Erreur lors de l\'ajout des employés');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSingleEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update({
            first_name: singleEmployeeForm.first_name.trim(),
            last_name: singleEmployeeForm.last_name.trim(),
            email: singleEmployeeForm.email.trim()
          })
          .eq('id', editingEmployee.id);

        if (error) {
          console.error('Error updating employee:', error);
          showAlert('error', 'Erreur lors de la mise à jour de l\'employé');
          return;
        }

        showAlert('success', 'Employé mis à jour avec succès');
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert([{
            client_id: selectedClient.id,
            first_name: singleEmployeeForm.first_name.trim(),
            last_name: singleEmployeeForm.last_name.trim(),
            email: singleEmployeeForm.email.trim()
          }]);

        if (error) {
          console.error('Error adding employee:', error);
          showAlert('error', 'Erreur lors de l\'ajout de l\'employé');
          return;
        }

        showAlert('success', 'Employé ajouté avec succès');
      }

      await fetchClients();
      resetSingleEmployeeForm();
    } catch (error) {
      console.error('Error saving employee:', error);
      showAlert('error', 'Erreur lors de l\'enregistrement de l\'employé');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      description: client.description || '',
      logo_url: client.logo_url || ''
    });
    setShowAddForm(true);
  };

  const handleEditEmployee = (employee: Employee, client: Client) => {
    setEditingEmployee(employee);
    setSelectedClient(client);
    setSingleEmployeeForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email
    });
    setShowEditEmployee(true);
  };

  const handleDeleteClient = (client: Client) => {
    showConfirmDialog(
      'Supprimer le client',
      `Êtes-vous sûr de vouloir supprimer le client ${client.name} et tous ses employés ? Cette action est irréversible.`,
      async () => {
        try {
          // Delete logo if exists
          if (client.logo_url) {
            await deleteClientLogo(client.logo_url);
          }

          const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', client.id);

          if (error) {
            console.error('Error deleting client:', error);
            showAlert('error', 'Erreur lors de la suppression du client');
            return;
          }

          await fetchClients();
          showAlert('success', 'Client supprimé avec succès');
        } catch (error) {
          console.error('Error deleting client:', error);
          showAlert('error', 'Erreur lors de la suppression du client');
        }
      },
      'danger'
    );
  };

  const handleDeleteEmployee = (employee: Employee) => {
    showConfirmDialog(
      'Supprimer l\'employé',
      `Êtes-vous sûr de vouloir supprimer ${employee.first_name} ${employee.last_name} ? Cette action est irréversible.`,
      async () => {
        try {
          const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', employee.id);

          if (error) {
            console.error('Error deleting employee:', error);
            showAlert('error', 'Erreur lors de la suppression de l\'employé');
            return;
          }

          await fetchClients();
          showAlert('success', 'Employé supprimé avec succès');
        } catch (error) {
          console.error('Error deleting employee:', error);
          showAlert('error', 'Erreur lors de la suppression de l\'employé');
        }
      },
      'danger'
    );
  };

  const resetClientForm = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: ''
    });
    setEditingClient(null);
    setShowAddForm(false);
  };

  const resetEmployeeForm = () => {
    setEmployeesList([{ first_name: '', last_name: '', email: '' }]);
    setShowAddEmployee(false);
    setSelectedClient(null);
  };

  const resetSingleEmployeeForm = () => {
    setSingleEmployeeForm({
      first_name: '',
      last_name: '',
      email: ''
    });
    setShowEditEmployee(false);
    setEditingEmployee(null);
    setSelectedClient(null);
  };

  const toggleEmployees = (clientId: string) => {
    setShowEmployees(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  // Gestion des employés multiples
  const addEmployeeRow = () => {
    setEmployeesList(prev => [...prev, { first_name: '', last_name: '', email: '' }]);
  };

  const removeEmployeeRow = (index: number) => {
    if (employeesList.length > 1) {
      setEmployeesList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateEmployee = (index: number, field: keyof EmployeeFormData, value: string) => {
    setEmployeesList(prev => prev.map((emp, i) => 
      i === index ? { ...emp, [field]: value } : emp
    ));
  };

  const duplicateEmployee = (index: number) => {
    const employeeToDuplicate = employeesList[index];
    setEmployeesList(prev => [
      ...prev.slice(0, index + 1),
      { ...employeeToDuplicate, email: '' }, // Reset email to avoid duplicates
      ...prev.slice(index + 1)
    ]);
  };

  const generateEmailTemplate = (firstName: string, lastName: string) => {
    if (!firstName || !lastName || !selectedClient) return '';
    const domain = selectedClient.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10) + '.com';
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  };

  const autoFillEmail = (index: number) => {
    const employee = employeesList[index];
    if (employee.first_name && employee.last_name) {
      const email = generateEmailTemplate(employee.first_name, employee.last_name);
      updateEmployee(index, 'email', email);
    }
  };

  const autoFillSingleEmail = () => {
    if (singleEmployeeForm.first_name && singleEmployeeForm.last_name && selectedClient) {
      const email = generateEmailTemplate(singleEmployeeForm.first_name, singleEmployeeForm.last_name);
      setSingleEmployeeForm(prev => ({ ...prev, email }));
    }
  };

  const exportEmployeesList = () => {
    const validEmployees = employeesList.filter(emp => 
      emp.first_name.trim() && emp.last_name.trim() && emp.email.trim()
    );
    
    if (validEmployees.length === 0) {
      showAlert('warning', 'Aucun employé valide à exporter');
      return;
    }

    const csvContent = [
      'Prénom,Nom,Email',
      ...validEmployees.map(emp => `${emp.first_name},${emp.last_name},${emp.email}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employes_${selectedClient?.name || 'client'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportClientEmployees = (client: Client) => {
    if (!client.employees || client.employees.length === 0) {
      showAlert('warning', 'Aucun employé à exporter pour ce client');
      return;
    }

    const csvContent = [
      'Prénom,Nom,Email',
      ...client.employees.map(emp => `${emp.first_name},${emp.last_name},${emp.email}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employes_${client.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredEmployees = (employees: Employee[]) => {
    if (!employeeSearchTerm) return employees;
    return employees.filter(emp =>
      emp.first_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert.show && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Supprimer' : 'Confirmer'}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="text-accent hover:text-accent-dark transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">
              Gestion des Clients
            </h1>
            <p className="text-primary-600">
              Gérez vos clients et leurs employés
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher dans les employés..."
              value={employeeSearchTerm}
              onChange={(e) => setEmployeeSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Client Form */}
      {showAddForm && (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary-800">
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <button
              onClick={resetClientForm}
              className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmitClient} className="space-y-6">
            {/* Logo */}
            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Logo de l'entreprise (optionnel)
              </label>
              <div className="flex items-center space-x-4">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo client"
                    className="w-20 h-20 rounded-lg object-cover border-2 border-primary-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary-200 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file, editingClient?.id);
                    }}
                    className="hidden"
                    id="client-logo"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="client-logo"
                    className={`inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg cursor-pointer transition-colors duration-200 ${
                      uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{uploadingLogo ? 'Téléchargement...' : 'Choisir un logo'}</span>
                  </label>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="ml-2 text-error hover:text-error-dark text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Nom de l'entreprise *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="TechCorp Solutions"
                  />
                </div>
              </div>

              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  placeholder="Description de l'entreprise..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
              <button
                type="button"
                onClick={resetClientForm}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingLogo}
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Multiple Employees Form */}
      {showAddEmployee && selectedClient && (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-800">
                Ajouter des employés - {selectedClient.name}
              </h2>
              <p className="text-primary-600 text-sm mt-1">
                Ajoutez un ou plusieurs employés à la fois
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={exportEmployeesList}
                className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                title="Exporter la liste"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={resetEmployeeForm}
                className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitEmployees} className="space-y-6">
            {/* En-têtes */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-primary-700 border-b border-primary-200 pb-2">
              <div className="col-span-3">Prénom *</div>
              <div className="col-span-3">Nom *</div>
              <div className="col-span-4">Email *</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Liste des employés */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {employeesList.map((employee, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-primary-50 rounded-lg">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={employee.first_name}
                      onChange={(e) => updateEmployee(index, 'first_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-primary-300 rounded text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      placeholder="Jean"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={employee.last_name}
                      onChange={(e) => updateEmployee(index, 'last_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-primary-300 rounded text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      placeholder="Dupont"
                    />
                  </div>

                  <div className="col-span-4">
                    <div className="flex space-x-1">
                      <input
                        type="email"
                        value={employee.email}
                        onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-primary-300 rounded text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="jean.dupont@entreprise.com"
                      />
                      <button
                        type="button"
                        onClick={() => autoFillEmail(index)}
                        className="bg-warning hover:bg-warning-dark text-white p-2 rounded transition-all duration-200 hover:scale-105"
                        title="Générer email automatiquement"
                        disabled={!employee.first_name || !employee.last_name}
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => duplicateEmployee(index)}
                      className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded transition-all duration-200 hover:scale-105"
                      title="Dupliquer cette ligne"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {employeesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmployeeRow(index)}
                        className="bg-error hover:bg-error-dark text-white p-2 rounded transition-all duration-200 hover:scale-105"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton ajouter ligne */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addEmployeeRow}
                className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            {/* Résumé */}
            <div className="bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-800 font-medium">
                    Employés à ajouter : {employeesList.filter(emp => emp.first_name.trim() && emp.last_name.trim() && emp.email.trim()).length}
                  </p>
                  <p className="text-primary-600 text-sm">
                    Total lignes : {employeesList.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-600 text-sm">
                    Seuls les employés avec nom, prénom et email seront ajoutés
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
              <button
                type="button"
                onClick={resetEmployeeForm}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || employeesList.filter(emp => emp.first_name.trim() && emp.last_name.trim() && emp.email.trim()).length === 0}
                className="px-6 py-3 bg-success hover:bg-success-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Ajout...' : 'Ajouter les employés'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Single Employee Form */}
      {showEditEmployee && selectedClient && (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-800">
                {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'} - {selectedClient.name}
              </h2>
            </div>
            <button
              onClick={resetSingleEmployeeForm}
              className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmitSingleEmployee} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    value={singleEmployeeForm.first_name}
                    onChange={(e) => setSingleEmployeeForm(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    value={singleEmployeeForm.last_name}
                    onChange={(e) => setSingleEmployeeForm(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="Dupont"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Email *
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="email"
                    value={singleEmployeeForm.email}
                    onChange={(e) => setSingleEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="jean.dupont@entreprise.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={autoFillSingleEmail}
                  className="bg-warning hover:bg-warning-dark text-white px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Générer email automatiquement"
                  disabled={!singleEmployeeForm.first_name || !singleEmployeeForm.last_name}
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
              <button
                type="button"
                onClick={resetSingleEmployeeForm}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Enregistrement...' : editingEmployee ? 'Modifier' : 'Ajouter'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <h2 className="text-xl font-semibold text-primary-800">
            Clients ({filteredClients.length})
          </h2>
        </div>

        <div className="divide-y divide-primary-200">
          {filteredClients.map((client) => {
            const filteredEmployees = getFilteredEmployees(client.employees || []);
            const isExpanded = expandedClients[client.id];
            
            return (
              <div key={client.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-primary-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary-200 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-primary-800 font-medium">
                          {client.name}
                        </h3>
                        <button
                          onClick={() => toggleClientExpansion(client.id)}
                          className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                      {client.description && (
                        <p className="text-primary-600 text-sm">{client.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-primary-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{client.employees?.length || 0} employé(s)</span>
                        </span>
                        {employeeSearchTerm && filteredEmployees.length !== (client.employees?.length || 0) && (
                          <span className="text-accent">
                            ({filteredEmployees.length} correspondant(s))
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {client.employees && client.employees.length > 0 && (
                      <button
                        onClick={() => exportClientEmployees(client)}
                        className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Exporter les employés"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowEditEmployee(true);
                      }}
                      className="bg-success hover:bg-success-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Ajouter un employé"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowAddEmployee(true);
                      }}
                      className="bg-success hover:bg-success-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Ajouter plusieurs employés"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="bg-warning hover:bg-warning-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Modifier le client"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="bg-error hover:bg-error-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Supprimer le client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Employees List - Always visible when expanded */}
                {isExpanded && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-primary-800 font-medium flex items-center space-x-2">
                        <UserCheck className="w-5 h-5" />
                        <span>Employés ({filteredEmployees.length})</span>
                      </h4>
                    </div>
                    
                    {filteredEmployees.length > 0 ? (
                      <div className="space-y-3">
                        {filteredEmployees.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-primary-200 hover:border-accent transition-colors duration-200">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-accent bg-opacity-10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <p className="text-primary-800 font-medium">
                                  {employee.first_name} {employee.last_name}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-primary-600">
                                  <span className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{employee.email}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditEmployee(employee, client)}
                                className="bg-warning hover:bg-warning-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                title="Modifier l'employé"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee)}
                                className="bg-error hover:bg-error-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                title="Supprimer l'employé"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                        <p className="text-primary-600 text-sm">
                          {employeeSearchTerm ? 'Aucun employé ne correspond à votre recherche' : 'Aucun employé ajouté'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-primary-700 font-medium mb-2">
              {searchTerm ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="text-primary-600 text-sm mb-4">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier client'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Ajouter le premier client
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientManagement;