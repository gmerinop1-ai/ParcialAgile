import { auth } from './config';
import { 
  signInWithEmailAndPassword, 
  signOut,
  type UserCredential,
  type AuthError
} from 'firebase/auth';

/**
 * Signs in a user with their email and password.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to the user's credentials upon successful sign-in.
 * @throws An error if sign-in fails.
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    const authError = error as AuthError;
    // You can customize error handling here, e.g., map Firebase error codes to user-friendly messages
    console.error("Firebase signInWithEmail error:", authError.code, authError.message);
    throw new Error(authError.message || 'Error al iniciar sesión. Verifica tus credenciales.');
  }
}

/**
 * Signs out the current user.
 * @returns A promise that resolves when the user has been signed out.
 * @throws An error if sign-out fails.
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    console.error("Firebase signOutUser error:", authError.code, authError.message);
    throw new Error(authError.message || 'Error al cerrar sesión.');
  }
}

// Add other authentication functions here as needed, e.g., createUserWithEmail, sendPasswordResetEmail, etc.
