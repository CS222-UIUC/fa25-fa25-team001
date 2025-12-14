'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
    onSignIn: (googleUser: any) => void;
  }
}

interface GoogleSignInProps {
  onSuccess?: (profile: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    idToken: string;
  }) => void;
}

export default function GoogleSignIn({ onSuccess }: GoogleSignInProps) {
  useEffect(() => {
    // Define the onSignIn callback globally
    // The g-signin2 div will automatically call this function when sign-in succeeds
    window.onSignIn = (googleUser: any) => {
      try {
        const profile = googleUser.getBasicProfile();
        const authResponse = googleUser.getAuthResponse();
        const idToken = authResponse?.id_token || '';
        
        const profileData = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl(),
          idToken: idToken, // Use this for backend authentication
        };

        console.log('ID: ' + profileData.id); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profileData.name);
        console.log('Image URL: ' + profileData.imageUrl);
        console.log('Email: ' + profileData.email); // This is null if the 'email' scope is not present.
        console.log('ID Token: ' + profileData.idToken); // Use this token for backend authentication

        if (onSuccess) {
          onSuccess(profileData);
        }
      } catch (error) {
        console.error('Error processing Google sign-in:', error);
      }
    };

    return () => {
      // Cleanup
      if (window.onSignIn) {
        delete window.onSignIn;
      }
    };
  }, [onSuccess]);

  // The g-signin2 div automatically handles initialization and rendering
  // No manual initialization needed - it reads the meta tag for client_id
  return (
    <div 
      className="g-signin2" 
      data-onsuccess="onSignIn" 
      data-theme="light" 
      data-width="240" 
      data-height="50" 
      data-longtitle="true"
    ></div>
  );
}

export function signOut() {
  if (typeof window !== 'undefined' && window.gapi) {
    const auth2 = window.gapi.auth2.getAuthInstance();
    if (auth2) {
      auth2.signOut().then(() => {
        console.log('User signed out.');
      });
    }
  }
}

