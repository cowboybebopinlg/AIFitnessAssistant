import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormInput from '../../components/FormInput';
import React from 'react';

describe('FormInput', () => {
  it('should render with a label', () => {
    render(<FormInput label="Test Label" value="" onChange={() => {}} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render without a label', () => {
    render(<FormInput value="" onChange={() => {}} />);
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('should call onChange when the input value changes', () => {
    const handleChange = vi.fn();
    render(<FormInput label="Test Label" value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<FormInput label="Test Label" value="" onChange={() => {}} disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should display the correct placeholder', () => {
    render(<FormInput value="" onChange={() => {}} placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});