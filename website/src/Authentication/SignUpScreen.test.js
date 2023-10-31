import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpScreen from './SignUpScreen';
import axios from 'axios';

jest.mock('axios');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));


describe('SignUpScreen', () => {
  beforeEach(() => {
    render(<SignUpScreen />);
  });

  test('input fields are rendered', () => {
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
  });

  test('validation errors are shown for empty fields', async () => {
    fireEvent.click(screen.getByText('Sign Up'));
    
    await waitFor(() => {
      expect(screen.getByText('First name is required.')).toBeInTheDocument();
      expect(screen.getByText('Last name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });
  });

  test('should display a password error if the password is not complex enough', async () => {
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters with a lower, upper case letter, number, and special character.')).toBeInTheDocument();
    });
  });

  test('should submit form with correct data', async () => {
    const mockNavigate = jest.fn();
    axios.post.mockResolvedValue({ data: { message: 'Sign Up Successful' } });

    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Password@123' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(`${process.env.REACT_APP_URL}/coach`, {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '1234567890',
        password: 'Password@123',
        confirm_password: 'Password@123',
      });
    //   expect(mockNavigate).toHaveBeenCalledWith('/verify', { state: { email: 'john.doe@example.com' } });
    });
  });

  // ...additional tests for server error responses, navigation, etc.
});
