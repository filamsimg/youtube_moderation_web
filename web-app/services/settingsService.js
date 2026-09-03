export const settingsService = {
  async getSettings() {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.settings || null;
    } catch (err) {
      console.error('Error fetching settings from API:', err);
      return null;
    }
  },

  async saveSettings(email, settings) {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Gagal menyimpan pengaturan');
      }
      const json = await res.json();
      return json?.settings || null;
    } catch (err) {
      console.error('Error saving settings to API:', err);
      throw err;
    }
  },
};

