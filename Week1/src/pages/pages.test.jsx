import { describe, it, expect } from 'vitest';
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
  it('renders one rated card per review', () => {
    render(<Reviews />);
    expect(screen.getByText(reviews[0].name)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/out of 5 stars/i)).toHaveLength(
      reviews.length
    );
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
