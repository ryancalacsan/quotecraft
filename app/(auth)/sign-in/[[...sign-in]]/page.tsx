import { redirect } from 'next/navigation';

export default function SignInPage() {
  // Sign-in disabled for portfolio demo — redirect to landing page
  // Demo login is handled via /api/demo/login with Clerk Sign-In Tokens
  redirect('/');
}
