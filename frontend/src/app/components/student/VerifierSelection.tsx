import { useState, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchVerifiers, SelectedVerifier, User } from '../../utils/users';
import { toast } from 'sonner';

interface VerifierSelectionProps {
  selectedVerifiers: SelectedVerifier[];
  onVerifiersChange: (verifiers: SelectedVerifier[]) => void;
  isOrdered: boolean;
  onOrderedChange: (ordered: boolean) => void;
}

export default function VerifierSelection({
  selectedVerifiers,
  onVerifiersChange,
  isOrdered,
  onOrderedChange,
}: VerifierSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allVerifiers, setAllVerifiers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<SelectedVerifier[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadVerifiers = async () => {
      const verifiers = await fetchVerifiers();
      setAllVerifiers(verifiers);
    };
    loadVerifiers();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    // Use server-side search for accuracy; fall back to client-side filter
    const pool = query.trim().length >= 2
      ? await fetchVerifiers(query.trim())
      : allVerifiers;
    const lowercaseQuery = query.toLowerCase();
    const results = pool
      .filter((v) => v.name.toLowerCase().includes(lowercaseQuery) || v.id.toLowerCase().includes(lowercaseQuery))
      .map((v) => new SelectedVerifier({
        id: v.id,
        name: v.name,
        role: v.role,
        department: v.department,
        email: v.email,
        nim: v.nim,
        fakultas: v.fakultas,
        program: v.program,
        nip: v.nip,
        position: v.position
      }));
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSelectUser = (user: SelectedVerifier) => {
    // Check if already selected
    if (selectedVerifiers.some((v) => v.id === user.id)) {
      toast.warning('Pengguna ini sudah dipilih sebagai verifikator');
      return;
    }

    const newVerifier = new SelectedVerifier({
      ...user,
      order: isOrdered ? selectedVerifiers.length + 1 : undefined,
      verifierRole: 'verifikator',
    });

    onVerifiersChange([...selectedVerifiers, newVerifier]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleRoleChange = (userId: string, role: 'verifikator' | 'penandatangan') => {
    const updatedVerifiers = selectedVerifiers.map((v) =>
      v.id === userId ? new SelectedVerifier({ ...v, verifierRole: role }) : v
    );
    onVerifiersChange(updatedVerifiers);
  };

  const handleRemoveVerifier = (userId: string) => {
    const updatedVerifiers = selectedVerifiers
      .filter((v) => v.id !== userId)
      .map((v, index) => new SelectedVerifier({
        ...v,
        order: isOrdered ? index + 1 : undefined,
      }));
    onVerifiersChange(updatedVerifiers);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVerifiers = [...selectedVerifiers];
    [newVerifiers[index - 1], newVerifiers[index]] = [
      newVerifiers[index],
      newVerifiers[index - 1],
    ];
    const updatedVerifiers = newVerifiers.map((v, i) => new SelectedVerifier({
      ...v,
      order: i + 1,
    }));
    onVerifiersChange(updatedVerifiers);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedVerifiers.length - 1) return;
    const newVerifiers = [...selectedVerifiers];
    [newVerifiers[index], newVerifiers[index + 1]] = [
      newVerifiers[index + 1],
      newVerifiers[index],
    ];
    const updatedVerifiers = newVerifiers.map((v, i) => new SelectedVerifier({
      ...v,
      order: i + 1,
    }));
    onVerifiersChange(updatedVerifiers);
  };

  const handleOrderedToggle = (ordered: boolean) => {
    onOrderedChange(ordered);
    const updatedVerifiers = selectedVerifiers.map((v, index) => new SelectedVerifier({
      ...v,
      order: ordered ? index + 1 : undefined,
    }));
    onVerifiersChange(updatedVerifiers);
  };

  return (
    <div className="space-y-6">
      {/* Verification Type Toggle */}
      <div>
        <label className="block font-medium mb-3">Tipe Verifikasi</label>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isOrdered}
              onChange={() => handleOrderedToggle(false)}
              className="w-4 h-4 text-[#007bff] focus:ring-[#007bff]"
            />
            <div>
              <span className="font-medium">Parallel</span>
              <p className="text-sm text-gray-600">Semua verifikator dapat memverifikasi secara bersamaan</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isOrdered}
              onChange={() => handleOrderedToggle(true)}
              className="w-4 h-4 text-[#007bff] focus:ring-[#007bff]"
            />
            <div>
              <span className="font-medium">Berurutan</span>
              <p className="text-sm text-gray-600">Verifikasi dilakukan sesuai urutan yang ditentukan</p>
            </div>
          </label>
        </div>
      </div>

      {/* User Search */}
      <div className="relative">
        <label className="block font-medium mb-2">
          Cari Verifikator <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari berdasarkan nama atau ID user..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-4 hover:bg-gray-50 text-left border-b last:border-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#007bff] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{user.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {user.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{user.role}</p>
                    <p className="text-xs text-gray-500">{user.department}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && searchQuery.trim() && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
            Tidak ada user ditemukan
          </div>
        )}
      </div>

      {/* Selected Verifiers */}
      {selectedVerifiers.length > 0 && (
        <div>
          <label className="block font-medium mb-3">
            Verifikator Terpilih ({selectedVerifiers.length})
          </label>
          <div className="space-y-2">
            {selectedVerifiers.map((verifier, index) => (
              <div
                key={verifier.id}
                className="bg-white border border-gray-300 rounded-lg p-4 flex items-center gap-4"
              >
                {isOrdered && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === selectedVerifiers.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}

                {isOrdered && (
                  <div className="w-8 h-8 bg-[#007bff] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {verifier.order}
                  </div>
                )}

                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                  {verifier.name.charAt(0)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{verifier.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {verifier.id}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{verifier.role} - {verifier.department}</p>

                  {/* Role Selection - Show when more than one verifier */}
                  {selectedVerifiers.length > 1 && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Peran Verifikator</label>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name={`role-${verifier.id}`}
                            checked={verifier.verifierRole === 'verifikator'}
                            onChange={() => handleRoleChange(verifier.id, 'verifikator')}
                            className="w-4 h-4 text-[#007bff] focus:ring-[#007bff]"
                          />
                          <span className="text-sm">Verifikator</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name={`role-${verifier.id}`}
                            checked={verifier.verifierRole === 'penandatangan'}
                            onChange={() => handleRoleChange(verifier.id, 'penandatangan')}
                            className="w-4 h-4 text-[#007bff] focus:ring-[#007bff]"
                          />
                          <span className="text-sm">Penandatangan</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveVerifier(verifier.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
