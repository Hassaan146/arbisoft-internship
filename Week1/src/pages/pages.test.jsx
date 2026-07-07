import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About.jsx';
import Reviews from './Reviews.jsx';
import NotFound from './NotFound.jsx';
import { stack } from '../data/about.js';
import { reviews } from '../data/reviews.js';

describe('<About />', () => {
  it('renders the heading, a card per stack item, and the build steps', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { name: /how i made this project/i })
    ).toBeInTheDocument();
    expect(screen.getByText(stack[0].title)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5);
  });
});

describe('<Reviews />', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders reviews from the API when it responds', async () => {
    const page = {
      items: [
        {
          id: 'r1',
          name: 'Test Reviewer',
          role: 'QA, Example Co',
          quote: 'Fetched straight from the backend API.',
          stars: 4,
          created_at: '2026-07-01T10:00:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(page),
      })
    );

    render(<Reviews />);
    expect(await screen.findByText('Test Reviewer')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/out of 5 stars/i)).toHaveLength(1);
    // The submit form only appears when the backend is live.
    expect(
      screen.getByRole('button', { name: /publish review/i })
    ).toBeInTheDocument();
  });

  it('falls back to bundled sample reviews when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<Reviews />);
    expect(await screen.findByText(reviews[0].name)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/out of 5 stars/i)).toHaveLength(
      reviews.length
    );
    expect(screen.getByText(/showing a sample/i)).toBeInTheDocument();
  });
});

describe('<NotFound />', () => {
  it('renders the 404 and a link back home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
