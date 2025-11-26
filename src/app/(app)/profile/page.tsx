import { redirect } from 'next/navigation';

export default function ProfileRedirectPage() {
  // Redirect legacy /profile route to the Brand Center profile page
  redirect('/brand/profile');

  // This component never renders because redirect() performs a navigation
  return null as any;
}
