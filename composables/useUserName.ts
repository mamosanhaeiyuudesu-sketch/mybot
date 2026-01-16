const NAME_STORAGE_KEY = 'calmcounsel-user-name';

export const useUserName = () => {
  const userName = useState<string>('user-name', () => '');
  const loaded = useState<boolean>('user-name-loaded', () => false);

  const saveUserName = (name: string) => {
    const trimmed = name.trim();
    userName.value = trimmed;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NAME_STORAGE_KEY, trimmed);
  };

  const ensureLoaded = () => {
    if (typeof window === 'undefined') return;
    if (loaded.value) return;
    loaded.value = true;
    const stored = window.localStorage.getItem(NAME_STORAGE_KEY);
    if (stored && stored.trim()) {
      userName.value = stored.trim();
    }
  };

  return {
    userName,
    saveUserName,
    ensureLoaded,
    loaded,
  };
};
