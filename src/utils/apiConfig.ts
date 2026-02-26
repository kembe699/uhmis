// Dynamic API configuration for network access
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocalhost) {
    return 'http://localhost:3001/api';
  } else {
    return `http://${hostname}:3001/api`;
  }
};

export const getAuthApiUrl = () => `${getApiBaseUrl()}/auth`;
export const getPatientsApiUrl = () => `${getApiBaseUrl()}/patients`;
export const getPharmacyApiUrl = () => `${getApiBaseUrl()}/pharmacy`;
export const getPatientBillsApiUrl = () => `${getApiBaseUrl()}/patient-bills`;
export const getReceiptsApiUrl = () => `${getApiBaseUrl()}/receipts`;
export const getClinicalApiUrl = () => `${getApiBaseUrl()}/clinical`;
export const getDashboardApiUrl = () => `${getApiBaseUrl()}/dashboard`;
export const getServicesApiUrl = () => `${getApiBaseUrl()}/services`;
export const getClinicsApiUrl = () => `${getApiBaseUrl()}/clinics`;
