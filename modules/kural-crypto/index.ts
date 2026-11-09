import { requireOptionalNativeModule } from 'expo-modules-core';

type KuralCrypto = { pbkdf2Sha256(password: string, salt: Uint8Array, rounds: number, bytes: number): Promise<Uint8Array> };

/** Android's own PBKDF2, or null where the native module isn't built in (web, Expo Go). */
export default requireOptionalNativeModule<KuralCrypto>('KuralCrypto');
