import { hapticError, hapticLight, hapticSuccess } from './haptics.util';

export function toastText(message: string, isError: boolean): string {
  return isError ? `Error: ${message}` : message;
}

export async function feedbackTap(): Promise<void> {
  await hapticLight();
}

export async function feedbackSuccess(): Promise<void> {
  await hapticSuccess();
}

export async function feedbackError(): Promise<void> {
  await hapticError();
}
