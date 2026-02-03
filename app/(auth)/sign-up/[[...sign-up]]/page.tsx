import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Sign-up disabled for portfolio demo — redirect to landing page
  redirect('/');
}
