import GoogleProvider from 'next-auth/providers/google';

async function refreshAccessToken(token) {
  try {
    const url = 'https://oauth2.googleapis.com/token';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      // Fall back to old refresh token if the new one wasn't sent
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          // Scopes required for YouTube Data API comments moderation
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.force-ssl',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Save the access token and refresh token in the JWT on the initial login
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Fetch user role from database on initial login
        try {
          const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
          const { data } = await supabaseAdmin
            .from('user_profiles')
            .select('role, is_active')
            .eq('email', token.email)
            .single();

          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
          const isDefaultAdmin = adminEmails.includes(token.email?.toLowerCase());

          let userRole = data?.role || 'user';
          if (isDefaultAdmin && userRole === 'user') {
            userRole = 'superadmin';
            await supabaseAdmin
              .from('user_profiles')
              .upsert({ email: token.email, role: 'superadmin' }, { onConflict: 'email' });
          }

          token.role = userRole;
          token.isActive = data?.is_active ?? true;
          token.roleRefreshedAt = Date.now();
        } catch (e) {
          token.role = 'user';
          token.isActive = true;
          token.roleRefreshedAt = Date.now();
        }
      }

      // Check / Refresh role & isActive status every 5 minutes
      if (!token.roleRefreshedAt || Date.now() - token.roleRefreshedAt > 5 * 60 * 1000) {
        try {
          const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
          const { data } = await supabaseAdmin
            .from('user_profiles')
            .select('role, is_active')
            .eq('email', token.email)
            .single();

          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
          const isDefaultAdmin = adminEmails.includes(token.email?.toLowerCase());

          let userRole = data?.role || 'user';
          if (isDefaultAdmin && userRole === 'user') {
            userRole = 'superadmin';
            await supabaseAdmin
              .from('user_profiles')
              .upsert({ email: token.email, role: 'superadmin' }, { onConflict: 'email' });
          }

          token.role = userRole;
          token.isActive = data?.is_active ?? true;
          token.roleRefreshedAt = Date.now();
        } catch (e) {
          // Keep existing values on error
        }
      }

      // Check if token is expired (giving a 5 minute safety window)
      const bufferTime = 300; // 5 minutes safety buffer
      if (Date.now() < ((token.expiresAt || 0) - bufferTime) * 1000) {
        return token;
      }
      // Token is expired or expiring soon, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.user.role = token.role || 'user';
      session.user.isActive = token.isActive ?? true;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
};

