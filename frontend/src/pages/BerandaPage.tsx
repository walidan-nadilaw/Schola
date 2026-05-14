import { useNavigate } from 'react-router';
import Beranda from '@/components/figma/Beranda';

export function BerandaPage() {
  const navigate = useNavigate();

  return (
    <Beranda 
      onSectionChange={(section) => {
        if (section === 'beranda') navigate('/dashboard');
        else if (section === 'ajuan') navigate('/dashboard/ajuan');
        else if (section === 'diajukan') navigate('/dashboard/diajukan');
        else if (section === 'verifikasi') navigate('/dashboard/verifikasi');
        else if (section === 'chatbot') navigate('/dashboard/chatbot');
      }}
      onViewSubmissionDetail={(id) => navigate(`/dashboard/submission/${id}`)}
    />
  );
}
