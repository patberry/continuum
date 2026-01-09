'use client';

import { useAuth } from '@clerk/nextjs';
import FeedbackSidebar from './FeedbackSidebar';

export default function AuthenticatedSidebar() {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Don't render anything until auth is loaded
  if (!isLoaded) return null;
  
  // Only show sidebar for authenticated users
  if (!isSignedIn) return null;
  
  return <FeedbackSidebar />;
}
