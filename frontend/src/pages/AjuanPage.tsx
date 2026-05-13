import { useSearchParams, useNavigate } from 'react-router';
import Ajuan from '@/components/figma/Ajuan';

export function AjuanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || undefined;
  const editId = searchParams.get('edit') || null;

  return (
    <Ajuan 
      preSelectedLetter={type} 
      editingSubmissionId={editId}
      onBackToList={() => navigate('/dashboard/diajukan')}
    />
  );
}
