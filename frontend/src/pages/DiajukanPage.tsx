import { useNavigate } from 'react-router';
import Diajukan from '@/components/figma/Diajukan';

export function DiajukanPage() {
  const navigate = useNavigate();

  return (
    <Diajukan 
      onNewSubmission={() => navigate('/dashboard/ajuan')}
      onViewDetail={(id) => navigate(`/dashboard/submission/${id}`)}
      onEdit={(id) => navigate(`/dashboard/ajuan?edit=${id}`)}
    />
  );
}
