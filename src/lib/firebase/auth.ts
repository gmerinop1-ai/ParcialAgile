import { auth } from './config';
import { 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

/**
 * Changes the current user's password.
 * @param currentPassword - The user's current password for authentication.
 * @param newPassword - The new password to set.
 * @returns A promise that resolves when the password has been changed.
 * @throws An error if password change fails.
 */
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No hay usuario autenticado.');
    }

    // Re-authenticate the user with their current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update the password
    await updatePassword(user, newPassword);
  } catch (error) {
    const authError = error as AuthError;
    console.error("Firebase changeUserPassword error:", authError.code, authError.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Error al cambiar la contraseña.';
    switch (authError.code) {
      case 'auth/wrong-password':
        errorMessage = 'La contraseña actual es incorrecta.';
        break;
      case 'auth/weak-password':
        errorMessage = 'La nueva contraseña es muy débil. Debe tener al menos 6 caracteres.';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Por seguridad, necesitas volver a iniciar sesión antes de cambiar tu contraseña.';
        break;
      default:
        errorMessage = authError.message || 'Error al cambiar la contraseña.';
    }
    
    throw new Error(errorMessage);
  }
}

// Add other authentication functions here as needed, e.g., createUserWithEmail, sendPasswordResetEmail, etc.
