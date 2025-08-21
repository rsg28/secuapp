export const initialCompanies = [
  {
    id: '1',
    name: 'Industrias del Norte S.A.',
    industry: 'Manufactura',
    contactPerson: 'Juan Pérez',
    email: 'juan.perez@industriasnorte.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Industrial 1234, Santiago',
    status: 'active',
    formCount: 5,
    lastActivity: '2024-01-15',
  },
  {
    id: '2',
    name: 'Minería del Sur Ltda.',
    industry: 'Minería',
    contactPerson: 'María González',
    email: 'maria.gonzalez@mineriasur.cl',
    phone: '+56 9 8765 4321',
    address: 'Camino Minero 567, Antofagasta',
    status: 'active',
    formCount: 3,
    lastActivity: '2024-01-14',
  },
  {
    id: '3',
    name: 'Construcciones Central',
    industry: 'Construcción',
    contactPerson: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@construcciones.cl',
    phone: '+56 9 5555 6666',
    address: 'Calle Obrera 890, Valparaíso',
    status: 'active',
    formCount: 7,
    lastActivity: '2024-01-13',
  },
];

// Función para inicializar empresas en el storage
export const initializeCompanies = async (storage: any) => {
  try {
    const existingCompanies = await storage.loadCompanies();
    if (existingCompanies.length === 0) {
      await storage.saveCompanies(initialCompanies);
      console.log('Empresas inicializadas');
    }
  } catch (error) {
    console.error('Error initializing companies:', error);
  }
};
