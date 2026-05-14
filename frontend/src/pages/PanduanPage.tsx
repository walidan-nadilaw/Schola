import { useNavigate } from 'react-router';
import Panduan from '@/components/figma/Panduan';

export function PanduanPage() {
  const navigate = useNavigate();

  return (
    <Panduan 
      onAjukan={(letterType) => navigate(`/dashboard/ajuan?type=${letterType}`)} 
    />
  );
}
