import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the authentication form', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
});
