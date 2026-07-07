import React from 'react';
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';

// A simple test component
const TestComponent = () => {
    return <h1>Medisync App Loaded</h1>;
};

test('renders Medisync app placeholder', () => {
  render(<TestComponent />);
  const headingElement = screen.getByText(/Medisync App Loaded/i);
  expect(headingElement).toBeInTheDocument();
});
