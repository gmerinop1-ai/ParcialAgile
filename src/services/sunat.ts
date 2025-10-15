/**
 * Represents a company's data retrieved from SUNAT.
 */
export interface CompanyData {
  /**
   * The company's RUC.
   */
  ruc: string;
  /**
   * The company's business name.
   */
  businessName: string;
  /**
   * The company's commercial name.
   */
  commercialName: string;
  /**
   * The company's condition.
   */
  condition: string;
  /**
   * The company's status.
   */
  status: string;
  /**
   * The company's address.
   */
  address: string;
}

/**
 * Asynchronously retrieves company data from SUNAT by RUC.
 *
 * @param ruc The RUC to search for.
 * @returns A promise that resolves to a CompanyData object containing the company's data.
 */
export async function getCompanyByRuc(ruc: string): Promise<CompanyData> {
  try {
    const response = await fetch(`/api/sunat?ruc=${ruc}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching company data:', error);
    throw error;
  }
}