import { useNavigate } from 'react-router';
import LandingPageFigma from '@/components/figma/LandingPage';

export function LandingPage() {
  const navigate = useNavigate();

  const handleNavigate = (section: string) => {
    if (section === 'verifikasi') navigate('/dashboard/verifikasi');
    else if (section === 'panduan') navigate('/panduan');
    else if (section === 'pengajuan') navigate('/dashboard/ajuan');
  };

  return (
    <LandingPageFigma 
      onLogin={() => navigate('/signin')} 
      onNavigate={handleNavigate}
      onAjukan={() => navigate('/dashboard/ajuan')}
    />
  );
}
