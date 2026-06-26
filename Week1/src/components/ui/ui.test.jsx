import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard, PageHead, Stars } from './index.js';

describe('<Stars />', () => {
  it('renders five star glyphs with an accessible rating label', () => {
    render(<Stars count={4} />);
    const el = screen.getByLabelText('4 out of 5 stars');
    expect(el).toBeInTheDocument();
    // 4 filled + 1 dimmed = 5 glyphs total
    expect(el.textContent.replace(/\s/g, '')).toHaveLength(5);
  });
});

describe('<PageHead />', () => {
  it('renders the eyebrow, title and intro children', () => {
    render(
      <PageHead eyebrow="About this build" title="My Title">
        Intro text
      </PageHead>
    );
    expect(screen.getByText('About this build')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'My Title' })
    ).toBeInTheDocument();
    expect(screen.getByText('Intro text')).toBeInTheDocument();
  });
});

describe('<GlassCard />', () => {
  it('applies the glass class, merges className and honours the `as` element', () => {
    const { container } = render(
      <GlassCard as="article" className="feature">
        hi
      </GlassCard>
    );
    const el = container.querySelector('article');
    expect(el).toBeTruthy();
    expect(el).toHaveClass('glass', 'feature');
    expect(el).toHaveTextContent('hi');
  });
});
