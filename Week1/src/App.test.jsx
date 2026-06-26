import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('renders the landing hero at "/"', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { name: /instantly craft immersive/i })
    ).toBeInTheDocument();
  });

  it('renders the About page (inside the shared layout) at "/about"', () => {
    renderAt('/about');
    expect(
      screen.getByRole('heading', { name: /how i made this project/i })
    ).toBeInTheDocument();
    // shared navbar brand is present on routed pages
    expect(screen.getAllByText(/veldara/i).length).toBeGreaterThan(0);
  });

  it('renders the 404 page for an unknown route', () => {
    renderAt('/no-such-page');
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });
});
