import { render } from '@testing-library/react';
import App from '@/app/App';

describe('smoke', () => {
  it('renders app without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});