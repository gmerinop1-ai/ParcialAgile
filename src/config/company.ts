// Configuration for company branding and information
export const COMPANY_CONFIG = {
  // Company Information
  name: 'Financiera Robles',
  fullName: 'Financiera Robles S.A.C.',
  tagline: 'Sistema de Gestión',
  
  // Logo Configuration
  logo: {
    // You can replace this with a URL to your actual logo
    // For now, using initials as placeholder
    initials: 'FR',
    backgroundColor: '#3B82F6', // blue-500 to match the UI
    textColor: '#FFFFFF',
    size: 64, // Size in pixels
  },
  
  // Contact Information
  contact: {
    phone: '(01) 234-5678',
    email: 'info@financieracorp.com',
    website: 'www.financieracorp.com',
    address: 'Av. Principal 123, Lima, Perú',
  },
  
  // Colors for branding
  colors: {
    primary: '#1E40AF', // blue-600
    primaryDark: '#1E3A8A', // blue-700
    secondary: '#6B7280', // gray-500
    accent: '#F59E0B', // amber-500
  },
  
  // PDF Configuration
  pdf: {
    footerText: 'Este documento es válido únicamente con la firma y sello de la institución financiera.',
    documentTitle: 'Cronograma de Pagos',
  }
} as const;

// Type for company configuration
export type CompanyConfig = typeof COMPANY_CONFIG;