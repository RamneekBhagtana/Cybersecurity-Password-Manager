export type GeneratorMode = 'password' | 'passphrase';

export interface PasswordSettings {
  length: number;           // 8-24
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  min_numbers: number;
  min_special: number;
}

export interface PassphraseSettings {
  word_count: number;       // 3-6
  separator: string;
  capitalize: boolean;
  include_number: boolean;
}

export interface GeneratorResponse {
  password?: string;
  passphrase?: string;
}