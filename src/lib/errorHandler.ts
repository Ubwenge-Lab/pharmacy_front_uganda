import axios from 'axios';

/**
 * Extracts a human-readable message from any thrown value.
 * Handles: Axios response errors, network errors, plain JS errors, unknown values.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'An error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
