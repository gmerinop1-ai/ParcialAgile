/**
 * Represents a person's data retrieved from RENIEC.
 */
export interface Person {
  /**
   * The person's DNI.
   */
  dni: string;
  /**
   * The person's name.
   */
  name: string;
  /**
   * The person's last name.
   */
  lastName: string;
  /**
   * The person's address.
   */
  address: string;
}

/**
 * Asynchronously retrieves person data from RENIEC by DNI.
 *
 * @param dni The DNI to search for.
 * @returns A promise that resolves to a Person object containing the person's data.
 */
export async function getPersonByDni(dni: string): Promise<Person> {
  // TODO: Implement this by calling the RENIEC API.

  return {
    dni: dni,
    name: 'Juan',
    lastName: 'Perez',
    address: 'Av. Example 123',
  };
}
