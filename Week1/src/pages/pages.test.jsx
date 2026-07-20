import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import About from './About.jsx';
import Reviews from './Reviews.jsx';
import NotFound from './NotFound.jsx';
import { stack } from '../data/about.js';

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

  const apiReview = {
    id: 'r1',
    name: 'Test Reviewer',
    role: 'QA, Example Co',
    quote: 'Fetched straight from the backend API.',
    stars: 4,
    created_at: '2026-07-01T10:00:00Z',
  };

  function stubListSuccess(items = [apiReview]) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ items, total: items.length, limit: 50, offset: 0 }),
      })
    );
  }

  it('renders reviews from the API with an edit button per card', async () => {
    stubListSuccess();

    render(<Reviews />);
    expect(await screen.findByText('Test Reviewer')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/out of 5 stars/i)).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: /edit review by test reviewer/i })
    ).toBeInTheDocument();
    // The submit form only appears when the backend is live.
    expect(
      screen.getByRole('button', { name: /publish review/i })
    ).toBeInTheDocument();
  });

  it('shows an empty state when the API has no reviews yet', async () => {
    stubListSuccess([]);

    render(<Reviews />);
    expect(await screen.findByText(/no reviews yet/i)).toBeInTheDocument();
  });

  it('opens a prefilled inline edit form when the pencil is clicked', async () => {
    stubListSuccess();
    const user = userEvent.setup();

    render(<Reviews />);
    await user.click(
      await screen.findByRole('button', {
        name: /edit review by test reviewer/i,
      })
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Test Reviewer');
    expect(screen.getByLabelText('Review')).toHaveValue(
      'Fetched straight from the backend API.'
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows an unavailable message when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<Reviews />);
    expect(
      await screen.findByText(/reviews are unavailable/i)
    ).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/out of 5 stars/i)).toHaveLength(0);
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
