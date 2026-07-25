import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm.jsx';
import { validate } from '../utils/contactValidation.js';

describe('validate()', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@company.com',
    company: '',
    plan: 'growth',
    message: 'We need real-time analytics for our team.',
  };

  it('returns no errors for valid input', () => {
    expect(validate(valid)).toEqual({});
  });

  it('flags every required field when input is empty', () => {
    const errors = validate({
      name: '',
      email: '',
      company: '',
      plan: 'growth',
      message: '',
    });
    expect(errors).toHaveProperty('name');
    expect(errors).toHaveProperty('email');
    expect(errors).toHaveProperty('message');
  });

  it('rejects a malformed email address', () => {
    const errors = validate({ ...valid, email: 'not-an-email' });
    expect(errors.email).toMatch(/valid email/i);
  });

  it('rejects a message that is too short', () => {
    const errors = validate({ ...valid, message: 'hi' });
    expect(errors.message).toMatch(/at least 10/i);
  });
});

describe('<ContactForm />', () => {
  it('renders the core form fields', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/how can we help/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when empty', async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    render(<ContactForm onSubmitted={onSubmitted} />);

    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('submits and shows a success message with valid input', async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    render(<ContactForm onSubmitted={onSubmitted} />);

    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/work email/i), 'ada@company.com');
    await user.type(
      screen.getByLabelText(/how can we help/i),
      'We want live dashboards for our analytics team.'
    );
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(/thanks, ada/i);
  });

  it('clears a field error once the user starts typing', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/full name/i), 'A');
    expect(
      screen.queryByText(/please enter your name/i)
    ).not.toBeInTheDocument();
  });
});
