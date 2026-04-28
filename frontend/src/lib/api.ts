import api from '../services/api';
import type { GeneratorMode, PasswordSettings, PassphraseSettings } from '../types/generator';

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
      include_special: s.symbols,
      min_numbers: s.min_numbers,
      min_special: s.min_special,
    });
    return (res.data.password ?? '') as string;
  } else {
    const s = settings as PassphraseSettings;
    const res = await api.post('/generator/passphrase', {
      words: s.word_count,
      separator: s.separator,
      capitalize: s.capitalize,
      include_number: s.include_number,
    });
    return (res.data.passphrase ?? '') as string;
  }
}