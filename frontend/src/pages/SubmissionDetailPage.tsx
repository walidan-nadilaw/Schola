import { useParams, useNavigate } from 'react-router';
import SubmissionDetail from '@/components/figma/SubmissionDetail';

export function SubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <SubmissionDetail 
      submissionId={id || ''} 
      onBack={() => navigate(-1)}
      onEdit={(id) => navigate(`/dashboard/ajuan?edit=${id}`)}
    />
  );
}
