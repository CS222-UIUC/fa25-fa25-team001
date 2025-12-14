'use client';

import { useEffect } from 'react';

export default function GoogleSignInMeta() {
  useEffect(() => {
    // Add the Google Sign-In meta tag to the document head
    const metaTag = document.createElement('meta');
    metaTag.name = 'google-signin-client_id';
    metaTag.content = '544117421120-m7dmair6nqjo89pcu2kvsoq4a64h003p.apps.googleusercontent.com';
    
    // Check if the meta tag already exists
    const existingTag = document.querySelector('meta[name="google-signin-client_id"]');
    if (!existingTag) {
      document.head.appendChild(metaTag);
    }

    return () => {
      // Cleanup: remove the meta tag when component unmounts (optional)
      const tag = document.querySelector('meta[name="google-signin-client_id"]');
      if (tag) {
        tag.remove();
      }
    };
  }, []);

  return null;
}

