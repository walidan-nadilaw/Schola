import { Submission } from '../../utils/submissions';

interface LetterPreviewProps {
  submission: Submission;
}

export default function LetterPreview({ submission }: LetterPreviewProps) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
      {/* Kop Surat */}
      <div className="text-center mb-6">
        <div className="font-bold text-lg mb-1">INSTITUT PERTANIAN BOGOR</div>
        <div className="text-sm">Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680</div>
        <div className="text-sm">Telp: (0251) 8622642 | Email: rektorat@ipb.ac.id</div>
        <div className="border-t-2 border-black mt-2"></div>
      </div>

      {/* Nomor dan Tanggal */}
      <div className="mb-6">
        <div className="text-sm">Nomor: {submission.id}/IPB/2026</div>
        <div className="text-sm">Tanggal: {submission.getFormattedDate(submission.tanggalPengajuan)}</div>
      </div>

      {/* Judul Surat */}
      <div className="text-center font-bold text-lg mb-6 underline">
        {submission.jenisSurat.toUpperCase()}
      </div>

      {/* Isi Surat */}
      <div className="mb-6 space-y-4 text-sm leading-relaxed">
        <p>Yang bertanda tangan di bawah ini, Dekan Fakultas Pertanian Institut Pertanian Bogor, menerangkan bahwa:</p>

        <div className="ml-8 space-y-2">
          <div className="flex">
            <span className="w-32">Nama</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{submission.submitterName}</span>
          </div>
          <div className="flex">
            <span className="w-32">NIM</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{submission.submitterNim}</span>
          </div>
          <div className="flex">
            <span className="w-32">Program Studi</span>
            <span className="mr-2">:</span>
            <span className="font-medium">Ilmu Komputer</span>
          </div>
          <div className="flex">
            <span className="w-32">Fakultas</span>
            <span className="mr-2">:</span>
            <span className="font-medium">Sekolah Sains Matematika dan Informatika</span>
          </div>
        </div>

        <p>
          Adalah benar mahasiswa aktif pada Institut Pertanian Bogor semester{' '}
          {submission.formData['Semester'] || '-'} dan sedang menempuh pendidikan di program studi Ilmu Komputer.
        </p>

        <p>
          Surat keterangan ini dibuat untuk keperluan{' '}
          <strong>{submission.formData['Keperluan'] || submission.keperluan}</strong>.
        </p>

        <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div></div>
        <div className="text-center text-sm">
          <div className="mb-16">
            <div>Bogor, {today}</div>
            <div className="font-medium">Dekan,</div>
          </div>

          {submission.isFullyApproved() ? (
            <div className="mb-2">
              <div className="text-xs text-green-600 italic mb-1">Ditandatangani secara digital</div>
              <div className="border-2 border-green-500 rounded p-2 bg-green-50">
                <div className="font-bold">Prof. Budi Wijaya</div>
                <div className="text-xs">NIP. 196512151990031002</div>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <div className="text-xs text-gray-400 italic mb-1">Menunggu tanda tangan</div>
              <div className="border-2 border-dashed border-gray-300 rounded p-2">
                <div className="font-bold text-gray-400">Belum Ditandatangani</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Verifikasi (hanya jika sudah disetujui) */}
      {submission.isFullyApproved() && (
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="text-xs text-gray-600">
            <div className="font-bold mb-2">Riwayat Verifikasi:</div>
            {submission.verifiers.map((v, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <span>✓ {v.name} ({v.role})</span>
                <span className="text-gray-500">{v.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
