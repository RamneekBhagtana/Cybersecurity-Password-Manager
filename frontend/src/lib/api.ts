import api from '../services/api';
import type { GeneratorMode, PasswordSettings, PassphraseSettings } from '../types/generator';

/**
 * Calls the backend generator endpoint and returns the generated secret string.
 * Maps frontend field names to the backend's expected field names.
 */
export async function fetchGeneratedSecret(
  mode: GeneratorMode,
  settings: PasswordSettings | PassphraseSettings
): Promise<string> {
  if (mode === 'password') {
    const s = settings as PasswordSettings;
    const res = await api.post('/generator/password', {
      length: s.length,
      include_uppercase: s.uppercase,
      include_lowercase: s.lowercase,
      include_numbers: s.numbers,
      include_symbols: s.symbols,
    });
    return (res.data.password ?? '') as string;
  } else {
    const s = settings as PassphraseSettings;
    const res = await api.post('/generator/passphrase', {
      words: s.word_count,
      separator: s.separator,
      capitalize: s.capitalize,
    });
    return (res.data.passphrase ?? '') as string;
  }
}
