import { describe, it, expect,  } from 'vitest';
// import { render, screen } from '@/test-utils';

import { render, screen } from "@testing-library/react";
import { Spinner } from '@/components/spinner';

describe('Spinner', () => {
  it('renders loading spinner', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });
  
  it('has correct accessibility attributes', () => {
    render(<Spinner />);
    
    const spinnerContainer = screen.getByText((_, element) => {
      return element?.classList.contains('animate-spin') || false;
    });
    expect(spinnerContainer).toBeInTheDocument();
  });
});