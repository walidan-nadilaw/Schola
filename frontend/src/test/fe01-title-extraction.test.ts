import { extractTitle } from '@/app/utils/submissions';

describe('FE-01: extractTitle — consistent title extraction', () => {
  it('extracts from "Judul" key', () => {
    expect(extractTitle({ Judul: 'Surat Keterangan Aktif' })).toBe('Surat Keterangan Aktif');
  });

  it('extracts from "field-judul" key', () => {
    expect(extractTitle({ 'field-judul': 'Surat Izin' })).toBe('Surat Izin');
  });

  it('extracts from case-insensitive "judul" key', () => {
    expect(extractTitle({ JUDUL: 'Surat Tugas' })).toBe('Surat Tugas');
  });

  it('falls back to Keperluan when no judul key', () => {
    expect(extractTitle({ Keperluan: 'Keperluan Lain' })).toBe('Keperluan Lain');
  });

  it('uses provided fallback when form_data is empty', () => {
    expect(extractTitle({}, 'API Fallback')).toBe('API Fallback');
  });

  it('uses default fallback when form_data is undefined', () => {
    expect(extractTitle(undefined)).toBe('Keperluan Akademik');
  });
});
