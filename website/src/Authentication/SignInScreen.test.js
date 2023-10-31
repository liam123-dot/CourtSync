import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInScreen from './SignInScreen';
import axios from 'axios';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn().mockImplementation(() => (path) => {}),
}));

describe('SignInScreen', () => {
  beforeEach(() => {
    render(<SignInScreen />);
  });

  test('inputs should be initially empty', () => {
    expect(screen.getByPlaceholderText('Email').value).toBe('');
    expect(screen.getByPlaceholderText('Password').value).toBe('');
  });

  test('should show error message when email is invalid', async () => {
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalidemail' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email.')).toBeInTheDocument();
    });
  });

  test('should show error message when password is too short', async () => {
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'email@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Password is too short.')).toBeInTheDocument();
    });
  });

  test('should call axios.post on form submission with valid data', async () => {
    const mockPost = axios.post.mockResolvedValue({
      data: {
        AuthenticationResult: { AccessToken: 'token', RefreshToken: 'refresh', IdToken: 'id' },
        CoachSlug: 'coach-slug',
      },
    });

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'email@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(`${process.env.REACT_APP_URL}/auth/coach/sign-in`, {
        username: 'email@example.com',
        password: 'password123',
      });
    });
  });

  // More tests can be written to cover other scenarios
});
